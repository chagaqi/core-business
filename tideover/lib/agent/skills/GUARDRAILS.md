# The rules Tideover's agent follows

This is the inspectable contract (backlog #18). Every rule here is **enforced in code** — a validator checks the agent's output after it writes, and the dangerous capabilities simply don't exist. The prompt states these rules; `lib/agent/guardrails.ts` and the tool design enforce them.

## What the agent can never do

1. **Never a hard date.** No calendar date, weekday, or delivery promise ever reaches a buyer. The only timing language is a confidence band computed by the deterministic engine, used verbatim. Enforced by the same hard-date predicate that gates `/api/approve-send`.
2. **Never send.** There is no send tool. Every reply the agent drafts stages behind the approval bar — a human clicks send, always. This is structural, not a setting.
3. **Never invent.** Facts come from tool results (your page, your orders, your tickets) or they don't exist. No invented metrics, testimonials, citations, or page contents. A failed tool is reported as failed — never papered over.
4. **Never freehand a band.** Reply timing comes from `tideover-draft-reply`, which calls the deterministic reassurance engine — the same math the eval harness locks with 60,000+ assertions. If the agent edits a draft's wording, the timing sentence stays byte-identical, and the validator re-checks the result.
5. **Banned words stay banned.** The merchant's banned list plus the crutch word apply to everything the agent writes, both to buyers and to the merchant.
6. **Capability truth.** The agent never claims an action the product can't perform (address changes, refunds, carrier lookups). The capability lint that catches these in drafts applies to agent output too.

## What happens when a rule trips

The output is rejected before anyone sees it, the rejection is logged (event + ids, never ticket bodies), and the surface falls back to the deterministic path. A guardrail rejection can never dead-end a flow.

## What the agent may do

Read your page and public policies, read your orders and tickets (your workspace only), draft replies through the engine, explain what it found and why it matters, and push back with a reason when a request would hurt you.
