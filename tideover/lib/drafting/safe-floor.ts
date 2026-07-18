import {
  capabilityCommitment,
  requestedCapabilities,
  CAPABILITY_REGISTRY,
  type CapabilityKey,
} from "@/lib/drafting/capabilities";
import { bannedPhraseIn } from "@/lib/drafting/llm-lint";
import type { DraftContext, DrafterOutput } from "@/lib/drafting/ReplyDrafter";

/**
 * THE SAFE FLOOR — what ships when the LLM is blocked, rate-limited, or unconfigured.
 *
 * WHY IT EXISTS. In the ten-merchant run (docs/sim-2026-07-12) the gate blocked exactly
 * one draft — p09, day 13, a CALM customer who had moved twice and asked us to use the
 * address on her other pledge. The block was correct in outcome and wrong in reason, and
 * then the thing that shipped in its place was worse than the thing that was blocked:
 *
 *   - it announced "Your tracking is generating" — the product holds NO tracking data of
 *     any kind, and the order was in manufacturing. A fabricated physical fact.
 *   - it fired a refund-save script, volunteering the word "bank" at a customer who had
 *     never mentioned one.
 *   - it never mentioned the address. The entire ticket went unanswered.
 *
 * A floor that lies is not a floor, it is a trapdoor. The seeded templates have since been
 * stripped of every unsupportable claim by the platform lane (lib/onboarding.ts), but they
 * are still ticket-TYPE BLIND: the day-89 reassurance script fires at a calm address change
 * exactly as it fires at a WISMO. Type-awareness is this lane's, and this is it.
 *
 * THE RULE. The deterministic reassurance engine answers exactly one question — "where is
 * my order, and how long" — from the order's stage, its wait, and the merchant's own bands.
 * That is a real answer to a WISMO ticket and it is a NON-ANSWER to everything else. So:
 *
 *   the engine's script ships ONLY when the ticket is a status question AND the customer
 *   has not asked for something the product cannot do.
 *
 * Otherwise the floor produces a minimal, true, human-escalation reply — it names nothing
 * it cannot prove, promises no action, and hands the ticket to a person — and flags the
 * draft `needsHuman`. Never fabricate responsiveness. A blank space is safe; a confident
 * wrong answer is not.
 *
 * The engine (lib/engines/reassurance.ts) is untouched, and the eval harness reads the
 * engine directly, so no golden moves because of anything in this file.
 */

/**
 * The ONE ticket type the deterministic engine has a responsive script for. `refund`,
 * `deposit` (payment/customs) and `other` (address changes, add-ons, VIP/press) all get a
 * production-status blurb that answers a question the customer did not ask — 13 of the 28
 * bin-grade drafts in the run were exactly this.
 */
const RESPONSIVE_TYPES = new Set(["wismo"]);

export interface FloorDecision {
  /** true = the engine's reassurance script actually answers this ticket. */
  responsive: boolean;
  /** capabilities the CUSTOMER asked for that the product does not have. */
  requested: CapabilityKey[];
  reason: "status-question" | "unsupported-request" | "no-script-for-type" | "unsafe-script";
}

/** The ticket's own words — subject + body, whatever the ingest path managed to supply. */
function ticketText(ctx: DraftContext): string {
  return [ctx.ticket.subject ?? "", ctx.ticket.body ?? ""].filter(Boolean).join("\n");
}

/**
 * Can the deterministic engine honestly answer this ticket? Two ways to fail: the ticket
 * is not a status question, or it asks for a capability the product does not have (which
 * can arrive on ANY type — p09's address change was a status-typed ticket).
 */
export function floorDecision(ctx: DraftContext, enabled: Iterable<CapabilityKey | string> = []): FloorDecision {
  const requested = requestedCapabilities(ticketText(ctx), enabled);
  if (requested.length > 0) return { responsive: false, requested, reason: "unsupported-request" };

  // A missing type (a partial ticket on the ingest seam) is treated as a status question:
  // the engine's script is the correct default for "any update?", and a real capability ask
  // is caught above regardless of type.
  const type = ctx.ticket.type;
  if (type !== undefined && !RESPONSIVE_TYPES.has(type)) {
    return { responsive: false, requested, reason: "no-script-for-type" };
  }
  return { responsive: true, requested, reason: "status-question" };
}

/**
 * The truthful refusal for a capability we do not have, in the customer's language. Kept in
 * one place so the reply, the prompt and the lint cannot drift apart.
 */
const REFUSALS: Record<CapabilityKey, string> = {
  "address-change": "I can't change a shipping address from the support desk",
  "cancel-order": "I can't cancel an order from the support desk",
  "modify-order": "I can't change what's in an order from the support desk",
  refund: "I can't action a refund from the support desk",
  expedite: "I can't move an order up the production queue",
  "carrier-confirm": "I don't have carrier or tracking details in front of me",
  "factory-contact": "I can't get the line on the phone from here",
  "date-guarantee": "I can't give you a date I'd be guessing at",
};

/** Drop any sentence carrying one of the merchant's banned phrases, rather than word-surgery. */
function dropBanned(parts: string[], banned: string[] | undefined): string[] {
  const kept = parts.filter((p) => !bannedPhraseIn(p, banned));
  return kept.length > 0 ? kept : parts.map((p) => p);
}

/**
 * THE ESCALATION REPLY. Minimal, true, and it closes the loop with a human. It claims no
 * fact the product cannot prove, commits to no action the product cannot take, carries no
 * date and no band (the band answers a question this customer did not ask), and it ends in
 * the merchant's own sign-off so the operator can send it as-is.
 *
 * This is deliberately the same sentence for every merchant. It is the LAST thing standing
 * between a broken model call and a buyer's inbox, and it must be the safest sentence in
 * the product — not the cleverest.
 */
export function buildEscalationReply(ctx: DraftContext, decision: FloorDecision): string {
  const first = ctx.customer.firstName?.trim() || "there";
  const banned = ctx.merchant.brand.banned;

  const refusal = decision.requested
    .map((k) => REFUSALS[k])
    .filter(Boolean)
    .slice(0, 1)[0];

  const body = dropBanned(
    [
      `${first}, thank you for writing, and I'm sorry you're still waiting on this.`,
      refusal
        ? `${refusal}, so I'm not going to tell you it's done when it isn't.`
        : `This one needs a person rather than a template.`,
      `I want to get this exactly right for you — I'm looking into it personally and I'll come back to you.`,
    ],
    banned,
  );

  return `${body.join(" ")}\n\n${ctx.merchant.brand.signoff}`;
}

/**
 * The floor, made safe. Takes the deterministic engine's own output and either passes it
 * through (a status question the engine can answer) or replaces it with the escalation
 * reply and flags the draft for a human.
 *
 * `confidenceBand` and `priority` still ride along from the engine — they are metadata the
 * cockpit and the ledger read, and they stay true whatever the reply says. `needsHuman` is
 * the flag: this ticket got no real answer, and somebody has to give it one.
 */
export function safeFloor(
  ctx: DraftContext,
  engine: DrafterOutput,
  enabled: Iterable<CapabilityKey | string> = [],
): DrafterOutput {
  let decision = floorDecision(ctx, enabled);

  // THE SCRIPT ITSELF CAN LIE. The playbook templates are merchant-editable (the settings
  // surface writes them, and the seeded ones shipped "Your tracking is generating" for a
  // year). A template that commits to a capability we do not have is the merchant's own
  // signature on a promise the system will never keep — exactly what the capability lint
  // exists to stop — so the floor refuses to send it and hands the ticket to a person.
  // This is the structural backstop: whatever copy a merchant types, the floor cannot lie.
  if (decision.responsive && capabilityCommitment(engine.text, enabled)) {
    decision = { responsive: false, requested: decision.requested, reason: "unsafe-script" };
  }
  if (decision.responsive) return engine;

  return {
    text: buildEscalationReply(ctx, decision),
    confidenceBand: engine.confidenceBand,
    // an unanswered ticket outranks an answered one: it is the only signal the operator
    // gets that the product declined to speak for them.
    priority: "escalated",
    draftedBy: engine.draftedBy,
    needsHuman: true,
    unansweredReason: decision.reason,
    requestedCapabilities: decision.requested,
  };
}

/** Every capability key the registry knows — exported for the prompt + operator surfaces. */
export const KNOWN_CAPABILITIES: CapabilityKey[] = CAPABILITY_REGISTRY.map((c) => c.key);
