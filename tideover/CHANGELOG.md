# Changelog

All notable changes to Tideover, newest first. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/). Dates are local.

## 2026-07-03 — Finalization sprint

### Added
- **Production persistence (MongoDB Atlas).** Live site cut over from the
  in-memory JSON driver to Atlas; writes now survive restarts. (F1, D11)
- **Operator auth.** Env-gated demo mode + HMAC signed-cookie edge middleware +
  `/login`; the public demo stays open, live mode gates `/app` and operator APIs
  and fails closed. (F2)
- **Hardened webhook ingest.** Raw-body HMAC verify before parse, mock-channel
  gated, idempotency + drop-at-edge. (F3)
- **Evidence schema.** `Order.disclosedEta`, campaign/wave labels, append-only
  status-view logging. (M1)
- **Dispute Evidence Pack** — per-order print-view of exactly what Shopify's
  dispute form asks for. (M2)
- **Outcome ledger** — script variants + append-only reply_sent events with
  edit-rate. (E1)
- **Script Performance panel** (`/app/scripts`) — measured per-variant stats with
  small-N humility. (E3)
- **Keyboard triage** — J/K/Enter/⌘Enter + approve-and-advance + Queue-clear. (C1)
- **Email-forward ingest** via Resend inbound — the "one forwarding rule" wedge.
  (W1; live activation pending DNS)
- **Update pipeline** — workshop feed on the status page + widget + copy-to-
  Kickstarter draft. (U2)
- **Status-page wait UX** — elapsed-time framing, WCAG accent contrast, a11y. (U1)
- **Trust surface** — `/security` data-map + revocation table, `/privacy`,
  `/terms` (with real business address). (T1, T2, D13)
- **Objection FAQ + comparison table** with cited competitor economics. (G3)
- **Eval harness** — 52,440-assertion invariant sweep + 55 golden fixtures in
  the verify chain + CI. (OS4)
- **CI, issue templates, ADR log, production smoke test + release ritual.**
  (OS1, OS2, OS3-partial, OS5)

### Changed
- Retired the placeholder "Chaga" founder persona across the app + Tideover GTM;
  installed the honest founder story; removed an unverifiable "$2M/yr" claim from
  the live site. (G1)

### Notes
- Proof-only doctrine holds throughout: no fabricated metrics/testimonials, only
  confidence bands, literal `[CASE STUDY PLACEHOLDER]`, demo surfaces watermarked.
