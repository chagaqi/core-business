/**
 * THE CAPABILITY REGISTRY — the list of things Tideover CANNOT do, and the
 * language that would commit the merchant to doing them anyway.
 *
 * WHY IT EXISTS. In the ten-merchant run (docs/sim-2026-07-12) the send-gate was
 * a DATE LEXICON and nothing else. It caught 0 hard dates out of 136 drafts — a
 * real achievement — and then let through the single most dangerous line in the
 * corpus:
 *
 *     "We'll send a confirmation when your address is updated in our system."
 *
 * There is no address field on `Order` or `Customer`. There is no such system.
 * Five replies made that class of promise ("We have updated your shipping address
 * to Ireland", "I can confirm it's updated in our system", "I've noted the address
 * change for order VA-2211 and updated it in our system", "I'll update your proxy
 * to the EU region now"). One of them went to a customer moving a parcel away from
 * her ex. The parcel goes to the ex, and the merchant told her in writing that it
 * would not.
 *
 * That is a proof-only violation of the highest order (ADR-0002): not an invented
 * NUMBER, an invented ACTION — the merchant's own signature on a promise the system
 * will never keep. The old prompt forbade inventing FACTS and said nothing about
 * inventing ACTIONS, and the old lint had no concept of a capability at all.
 *
 * THE MODEL.
 *  - One data-driven registry. Every entry names a capability the product does not
 *    have, the verbs that constitute PERFORMING it, the objects it is performed ON,
 *    and the way a customer ASKS for it.
 *  - The registry is read in three directions:
 *      1. the SYSTEM PROMPT (LlmDrafter) tells the model, by name, what it cannot
 *         do and what to say instead;
 *      2. the OUTPUT LINT (llm-lint) blocks any draft that commits to one, in any
 *         phrasing, in any voice;
 *      3. the SAFE FLOOR (safe-floor) detects a customer ASKING for one and refuses
 *         to answer with a reassurance script that does not answer the question.
 *  - A merchant who ACQUIRES a capability turns it on: `enabledCapabilities()` reads
 *    an optional `capabilities` list off the merchant, and an enabled capability is
 *    dropped from all three of the above. The day `Order` grows an address field and
 *    an address-change write path, that merchant sets `capabilities: ["address-change"]`
 *    and the guardrail steps aside for them and nobody else.
 *
 * PRECISION DOCTRINE. A commitment is an ACTOR + an ACTION + the OBJECT, adjacent.
 * Co-occurrence anywhere in a document is what produced the 122-of-136 false-positive
 * rate on the old date lint, and it is not repeated here. The truthful reply we WANT
 * the model to write — "I can't change an address from here, I've flagged it to Nia
 * and she'll confirm before your parcel is packed" — must pass, and it is pinned by
 * test. Negations fail to match by construction: the auxiliary allowlist below has no
 * "can't" / "cannot" / "unable", so a refusal can never be read as a commitment.
 */

export type CapabilityKey =
  | "address-change"
  | "cancel-order"
  | "modify-order"
  | "refund"
  | "expedite"
  | "carrier-confirm"
  | "factory-contact"
  | "date-guarantee";

export interface Capability {
  key: CapabilityKey;
  /** what the product cannot do, in the words the system prompt uses. */
  label: string;
  /** what the product WOULD need to do it — why this is on the list, not in the app. */
  requires: string;
  /** verbs whose performance IS the capability (regex source, no anchors). */
  verbs: string[];
  /** the objects those verbs must act ON for the sentence to be a commitment. */
  objects: string[];
  /**
   * verbs that, in the passive, assert the action was performed ("your address is
   * UPDATED in our system"). Subset of `verbs`, past-participle forms.
   */
  participles: string[];
  /** how a CUSTOMER asks for it — used by the safe floor, never by the output lint. */
  requests: string[];
  /**
   * Assertions ABOUT the object that PRESUPPOSE the capability, with no actor at all:
   * "Your tracking is generating" — the single worst line in the ten-merchant run, and a
   * sentence with no "we" and no "I" in it. An actor-plus-verb grammar cannot see it, so
   * these are matched on their own.
   */
  claims: string[];
  /** the truthful thing to say instead. Goes into the system prompt verbatim. */
  insteadSay: string;
}

/**
 * THE REGISTRY. Every entry is a promise the product cannot keep today.
 * Adding a capability = adding a row. Granting one to a merchant = enabling the key.
 */
export const CAPABILITY_REGISTRY: readonly Capability[] = [
  {
    key: "address-change",
    label: "change, correct or note a shipping address",
    requires: "an address field on the order and a write path to the packing list — neither exists",
    verbs: [
      "updat(?:e|ed|ing)",
      "chang(?:e|ed|ing)",
      "correct(?:ed|ing)?",
      "amend(?:ed|ing)?",
      "switch(?:ed|ing)?",
      "swap(?:ped|ping)?",
      "fix(?:ed|ing)?",
      "not(?:e|ed|ing)",
      "record(?:ed|ing)?",
      "sav(?:e|ed|ing)",
      "add(?:ed|ing)?",
      "set",
      "confirm(?:ed|ing)?",
      "appl(?:y|ied)",
    ],
    objects: [
      "(?:shipping|delivery|mailing|postal|home|new|correct|updated)?\\s*address(?:es)?",
      "address\\s+change",
      "shipping\\s+(?:details|info(?:rmation)?)",
      "delivery\\s+(?:details|info(?:rmation)?)",
      "ship-?to",
      "proxy",
      "packing\\s+list",
    ],
    participles: ["updated", "changed", "corrected", "amended", "switched", "noted", "recorded", "saved", "set", "confirmed", "applied", "fixed"],
    requests: [
      "\\b(?:chang|updat|correct|amend|switch|fix)\\w*\\b[^.?!]{0,40}\\baddress\\b",
      "\\baddress\\b[^.?!]{0,40}\\b(?:chang|updat|correct|wrong|old|new|different)\\w*\\b",
      "\\b(?:use|ship\\s+to|send\\s+it\\s+to|deliver\\s+to)\\b[^.?!]{0,40}\\b(?:address|pledge|proxy)\\b",
      "\\b(?:i\\s+(?:have\\s+)?moved|i\\s+move[d]?|we\\s+moved|new\\s+place)\\b",
      "\\bwrong\\s+(?:address|street|postcode|zip)\\b",
    ],
    claims: [
      "\\baddress\\s+(?:is|are|'s|has\\s+been|have\\s+been|will\\s+be|is\\s+being)\\s+(?:updated|changed|corrected|amended|noted|saved|recorded|sorted|on\\s+file|all\\s+set)",
      "\\baddress\\s+change\\s+(?:is|has\\s+been|will\\s+be)\\s+(?:noted|applied|processed|done|actioned)",
    ],
    insteadSay:
      "say plainly that you cannot change an address from the support desk, that you have flagged it to the team, and that a human will confirm before the parcel is packed",
  },
  {
    key: "cancel-order",
    label: "cancel an order or a pledge",
    requires: "a cancellation write path into the merchant's store / pledge manager — not built",
    verbs: [
      "cancel(?:led|ed|ling|ing)?",
      "clos(?:e|ed|ing)",
      "void(?:ed|ing)?",
      "remov(?:e|ed|ing)",
      "delet(?:e|ed|ing)",
      "pull(?:ed|ing)?",
    ],
    objects: [
      "(?:your|the|this)?\\s*(?:order|pledge|preorder|pre-order|backing|subscription)",
    ],
    participles: ["cancelled", "canceled", "closed", "voided", "removed", "deleted"],
    requests: [
      "\\bcancel\\b[^.?!]{0,40}\\b(?:order|pledge|preorder|pre-order|it|everything)\\b",
      "\\b(?:i\\s+want\\s+out|pull\\s+my\\s+pledge|back\\s+out)\\b",
    ],
    claims: [
      "\\b(?:your|the|this)\\s+(?:order|pledge|preorder|pre-order)\\s+(?:is|has\\s+been|will\\s+be)\\s+(?:cancelled|canceled|closed|voided|removed)",
    ],
    insteadSay:
      "say that you cannot cancel from the support desk, that you have flagged it to the team, and that a human will come back to confirm",
  },
  {
    key: "modify-order",
    label: "change what is in an order (add-ons, size, colour, quantity, swaps)",
    requires: "a line-item write path into the store / pledge manager — not built",
    verbs: [
      "add(?:ed|ing)?",
      "chang(?:e|ed|ing)",
      "swap(?:ped|ping)?",
      "switch(?:ed|ing)?",
      "upgrad(?:e|ed|ing)",
      "downgrad(?:e|ed|ing)",
      "amend(?:ed|ing)?",
      "updat(?:e|ed|ing)",
      "includ(?:e|ed|ing)",
    ],
    objects: [
      "(?:the|your|an|a)?\\s*(?:add-?ons?|extra\\s+unit|second\\s+unit|colou?r|size|variant|quantity|line\\s+item)",
      "(?:to|onto)\\s+(?:your|the)\\s+(?:order|pledge)",
    ],
    participles: ["added", "changed", "swapped", "switched", "upgraded", "amended", "updated", "included"],
    requests: [
      "\\b(?:add|swap|change|switch|upgrade)\\b[^.?!]{0,40}\\b(?:add-?on|colou?r|size|unit|item|to\\s+my\\s+(?:order|pledge))\\b",
    ],
    claims: [
      "\\b(?:the|your)\\s+(?:add-?on|extra\\s+unit|second\\s+unit|colou?r|size|variant)\\s+(?:is|has\\s+been|will\\s+be)\\s+(?:added|changed|swapped|switched|updated|included)",
    ],
    insteadSay:
      "say that you cannot change what is in an order from the support desk, and that you have flagged it to a human who will confirm",
  },
  {
    key: "refund",
    label: "issue a refund, a partial refund, or a payment reversal",
    requires: "a payment-processor integration and a refund write path — not built (no processor dependency ships)",
    verbs: [
      "refund(?:ed|ing)?",
      "process(?:ed|ing)?",
      "issu(?:e|ed|ing)",
      "start(?:ed|ing)?",
      "initiat(?:e|ed|ing)",
      "arrang(?:e|ed|ing)",
      "sen(?:d|t|ding)",
      "return(?:ed|ing)?",
      "revers(?:e|ed|ing)",
      "put\\s+through",
    ],
    objects: [
      "(?:the|your|a|a\\s+full|a\\s+partial|your\\s+full)?\\s*refund",
      "(?:your|the)\\s+money(?:\\s+back)?",
      "money\\s+back",
      "(?:your|the)\\s+payment\\s+back",
    ],
    participles: ["refunded", "processed", "issued", "started", "initiated", "arranged", "sent", "returned", "reversed"],
    requests: [
      "\\brefund\\b",
      "\\bmoney\\s+back\\b",
      "\\bmy\\s+money\\b",
    ],
    claims: [
      "\\b(?:your|the|a)\\s+refund\\s+(?:is|'s|has\\s+been|will\\s+be|is\\s+being)\\s+(?:processed|processing|issued|started|initiated|underway|in\\s+progress|approved|on\\s+its\\s+way|on\\s+the\\s+way|sorted|done)",
      "\\bmoney\\s+(?:is|will\\s+be|has\\s+been)\\s+(?:back|returned|refunded|on\\s+its\\s+way)",
    ],
    insteadSay:
      "never say a refund is processed, started or on its way. Say that you have passed the refund request to the person who can action it, and that they will come back",
  },
  {
    key: "expedite",
    label: "expedite, rush, prioritise or bump an order up the queue",
    requires: "a production/fulfilment write path at the factory or 3PL — not built",
    verbs: [
      "expedit(?:e|ed|ing)",
      "rush(?:ed|ing)?",
      "prioriti[sz](?:e|ed|ing)",
      "bump(?:ed|ing)?",
      "mov(?:e|ed|ing)\\s+(?:you|your\\s+order)?\\s*(?:up|forward)",
      "fast-?track(?:ed|ing)?",
      "push(?:ed|ing)?\\s+(?:you|your\\s+order)?\\s*(?:up|forward|ahead)",
      "put(?:ting)?\\s+(?:you|your\\s+order)?\\s*(?:first|at\\s+the\\s+front|to\\s+the\\s+front)",
    ],
    objects: [
      "(?:your|the|this)?\\s*(?:order|unit|pledge|parcel|shipment|delivery|dispatch)",
      "(?:the|your)?\\s*queue",
      "(?:you|it)",
    ],
    participles: ["expedited", "rushed", "prioritised", "prioritized", "bumped", "fast-tracked"],
    requests: [
      "\\b(?:expedite|rush|prioriti[sz]e|hurry|speed\\s+(?:it|this)\\s+up|move\\s+me\\s+up)\\b",
    ],
    claims: [
      "\\b(?:your|the)\\s+(?:order|unit|pledge)\\s+(?:is|has\\s+been|will\\s+be)\\s+(?:expedited|rushed|prioriti[sz]ed|bumped|fast-?tracked|moved\\s+up|first\\s+out)",
    ],
    insteadSay:
      "never offer to move an order up the queue. Say what is physically happening and that you have flagged the request to the team",
  },
  {
    key: "carrier-confirm",
    label: "confirm a carrier, a tracking number, a label, or that a parcel has shipped",
    requires: "a carrier/3PL feed — nothing in the product holds tracking data of any kind",
    verbs: [
      "generat(?:e|ed|ing)",
      "issu(?:e|ed|ing)",
      "creat(?:e|ed|ing)",
      "book(?:ed|ing)?",
      "confirm(?:ed|ing)?",
      "sen(?:d|t|ding)",
      "shar(?:e|ed|ing)",
      "email(?:ed|ing)?",
      "attach(?:ed|ing)?",
    ],
    objects: [
      "(?:your|the|a)?\\s*tracking(?:\\s+(?:number|link|code|details|info(?:rmation)?))?",
      "(?:your|the|a)?\\s*(?:shipping\\s+)?label",
      "(?:your|the|a)?\\s*(?:carrier|courier)(?:\\s+details)?",
      "(?:your|the|a)?\\s*(?:airway\\s*bill|waybill|consignment)",
    ],
    participles: ["generated", "issued", "created", "booked", "confirmed", "sent", "shared", "emailed", "attached"],
    requests: [
      "\\btracking\\b",
      "\\b(?:carrier|courier|waybill|label)\\b",
    ],
    claims: [
      // "Your tracking is generating" — the worst line in the ten-merchant run, and a
      // sentence with no actor in it at all. It presupposes a carrier feed we do not have.
      "\\btracking(?:\\s+(?:number|link|code|details|info(?:rmation)?))?\\s+(?:is|'s|are|has\\s+been|have\\s+been|will\\s+be|is\\s+being)\\s+(?:generat\\w+|creat\\w+|issu\\w+|process\\w+|prepar\\w+|ready|live|active|available|coming|on\\s+its\\s+way|on\\s+the\\s+way|with\\s+you|en\\s+route)",
      "\\b(?:a|the|your)\\s+(?:shipping\\s+)?label\\s+(?:is|has\\s+been|will\\s+be)\\s+(?:generat\\w+|creat\\w+|printed|purchased|booked|ready)",
    ],
    insteadSay:
      "never claim tracking exists, is generating, or is on its way. The product holds no tracking data. Say what stage the order is physically at",
  },
  {
    key: "factory-contact",
    label: "contact the factory, supplier, kiln or line on demand and report back",
    requires: "a person on the merchant's side doing it — the support desk cannot do it, and inventing the call invents the answer",
    verbs: [
      "call(?:ed|ing)?",
      "phon(?:e|ed|ing)",
      "email(?:ed|ing)?",
      "messag(?:e|ed|ing)",
      "contact(?:ed|ing)?",
      "chas(?:e|ed|ing)",
      "check(?:ed|ing)?\\s+with",
      "spok(?:e|en)\\s+(?:to|with)",
      "reach(?:ed|ing)?\\s+out\\s+to",
      "ask(?:ed|ing)?",
    ],
    objects: [
      "(?:the|our|your)?\\s*(?:factory|supplier|manufacturer|kiln|foundry|press|line|plant|workshop|vendor|3pl|warehouse)",
    ],
    participles: ["called", "phoned", "emailed", "messaged", "contacted", "chased", "asked"],
    requests: [
      "\\b(?:call|ask|check\\s+with|chase)\\b[^.?!]{0,30}\\b(?:factory|supplier|manufacturer|kiln|warehouse)\\b",
    ],
    // No `claims` here on purpose: "the factory confirmed the re-cut" is a sentence a
    // FOUNDER can truthfully post to the status board, and the model is supposed to relay
    // the board. Only a claim that WE made the call (actor + verb) is a fabrication.
    claims: [],
    insteadSay:
      "never claim to have contacted, called or chased the factory. Report only the production status on file",
  },
  {
    key: "date-guarantee",
    label: "guarantee a delivery date, a ship date, or a deadline",
    requires: "a fulfilment date the merchant does not have — the whole ICP is merchants whose plan broke (ADR-0002)",
    verbs: ["guarantee(?:d|ing|s)?", "promis(?:e|ed|ing|es)", "assur(?:e|ed|ing)", "commit(?:ted|ting)?", "lock(?:ed|ing)?\\s+in"],
    objects: [
      "(?:a|the|your|this)?\\s*(?:delivery|ship(?:ping)?|arrival|dispatch)?\\s*(?:date|deadline|day)",
      "(?:a|the|your)?\\s*(?:eta|delivery\\s+window)",
    ],
    participles: ["guaranteed", "promised", "assured", "committed"],
    requests: [],
    claims: [
      "\\b(?:delivery|ship(?:ping)?|arrival|dispatch)\\s+date\\s+(?:is|has\\s+been|will\\s+be)\\s+(?:confirmed|locked(?:\\s+in)?|guaranteed|set|fixed)",
    ],
    insteadSay:
      "never guarantee a date, an ETA or a deadline. The only timing you may give is the verbatim confidence band",
  },
] as const;

// ─── enablement ─────────────────────────────────────────────────────────────

/**
 * The capabilities a merchant ACTUALLY has. Read structurally, so this compiles and
 * behaves correctly today (no merchant declares any) and picks up a real
 * `capabilities?: CapabilityKey[]` field on `Merchant` the day the platform lane adds
 * one — with no change here and no second source of truth. An unknown key is ignored.
 */
export function enabledCapabilities(merchant: unknown): Set<CapabilityKey> {
  const raw = (merchant as { capabilities?: unknown })?.capabilities;
  const out = new Set<CapabilityKey>();
  if (!Array.isArray(raw)) return out;
  for (const c of CAPABILITY_REGISTRY) if (raw.includes(c.key)) out.add(c.key);
  return out;
}

/** Every capability the product does NOT have for this merchant — the guarded set. */
export function guardedCapabilities(enabled: Iterable<CapabilityKey | string> = []): Capability[] {
  const on = new Set([...enabled]);
  return CAPABILITY_REGISTRY.filter((c) => !on.has(c.key));
}

// ─── the commitment grammar ─────────────────────────────────────────────────

/**
 * The auxiliaries a commitment may carry between the actor and the verb. This list is
 * an ALLOWLIST, and that is the whole negation story: "can't", "cannot", "won't",
 * "unable to" are not in it, so "I can't change your address" cannot match the active
 * pattern at all. A refusal is structurally unable to read as a promise.
 */
const AUX =
  "(?:will|would|have|has|had|can|could|am|are|is|do|did|just|already|now|also|gone|ahead|and|go|going|to|be|been|happily|personally|quickly|definitely|of\\s+course)";

/** The actor: this product only ever speaks as the merchant. */
const ACTOR = "(?:we|i|our\\s+team|the\\s+team)";

/** Up to four filler words between the verb and the object ("updated your shipping address"). */
const FILL = "(?:[\\w'’-]+\\s+){0,4}";

/** Auxiliaries that, in the passive, assert WE performed the action ("will be updated"). */
const PASSIVE_AUX =
  "(?:will\\s+be|'ll\\s+be|’ll\\s+be|is\\s+being|are\\s+being|has\\s+been|have\\s+been|is\\s+now|are\\s+now|gets?)";

/** A frame that says the action landed inside OUR systems — the tell of an invented action. */
const SYSTEM_FRAME =
  "(?:in|on|to|into|with)\\s+(?:our|the|your)\\s+(?:system|systems|records?|file|files|order|orders|account|database|packing\\s+list|end|side|sheet|books)";

function alt(parts: readonly string[]): string {
  return `(?:${parts.join("|")})`;
}

/**
 * Everything the customer's own words are NOT: this scans the DRAFT only. A pronoun
 * object ("I'll process it") is only a commitment when the capability's real object
 * appeared just before it — resolved with a bounded lookback, never a guess.
 */
const PRONOUN = "(?:it|that|this)";
const LOOKBACK_CHARS = 90;

export interface CapabilityHit {
  key: CapabilityKey;
  /** which shape fired — commitment grammar, not the matched customer text. */
  shape: "active" | "passive" | "pronoun" | "claim";
}

/**
 * Does this draft COMMIT to a capability the merchant does not have?
 *
 * Four shapes, all requiring adjacency (never document-wide co-occurrence):
 *   active   — "We have updated your shipping address", "I'll update your proxy"
 *   passive  — "your address is updated in our system", "the refund will be processed"
 *   pronoun  — "If you still want a refund, I'll process it"  (bounded lookback)
 *   claim    — "Your tracking is generating" — no actor at all, and it presupposes a
 *              system we do not have. The worst line in the run was this shape.
 *
 * Returns the first hit, or null. Pure, case-insensitive, allocation-light enough to
 * run on every draft.
 */
export function capabilityCommitment(
  text: string,
  enabled: Iterable<CapabilityKey | string> = [],
): CapabilityHit | null {
  for (const cap of guardedCapabilities(enabled)) {
    const verbs = alt(cap.verbs);
    const objects = alt(cap.objects);
    const participles = alt(cap.participles);

    // claim: an assertion about the object that presupposes the capability, actorless.
    for (const c of cap.claims) {
      if (new RegExp(c, "i").test(text)) return { key: cap.key, shape: "claim" };
    }

    // active: actor (+ up to 4 auxiliaries / contraction) + verb + ≤4 fillers + object
    const active = new RegExp(
      `\\b${ACTOR}\\b(?:['’]\\w+)?(?:\\s+${AUX}){0,4}\\s+${verbs}\\s+${FILL}${objects}\\b`,
      "i",
    );
    if (active.test(text)) return { key: cap.key, shape: "active" };

    // passive: object + a WE-performed auxiliary + participle  ("your address will be updated")
    const passive = new RegExp(`${objects}\\s+(?:[\\w'’-]+\\s+){0,2}${PASSIVE_AUX}\\s+(?:been\\s+)?${participles}\\b`, "i");
    if (passive.test(text)) return { key: cap.key, shape: "passive" };

    // passive-in-our-system: object + any be/have + participle + an explicit system frame.
    // "your address IS UPDATED IN OUR SYSTEM" — the p09 line. The system frame is what
    // keeps "if your address has changed, tell me" (the customer's own change) legal.
    const framed = new RegExp(
      `${objects}\\s+(?:[\\w'’-]+\\s+){0,2}(?:is|are|was|were|has|have|had|been|being)\\s+(?:been\\s+)?${participles}\\s+(?:[\\w'’-]+\\s+){0,3}${SYSTEM_FRAME}\\b`,
      "i",
    );
    if (framed.test(text)) return { key: cap.key, shape: "passive" };

    // pronoun object, resolved by bounded lookback: "…want a refund, I'll process it"
    const pronoun = new RegExp(
      `\\b${ACTOR}\\b(?:['’]\\w+)?(?:\\s+${AUX}){0,4}\\s+${verbs}\\s+${PRONOUN}\\b`,
      "gi",
    );
    const objectAnywhere = new RegExp(objects, "i");
    for (const m of text.matchAll(pronoun)) {
      const from = Math.max(0, (m.index ?? 0) - LOOKBACK_CHARS);
      if (objectAnywhere.test(text.slice(from, m.index ?? 0))) {
        return { key: cap.key, shape: "pronoun" };
      }
    }
  }
  return null;
}

// ─── the customer's ask ─────────────────────────────────────────────────────

/**
 * What the CUSTOMER asked for that we cannot do. Read from the ticket subject + body,
 * never from the draft. Used by the safe floor: a deterministic reassurance script is
 * not a responsive answer to "please ship to a different address", and answering it
 * with one is how the run shipped a refund-save script at a calm address change.
 *
 * Deliberately generous — a false positive here costs one escalation to a human, which
 * is the correct outcome for an ambiguous ticket. A false negative ships a non-answer.
 */
export function requestedCapabilities(
  ticketText: string,
  enabled: Iterable<CapabilityKey | string> = [],
): CapabilityKey[] {
  const hits: CapabilityKey[] = [];
  for (const cap of guardedCapabilities(enabled)) {
    if (cap.requests.some((r) => new RegExp(r, "i").test(ticketText))) hits.push(cap.key);
  }
  return hits;
}
