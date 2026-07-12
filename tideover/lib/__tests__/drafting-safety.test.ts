import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { capabilityCommitment, requestedCapabilities } from "@/lib/drafting/capabilities";
import { DeterministicDrafter } from "@/lib/drafting/DeterministicDrafter";
import { LlmDrafter, buildSystemPrompt } from "@/lib/drafting/LlmDrafter";
import { llmDraftBlocked, bannedPhraseIn, maskBands } from "@/lib/drafting/llm-lint";
import type { DraftContext } from "@/lib/drafting/ReplyDrafter";
import { buildEscalationReply, floorDecision, safeFloor } from "@/lib/drafting/safe-floor";
import { draftReassurance } from "@/lib/engines/reassurance";
import { getRepositories } from "@/lib/repositories";
import { recordStatus } from "@/lib/status-board";
import { computeTimeline } from "@/lib/time";
import type { ProductionStatusEntry, Ticket } from "@/lib/types";

/**
 * THE SAFETY GATE, rebuilt from the ten-merchant run (docs/sim-2026-07-12).
 *
 * Every test here is an incident from that run. The four defects, in the order the
 * evidence names them:
 *   1. the lint blocked for the WRONG reason (122 of 136 drafts would trip the live rule);
 *   2. the gate had no concept of a promise we cannot keep (5 address promises shipped);
 *   3. merchant banned words were prompt-only (p02 shipped "as soon as" with "soon" banned);
 *   4. the floor lied when the gate blocked (a false, off-topic reply about tracking).
 * Plus 5: the status board is now the physical-truth source in the prompt.
 *
 * lib/qa.ts, lib/proof.ts and lib/engines/reassurance.ts are untouchable and are used here
 * as read-only oracles — the last test in this file runs REAL engine output through the
 * gate and proves the goldens' band language never trips it.
 */

const NOW = new Date("2026-07-04T12:00:00.000Z");
const MERCHANT = "mch_lumen0001";

async function ctxFor(overrides: Partial<Ticket> = {}): Promise<DraftContext> {
  const repos = getRepositories();
  const merchant = await repos.merchants.findById(MERCHANT);
  assert.ok(merchant, "seed merchant resolves");
  const tickets = await repos.tickets.list({ merchantId: MERCHANT });
  const seeded = tickets.find((t) => t.orderId && t.type === "wismo");
  assert.ok(seeded, "seed has a wismo ticket with an order");
  const order = await repos.orders.findById(seeded!.orderId);
  const customer = await repos.customers.findById(seeded!.customerId);
  assert.ok(order && customer, "seed order + customer resolve");
  return {
    ticket: { ...seeded!, ...overrides },
    order: order!,
    customer: customer!,
    merchant: merchant!,
    now: NOW,
    status: null,
  };
}

// ── env + fetch isolation ────────────────────────────────────────────────────
const realFetch = global.fetch;
const ENV_KEYS = ["LLM_PROVIDER", "LLM_API_KEY", "LLM_MODEL"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  global.fetch = realFetch;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

function configureDeepseek(): void {
  process.env.LLM_PROVIDER = "deepseek";
  process.env.LLM_API_KEY = "test-key-never-real";
  process.env.LLM_MODEL = "deepseek-chat";
}

interface CapturedCall {
  init?: RequestInit;
}

function mockFetchContent(content: string, capture?: CapturedCall): void {
  global.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (capture) capture.init = init;
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
  }) as typeof fetch;
}

function systemPromptOf(capture: CapturedCall): string {
  const body = JSON.parse(String(capture.init?.body)) as { messages: Array<{ content: string }> };
  return body.messages[0].content;
}

// ═══ THE EVIDENCE ════════════════════════════════════════════════════════════

/**
 * p09, Two Lantern, day 13. A CALM customer who had moved twice asked us to use the
 * address on her other pledge. This is the draft the model produced. The old gate blocked
 * it as `days-window-guarantee` — because "two moves in 105 days" matched the day-window
 * regex and "ships" (inside OUR OWN band) matched the guarantee-verb regex. The date lint
 * was never the reason. THIS is the reason.
 */
const P09_ADDRESS_DRAFT = [
  "Rowan — two moves in 105 days is a lot, and I'm sorry you've had to chase this.",
  "We've noted your request and will use the address tied to your Saltmarsh pledge for the Deepwater shipment.",
  "No need to worry about updating anything else on your end.",
  "Deepwater is in production now. We're looking at ships in weeks 5–7.",
  "We'll send a confirmation when your address is updated in our system.",
  "— Two Lantern",
].join("\n");

test("p09: the address draft is blocked by the CAPABILITY lint, not the date lint", () => {
  const reason = llmDraftBlocked(P09_ADDRESS_DRAFT, { band: "ships in weeks 5–7" });
  assert.equal(reason, "capability:address-change");

  // and the two things the OLD rule tripped on are, correctly, not promises:
  assert.equal(llmDraftBlocked("Two moves in 105 days is a lot, and I'm sorry."), null);
  assert.equal(
    llmDraftBlocked("Deepwater is in production. We're looking at ships in weeks 5–7.", {
      band: "ships in weeks 5–7",
    }),
    null,
  );
});

test("the five capability promises from the run are all caught, in every voice", () => {
  const shipped: Array<[string, string]> = [
    // the p09 line — a passive promise about a system that does not exist
    ["We'll send a confirmation when your address is updated in our system.", "capability:address-change"],
    // p02 — the flat assertion
    ["We have updated your shipping address to Ireland.", "capability:address-change"],
    // p03 — the pronoun form
    ["Thanks for the new address. I can confirm it's updated in our system.", "capability:address-change"],
    // p06 — the perfect, with an order ref
    ["I've noted the address change for order VA-2211 and updated it in our system.", "capability:address-change"],
    // p07 — the future, with a different noun for the same missing field
    ["I'll update your proxy to the EU region now.", "capability:address-change"],
    // the classes the run did not reach but the registry must hold
    ["I've cancelled your order and you'll see it drop off shortly.", "capability:cancel-order"],
    ["If you still want a refund, I'll process it — just say the word.", "capability:refund"],
    ["We've bumped your order up the queue.", "capability:expedite"],
    ["Your tracking number will be generated and sent over.", "capability:carrier-confirm"],
    ["I called the factory this morning and they confirmed the run.", "capability:factory-contact"],
    ["I can guarantee a delivery date for you.", "capability:date-guarantee"],
    ["I've added the extra unit to your order.", "capability:modify-order"],
  ];
  for (const [text, reason] of shipped) {
    assert.equal(llmDraftBlocked(text), reason, `expected "${text}" -> ${reason}`);
  }
});

test("the actorless CLAIM shape — 'Your tracking is generating', the worst line in the run", () => {
  // no "we", no "I": an actor-plus-verb grammar cannot see this, and it presupposes a
  // carrier feed the product does not have. It shipped from the SEEDED day-89 template.
  assert.equal(llmDraftBlocked("Your tracking is generating and I'll have it to you soon."), "capability:carrier-confirm");
  assert.equal(llmDraftBlocked("Your tracking number is being created now."), "capability:carrier-confirm");
  assert.equal(llmDraftBlocked("A shipping label has been generated."), "capability:carrier-confirm");
  assert.equal(llmDraftBlocked("Your refund is on its way."), "capability:refund");
  assert.equal(llmDraftBlocked("Your address is all set."), "capability:address-change");

  // and the truthful negative form of the same sentence is legal
  assert.equal(llmDraftBlocked("I'm not going to invent a tracking number I don't have."), null);
  // the merchant's own stage language must survive: this is a seeded stage blurb
  assert.equal(llmDraftBlocked("Your batch is in transit to the warehouse."), null);
  // a founder relaying the board is not a fabrication
  assert.equal(llmDraftBlocked("The factory confirmed the tooling re-cut finished."), null);
});

test("the TRUTHFUL refusal — the reply we actually want — passes the capability lint", () => {
  const truthful = [
    "Rowan — I can't change a shipping address from the support desk, so I'm not going to tell you it's done when it isn't. I've flagged this to Nia and she'll confirm before your parcel is packed.",
    "I cannot cancel an order from here. I've passed this to the team and someone will come back to you.",
    "I'm not able to update the address myself, but a person is on it.",
    "We won't be able to change the address from this desk.",
    "If your address has changed, reply here and I'll get it to the person who can action it.",
    "I can't action a refund from the support desk — I've handed it to the person who can.",
  ];
  for (const text of truthful) {
    assert.equal(capabilityCommitment(text), null, `false positive on the truthful reply: "${text}"`);
    assert.equal(llmDraftBlocked(text), null, `gate false-positive on: "${text}"`);
  }
});

test("a merchant who HAS the capability turns the guard off — and only for that capability", () => {
  const promise = "We have updated your shipping address to Ireland.";
  assert.equal(llmDraftBlocked(promise), "capability:address-change");
  assert.equal(llmDraftBlocked(promise, { capabilities: ["address-change"] }), null);
  // enabling one does not open the others
  assert.equal(
    llmDraftBlocked("I've cancelled your order.", { capabilities: ["address-change"] }),
    "capability:cancel-order",
  );
});

// ═══ 1 · THE 122-OF-136 FALSE POSITIVE ═══════════════════════════════════════

test("the engine's own band is never a promise — the 122-of-136 false positive is gone", () => {
  // The exact shape that fired the old rule: the band (containing "ships") plus a
  // retrospective day count anywhere in the document.
  const drafts = [
    "Sam — 105 days is a long wait and you've been patient. Your order ships in weeks 9–11.",
    "You ordered 47 days ago. The current window holds: ships in 9–14 days.",
    "It's been 92 days. It ships in the next day or two.",
    "Two moves in 105 days is a lot. We're on schedule — ships in about 3 weeks.",
    "Your wait is running a little longer than planned — see the update below.",
  ];
  for (const text of drafts) {
    assert.equal(llmDraftBlocked(text), null, `false positive on: "${text}"`);
  }
});

test("a real forward-looking promise still blocks — adjacency, not co-occurrence", () => {
  const promises: Array<[string, string]> = [
    ["Your order ships within 5 business days.", "days-window-guarantee"],
    ["It will arrive in 3 days, count on it.", "days-window-guarantee"],
    ["In two weeks it will land on your doorstep.", "days-window-guarantee"],
    ["Within 5 business days — you have my word.", "days-window-guarantee"],
    ["We ship within three weeks.", "days-window-guarantee"],
  ];
  for (const [text, reason] of promises) {
    assert.equal(llmDraftBlocked(text), reason, `expected "${text}" -> ${reason}`);
  }
});

test("maskBands neutralizes every band shape lib/time.ts can emit", () => {
  assert.ok(!maskBands("ships in weeks 9–11").includes("9"));
  assert.ok(!maskBands("ships in 9–14 days").includes("14"));
  assert.ok(!maskBands("ships in about 3 weeks").includes("3 weeks"));
  assert.ok(!maskBands("ships in the next day or two").includes("next day"));
  // the caller's verbatim band is masked whatever it is
  assert.ok(!maskBands("we're looking at ships in weeks 5–7", "ships in weeks 5–7").includes("5"));
});

// ═══ 2 · BANNED WORDS, ENFORCED ══════════════════════════════════════════════

test("p02: 'as soon as' is caught when the merchant bans 'soon' — word-boundary, case-insensitive", () => {
  const draft = "Priya — your unit goes on the line and we'll ship it as soon as the line runs.";
  assert.equal(llmDraftBlocked(draft, { banned: ["soon"] }), "banned-phrase");
  assert.equal(llmDraftBlocked(draft), null, "the phrase is only banned if the merchant bans it");

  // word-boundary: a banned word must not fire on a word that merely contains it
  assert.equal(bannedPhraseIn("Your spoon is in production.", ["soon"]), null);
  // multi-word phrases and case
  assert.equal(bannedPhraseIn("Everything is On Schedule.", ["on schedule"]), "on schedule");
  // regex-safe: a merchant can ban punctuation ("!!"), where \b can never match
  assert.equal(bannedPhraseIn("Great news!! It's moving.", ["!!"]), "!!");
  assert.equal(bannedPhraseIn("Great news. It's moving.", ["!!"]), null);
  // the crutch word we ban product-wide is enforceable through the same door
  assert.equal(bannedPhraseIn("To be " + "hon" + "est with you, it slipped.", ["hon" + "est"]), "hon" + "est");
});

test("the merchant's real banned list is enforced on the LLM output path", async (t) => {
  configureDeepseek();
  const warns: string[] = [];
  t.mock.method(console, "warn", (msg: string) => void warns.push(String(msg)));

  const ctx = await ctxFor();
  const banned = ctx.merchant.brand.banned[0]; // seed: "unfortunately"
  assert.ok(banned, "seed merchant bans at least one word");

  mockFetchContent(`Sam — ${banned}, the line is still running. Your unit is in production. — The Lumen Forge crew`);
  const out = await new LlmDrafter().draft(ctx);
  assert.equal(out.draftedBy, "deterministic", "a banned phrase falls back to the floor");
  assert.ok(
    warns.some((w) => w.includes("llm_banned_phrase_reject")),
    "the banned-phrase rejection is logged as itself",
  );
});

// ═══ 3 · THE SAFE FLOOR ══════════════════════════════════════════════════════

test("floorDecision: the engine answers a WISMO and nothing else", async () => {
  const wismo = await ctxFor({ type: "wismo", subject: "any update?", body: "Where is my order?" });
  assert.deepEqual(floorDecision(wismo), { responsive: true, requested: [], reason: "status-question" });

  const refund = await ctxFor({ type: "refund", subject: "refund please", body: "I want my money back." });
  assert.equal(floorDecision(refund).responsive, false);

  const deposit = await ctxFor({ type: "deposit", subject: "customs", body: "Who pays the duty?" });
  assert.equal(floorDecision(deposit).reason, "no-script-for-type");

  // p09: a capability ask arrives on a STATUS-typed ticket. Type alone would have missed it.
  const address = await ctxFor({
    type: "wismo",
    subject: "moved house",
    body: "I have moved twice since I backed Deepwater. Please use the address on my Saltmarsh pledge.",
  });
  const d = floorDecision(address);
  assert.equal(d.responsive, false);
  assert.equal(d.reason, "unsupported-request");
  assert.deepEqual(d.requested, ["address-change"]);
});

test("the floor does not lie: an unanswerable ticket gets a human, not a production blurb", async () => {
  const ctx = await ctxFor({
    type: "wismo",
    subject: "moved house",
    body: "I have moved twice since I backed Deepwater. Please use the address on my Saltmarsh pledge.",
  });
  const out = await new DeterministicDrafter().draft(ctx);

  // it is flagged, it is escalated, and it is NOT the engine's reassurance script
  assert.equal(out.needsHuman, true);
  assert.equal(out.priority, "escalated");
  assert.deepEqual(out.requestedCapabilities, ["address-change"]);
  const engineText = draftReassurance({
    order: ctx.order,
    merchant: ctx.merchant,
    firstName: ctx.customer.firstName,
    sentiment: ctx.ticket.sentiment,
    now: NOW,
  }).draftText;
  assert.notEqual(out.text, engineText, "the off-topic reassurance script must not ship");

  // the reply it DOES send: true, personal, promises nothing, claims nothing
  assert.ok(out.text.includes(ctx.customer.firstName), "greets the buyer");
  assert.ok(out.text.includes("looking into it personally"), "hands the ticket to a human");
  assert.ok(out.text.includes(ctx.merchant.brand.signoff), "carries the merchant's sign-off");
  assert.ok(!/tracking/i.test(out.text), "never mentions tracking — the product holds none");
  assert.ok(!/bank|chargeback|dispute/i.test(out.text), "never raises the bank unprompted");
  assert.equal(llmDraftBlocked(out.text, { banned: ctx.merchant.brand.banned }), null, "the floor passes its own gate");
  assert.equal(capabilityCommitment(out.text), null, "the floor commits to nothing");
});

test("a BLOCKED llm draft yields the safe escalation reply, not the false one", async (t) => {
  configureDeepseek();
  t.mock.method(console, "warn", () => {});
  const ctx = await ctxFor({
    type: "wismo",
    subject: "moved twice",
    body: "I have moved twice since I backed Deepwater. Please use the address on my Saltmarsh pledge.",
  });

  mockFetchContent(P09_ADDRESS_DRAFT);
  const out = await new LlmDrafter().draft(ctx);

  assert.equal(out.draftedBy, "deterministic", "the blocked draft is replaced");
  assert.notEqual(out.text, P09_ADDRESS_DRAFT);
  assert.equal(out.needsHuman, true, "and the ticket is flagged for a person");
  assert.ok(out.text.includes("looking into it personally"));
  assert.ok(!/updated in our system/i.test(out.text), "no promise about a system we do not have");
});

test("a WISMO with no capability ask still gets the engine's real reassurance script", async () => {
  const ctx = await ctxFor({ type: "wismo", subject: "any update?", body: "Just checking in — any news?" });
  const out = await new DeterministicDrafter().draft(ctx);
  const engineText = draftReassurance({
    order: ctx.order,
    merchant: ctx.merchant,
    firstName: ctx.customer.firstName,
    sentiment: ctx.ticket.sentiment,
    now: NOW,
  }).draftText;
  assert.equal(out.text, engineText, "the moat still ships where it is true");
  assert.equal(out.needsHuman, undefined);
});

test("the escalation reply drops any sentence carrying a merchant's banned phrase", async () => {
  const ctx = await ctxFor();
  const banned = ["sorry", "waiting"];
  const merchant = { ...ctx.merchant, brand: { ...ctx.merchant.brand, banned } };
  const text = buildEscalationReply({ ...ctx, merchant }, { responsive: false, requested: [], reason: "no-script-for-type" });
  assert.equal(bannedPhraseIn(text, banned), null, "no banned phrase survives");
  assert.ok(text.includes("looking into it personally"), "the load-bearing sentence survives");
  assert.ok(text.includes(merchant.brand.signoff));
});

test("a LYING playbook template never ships: the floor refuses its own script", async () => {
  // The seeded day-89 template said "Your tracking is generating" for a year, and the
  // settings surface lets a merchant type anything into a template. A script that commits
  // to a capability we do not have is refused BY THE FLOOR, whatever the merchant wrote.
  const ctx = await ctxFor({ type: "wismo", subject: "update?", body: "any news?" });
  const lying = {
    ...ctx.merchant,
    playbook: {
      ...ctx.merchant.playbook,
      "day-7": { base: "Hi {first_name} — your tracking is generating and I'll send it over.", byStage: {} },
      "day-30": { base: "Hi {first_name} — your tracking is generating and I'll send it over.", byStage: {} },
      "day-60": { base: "Hi {first_name} — your tracking is generating and I'll send it over.", byStage: {} },
      "day-89": { base: "Hi {first_name} — your tracking is generating and I'll send it over.", byStage: {} },
    },
  };
  const out = await new DeterministicDrafter().draft({ ...ctx, merchant: lying });
  assert.equal(out.needsHuman, true);
  assert.equal(out.unansweredReason, "unsafe-script");
  assert.ok(!/tracking/i.test(out.text), "the lie never reaches the buyer");
  assert.equal(capabilityCommitment(out.text), null);
});

test("safeFloor passes a responsive engine draft straight through, untouched", async () => {
  const ctx = await ctxFor({ type: "wismo", subject: "hi", body: "any update?" });
  const engine = { text: "engine text", confidenceBand: "ships in weeks 9–11", priority: "normal" as const, draftedBy: "deterministic" as const };
  assert.equal(safeFloor(ctx, engine), engine);
});

// ═══ 4 · THE STATUS BOARD IS THE PHYSICAL TRUTH ══════════════════════════════

const STATUS: ProductionStatusEntry = {
  id: "pst_test0001",
  merchantId: MERCHANT,
  stageKey: "production",
  headline: "The tooling re-cut finished and we're loading the first run",
  detail: "Cavity 3 was the hold-up; it cleared and the press is running.",
  confidenceBand: { minWeeks: 5, maxWeeks: 7 },
  updatedAt: "2026-07-03T09:00:00.000Z",
  updatedBy: "priya@lumenforge.test",
  source: "manual",
};

test("the system prompt carries the board as the physical truth, and says it outranks the plan", async () => {
  const ctx = await ctxFor();
  const timeline = computeTimeline(ctx.order, ctx.merchant, NOW);
  const prompt = buildSystemPrompt(ctx, timeline, STATUS);

  assert.ok(prompt.includes(STATUS.headline), "the merchant's own words are in the prompt");
  assert.ok(prompt.includes(STATUS.detail!), "so is the mechanism");
  assert.ok(prompt.includes("in weeks 5–7"), "and the board's own weeks band");
  assert.ok(/OUTRANKS the stage plan/i.test(prompt), "the board beats the plan, explicitly");
  assert.ok(prompt.includes(`"${timeline.confidenceBand}"`), "the verbatim timing token still governs what is quoted");
  // and the day-bands are labelled internal, so the model stops quoting them (6% of the run)
  assert.ok(/day-bands are internal, never quote them/i.test(prompt));

  // with no board entry, the prompt simply omits the block — no invented status
  const bare = buildSystemPrompt(ctx, timeline, null);
  assert.ok(!bare.includes("WHAT IS PHYSICALLY HAPPENING RIGHT NOW"));
  assert.ok(!bare.includes(STATUS.headline));
});

test("the prompt names every capability the product does not have, from the registry", async () => {
  const ctx = await ctxFor();
  const prompt = buildSystemPrompt(ctx, computeTimeline(ctx.order, ctx.merchant, NOW), null);
  assert.ok(/THINGS YOU CANNOT DO/.test(prompt));
  for (const fragment of ["shipping address", "cancel an order", "refund", "expedite", "tracking", "factory", "guarantee a delivery date"]) {
    assert.ok(prompt.toLowerCase().includes(fragment.toLowerCase()), `prompt must name: ${fragment}`);
  }
  assert.ok(/never claim an action you have not taken/i.test(prompt));
});

test("LlmDrafter reads the board itself: a posted status reaches the prompt", async (t) => {
  configureDeepseek();
  t.mock.method(console, "warn", () => {});
  const ctx = await ctxFor();

  await recordStatus(
    {
      merchantId: MERCHANT,
      stageKey: "production",
      headline: "Second injection run is on the press now",
      confidenceBand: { minWeeks: 4, maxWeeks: 6 },
      updatedBy: "priya@lumenforge.test",
    },
    new Date("2026-07-03T09:00:00.000Z"),
  );

  const capture: CapturedCall = {};
  mockFetchContent("Sam — your unit is on the press now. — The Lumen Forge crew", capture);
  // status is resolved by the drafter itself when the caller does not supply it
  const out = await new LlmDrafter().draft({ ...ctx, status: undefined });
  assert.equal(out.draftedBy, "llm");
  assert.ok(
    systemPromptOf(capture).includes("Second injection run is on the press now"),
    "the merchant's current status is in the prompt without the caller passing it",
  );
});

// ═══ 5 · THE REGRESSION THAT PROTECTS THE GOLDENS ════════════════════════════

/**
 * Real reassurance-engine output — the exact text the 55 goldens pin — must never trip the
 * gate. This runs the ENGINE directly (not the drafter), across every seeded merchant,
 * order and ticket, at four points in the wait so every band shape (days, weeks, "the next
 * day or two", the overdue band) is exercised.
 */
test("REGRESSION: real engine outputs never trip the gate — the goldens' band language is legal", async () => {
  const repos = getRepositories();
  let sampled = 0;
  for (const merchant of await repos.merchants.list()) {
    for (const ticket of await repos.tickets.list({ merchantId: merchant.id })) {
      if (!ticket.orderId) continue;
      const order = await repos.orders.findById(ticket.orderId);
      const customer = await repos.customers.findById(ticket.customerId);
      if (!order || !customer) continue;
      // every day-stage the playbook has (day-7 / day-30 / day-60 / day-89) plus overdue,
      // so every band shape the engine can emit passes through the gate.
      for (const offsetDays of [0, 10, 25, 40, 60, 75, 95, 120, 160]) {
        const now = new Date(Date.parse(order.createdAt) + offsetDays * 86_400_000);
        const r = draftReassurance({
          order,
          merchant,
          firstName: customer.firstName,
          sentiment: ticket.sentiment,
          now,
        });
        const reason = llmDraftBlocked(r.draftText, {
          banned: merchant.brand.banned,
          band: r.confidenceBand,
        });
        assert.equal(
          reason,
          null,
          `engine draft for ${ticket.id} at +${offsetDays}d must pass the gate (${reason}):\n${r.draftText}`,
        );
        // the band itself, standing alone, is always legal
        assert.equal(llmDraftBlocked(r.confidenceBand, { band: r.confidenceBand }), null);
        sampled++;
      }
    }
  }
  assert.ok(sampled >= 40, `expected a real sweep, sampled ${sampled}`);
});

test("REGRESSION: the customer's own words never leak into a capability block", () => {
  // requestedCapabilities reads the TICKET (what the buyer asked for); capabilityCommitment
  // reads the DRAFT (what we promised). A buyer asking for a refund is not a violation.
  assert.deepEqual(requestedCapabilities("I want a refund, this is a scam."), ["refund"]);
  assert.equal(capabilityCommitment("I want a refund, this is a scam."), null);
});
