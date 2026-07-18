# Send Path v1 — "Approve & copy" (honest manual delivery)

**Date:** 2026-07-07 · **Author:** Fable · **Resolves:** PR-01, PR-02, EN-03, EN-09 (see PILOT-READINESS-HANDOFF.md) · **Executes with:** the Phase-4 hot-file batch

## The problem this solves

For a real merchant, "Approve & send" currently fabricates success: the mock adapter pretends to send, real channels throw, and the customer receives nothing. Write-back to helpdesks was deliberately cut (right call pre-revenue). And separately, a customer never receives their `/status/<token>` link because nothing delivers it.

## The v1 design (Dylan-approved direction: copy-to-clipboard, status link rides in the reply)

**One action: "Approve & copy reply."** On click:
1. The QA gate runs exactly as today (hard-date block etc. — unchanged, engine untouched).
2. The ticket transitions to `sent` **atomically** (compare-and-set on status so two tabs/double-click can't double-send — EN-09/PR-10), with a **real** `sentAt` and `approvedBy`.
3. The approved reply text — **with the customer's status link appended** — is written to the clipboard.
4. The UI shows the honest state: "**Copied — paste into {helpdesk name}.**" with a "Next ticket →" action (auto-advance only after this confirmation renders, satisfying UX-03's perceivable-success requirement).

**Channel semantics (lib/service.ts + adapters):**
- A new `ManualAdapter` ("your helpdesk, pasted by you") returns `{ externalId: null, sentAt: now }` — a *real* record of a *real* human action, not a simulation.
- Demo merchants (`helpdesk === "mock"` / demo mode) keep the instant simulated send — the demo walk stays smooth.
- Real merchants route to `ManualAdapter` for every channel until a true write-back integration ships (Zendesk/Gorgias per INTEGRATIONS-GUIDE.md — the adapter seam stays).

**Status-link delivery (PR-02):** appended at **send-time in the service layer**, never inside the reassurance engine (keeps the eval harness untouched): `Track your order anytime: {APP_URL}/status/{order.statusToken}`. DraftRail shows a fixed footer note "Your customer's status link is included when you copy" so the operator knows what ships. Proof-only safe: the line contains no dates or metrics.

**Honesty note (labels):** the cockpit says "Copied — paste into {helpdesk}", never "Delivered". FRT measures approve-time under a "replied via your helpdesk" definition — stated on the metric gloss, not hidden.

**What this un-breaks downstream:** a real `sentAt` flowing through `approveSend` revives FRT, SLA attainment, sentCount, deflection, saves, and the script-performance/outcome ledger (the audit's root-bug #2) — for real merchants, honestly.

## Phase-4 batch (serialized hot-file work, one builder, gate between clusters)

- **A · service.ts:** ManualAdapter + atomic status guard + status-link append + first-ever `approveSend` tests (EN-06: success, double-send race, link append, manual sentAt). `approvedBy` stays the single-operator env name for now (tenancy ADR later).
- **B · ApprovalBar.tsx:** Approve & copy flow + the confirmation state (UX-03) + escalated-ticket confirm step (UX-16, same file, small).
- **C · DraftRail.tsx:** regenerate actually updates the textarea (UX-01), confidence chip no longer hardcoded green (UX-06), status-link footer note.
- **D · inbox page + QueueList/QueueKeyboard:** wire the new callbacks, visible "Escalated" pill in the queue (UX-02), refocus the draft after auto-advance so Ctrl/⌘+Enter chains (UX-52).
- **E · dashboard (app/app/page.tsx + service):** land-on-inbox + queue banner + "cockpit"→"Inbox" rename (UX-07), at-risk excludes sent (UX-08), live "N waiting · X overdue" strip (UX-09).
- **F · Escalate persistence (UX-10/EN-25):** POST /api/escalate → tag + timestamp + optional reason (repo seam, both drivers), surfaced in queue + dashboard; button copy matches reality.
- **G · Sidebar demo-label gating (UX-04)** — rides along (depends on `isDemoMode()`, which Phase 3 preserves).

Order: A → B/C → D → E → F → G, `npm run verify && npm test` green at each checkpoint, one agent (serialization by construction), adversarial review + a real dev-server drive of the j/k → Enter → edit → Approve&copy → confirm → advance loop before commit.
