# MCP / AGENT-SURFACE RECON — 2026-07-16

Three independent web sweeps (positioning, engineering, agent-consumption patterns), synthesized. The question: SaaS vendors are shipping MCP servers so their customers' AI agents can use the product directly — how are they positioning it, what is the engineering, and what is Tideover's move?

**The answer in one line: every support vendor's MCP converges on exactly the doctrine Tideover already has — draft-then-approve, read-freely/write-gated, no autonomous customer-facing sends — except their guardrails live in the agent's prompt and ours live in the server. That difference is the product.**

---

## 1. Swan: shipped July 9 — and the first sweep missed it

**Dylan was right.** Swan (the "AI GTM Engineer" — signal-based outbound, pipeline, win-back) launched its MCP server on **2026-07-09**, announced on their changelog. The first sweep read the homepage and blog, found nothing, and this doc originally reported "no MCP" — Dylan caught the miss same day with the changelog URL. Lesson recorded: a sweep that skips `/changelog` cannot support a negative claim.

Facts from the announcement: agents connect at `agent.getswan.com/settings/mcp` — "nothing new to set up"; named clients **Claude, Comet, and others**; exposed capabilities: "research accounts, draft outreach, or update your CRM," inbox triage, **email sending**, Sales Navigator list pulls, website-visitor data. Positioning verbatim: "Swan doing more of the work itself," a "shift from Swan running on a schedule to Swan running on events." No separate price — bundled, per the universal pattern. Source: https://www.getswan.com/changelog/connect-swan-to-your-other-ai-agents

What it adds to the analysis: Swan slots into patterns #1 (bundled) and #2 (connect the AI you already use) below, and contributes one data point the support vendors don't — **it grants agents send-capable outbound tools.** That is coherent for GTM: cold outreach sent on the merchant's behalf carries a different liability profile than replying to an existing paying customer about a late order. It sharpens our conclusion instead of weakening it: even in a category where autonomy IS granted, the vendor decides where the line sits. In presale support the entire market refuses autonomous sends — and Tideover is the only one whose refusal is architectural rather than configured.

## 2. How the market is positioning MCP servers

Six repeatable patterns, all launched in roughly the last 4–6 months, **all free / bundled in plan** (nobody charges for the MCP itself):

1. **Bundled at no extra cost** — Gorgias MCP, open beta, "included at no extra cost." https://updates.gorgias.com/publications/gorgias-mcp-is-now-in-open-beta
2. **"Bring your data to the AI you already use"** — Intercom and Plain frame the MCP as feeding Claude/ChatGPT/Cursor, not their own copilot. https://www.intercom.com/blog/introducing-model-context-protocol-fin/ · https://www.plain.com/blog/mcp-server
3. **Dual client + server** — Zendesk announced both at once: consume other MCPs and expose their own. https://www.zendesk.com/blog/zendesk-insights/innovation/zendesk-ai-mcp-client/
4. **Full data parity as a platform bet** — HubSpot (GA Apr 2026) "opens the CRM to external agents." https://developers.hubspot.com/ai-tools/mcp
5. **Protocol-as-infrastructure coalition** — Shopify's Universal Commerce Protocol + Storefront MCP on every store, 20+ endorsers (Etsy, Walmart, Visa, Stripe). https://shopify.dev/docs/apps/build/storefront-mcp
6. **"Plug into your coding agent"** — Sentry, Linear, Atlassian Rovo (one connector across Jira/Confluence/JSM/Bitbucket). https://www.atlassian.com/blog/announcements/atlassian-rovo-mcp-ga

Support-category specifics: tools are consistently split **read (search/lookup) vs write (reply/assign/tag/close)**; authorization is **inherited from the connecting human's account** (Plain: "same permissions as your user"; Gorgias: inherits helpdesk role; Pylon: a distinct per-user "MCP Access" role). Nobody sells unattended write access. Tool counts: Intercom 13, Plain ~30, Pylon 29–52.

## 3. How support agents actually consume vendor tools

Four established patterns in the wild:

1. **Vendor-hosted agent pulls context out** — Fin ↔ Shopify/Stripe/Salesforce connectors; the support vendor's own agent calls external MCPs for order data.
2. **Helpdesk-as-MCP-server** — Zendesk/Gorgias/Intercom/Pylon/Plain expose tickets and actions so the customer's own agent works inside them.
3. **Draft-then-approve** — agent output lands as a Draft object in the existing human review UI. Intercom: per-tool Draft→Live status switch; Fin "cannot make changes without human approval"; Operator shows full diff-view proposals. https://www.intercom.com/help/en/articles/15481203
4. **Confidence-threshold routing** — one agent, tiered: auto-send ~90%+, draft-for-review 70–90%, escalate below; money-adjacent intents (refunds, cancellations) get a higher bar (~0.8+). Decagon's "Agent Operating Procedures" compile plain-English policy into per-action autonomy grants. https://decagon.ai/blog/ai-customer-service-agent-capabilities

The invariant across every vendor found: **order/status data is exposed read-only with no approval; customer-facing sends and money movement are never autonomous.** Shopify's Order MCP is the reference for the read side: one `get_order` tool returning totals, line items, fulfillment timeline, adjustments, JWT-scoped with 60-minute TTL. https://shopify.dev/docs/agents/orders/order-mcp

## 4. The engineering (what we would actually build)

**Timing flag that matters: the MCP spec is mid-migration.** Stable is 2025-11-25; the **2026-07-28 revision (12 days out, RC locked)** removes protocol-level sessions entirely — no `Mcp-Session-Id`, no GET stream, no SSE resumability — and TypeScript SDK v2 ships the same day. Anything we build must be **stateless from day one** or it gets rewritten in two weeks. https://modelcontextprotocol.io/specification/draft/basic/transports/streamable-http

Recommended architecture for our stack (Next.js 14 on Vercel, Auth0):

- **Route**: `app/[transport]/route.ts` using `mcp-handler` (the renamed @vercel/mcp-adapter) wrapping `@modelcontextprotocol/sdk@^1.26` (1.26+ mandatory — CVE below that). `createMcpHandler(..., { statelessMode: true })`.
- **Auth**: `withMcpAuth(handler, verifyToken, { required: true, requiredScopes, resourceMetadataPath: '/.well-known/oauth-protected-resource' })`. `verifyToken` validates the Auth0 JWT (RS256/JWKS) and maps `user_id`/`org_id` to our internal merchant account — that mapping IS the tenant binding, and it composes with the ADR-0020 scoped repo seam we already have.
- **Auth0 side**: register the MCP endpoint as its **own resource server** (identifier = the canonical MCP URI, exactly, no trailing slash) — never reuse the app's existing audience. The RFC 8707 `resource` parameter must match it exactly or audience validation silently breaks.
- **Never forward the client's bearer token downstream** (explicit spec anti-pattern). Resolve the account server-side; use internal auth for backend calls.
- **HITL**: elicitation is being replaced by synchronous InputRequiredResult; for approvals longer than one request, use a **server-side pending-approval row + poll**, never a held-open stream. Our approval queue is already exactly that row.
- **Hard rules**: Origin-header validation (DNS rebinding) is a spec MUST and mcp-handler doesn't do it for us; tool annotations (readOnlyHint/destructiveHint) are UX hints, never the safety gate — enforcement stays server-side; plan-gating happens inside verifyToken/tool handlers (403 or omit from tools/list), never client-trusted; treat all tool-result text as untrusted content entering someone's model context.

Scaffold: `npm i mcp-handler @modelcontextprotocol/sdk@^1.26 zod@^3`. Sequencing: design now, **build the week of 2026-07-28+** against SDK v2 so we never target the dying revision.

## 5. Tideover's move — the MCP where the server cannot lie

Every helpdesk MCP gives an agent the ability to reply. None of them gives it the ability to reply **truthfully about a 90-day wait**, because none of them has the wait-window data model or the refusal discipline. Their guardrails are prompt instructions the agent carries; ours are the capability lint, the hard-date gate, and band masking — **enforced server-side, on every draft, no matter who or what is asking.** An agent connected to the Tideover MCP physically cannot promise a ship date through our tools. That is the distilled value, no fluff, and it is exactly the asymmetry §8 of the torch pass calls the moat.

**Tool surface (v1)** — read free, write gated, autonomy ceiling = queue-for-approval:

| Tool | Kind | What it returns / does |
|---|---|---|
| `get_order_context` | read | The moat object: order, wait-day, derived stage, confidence band, disclosedEta, contact history, risk + rankReason — by orderRef or email |
| `get_current_status` | read | The founder's latest status-board post (the current-truth feed) |
| `get_status_link` | read | The customer's own status-page URL |
| `get_queue` | read | The ranked at-risk queue with plain-words reasons |
| `get_deflection_stats` | read | Measured metrics only (lib/deflection.ts grade) |
| `draft_reply` | write | Runs the FULL server gate (strategy → draft → capability lint → hard-date lint → band mask → QA). Returns draft + strategy + why. **Never sends.** |
| `queue_for_approval` | write | Lands the draft in the merchant's existing approval queue; returns a pending id |
| `check_approval` | read | Poll the pending row (the serverless-safe HITL pattern) |
| `escalate_to_human` | write | Flag + reason on the ticket |
| `log_outcome` | write | Idempotent append to the outcome ledger |

No `send_reply` in v1. Human approval is the product's legal and trust design (torch pass §5 "What NOT to build"); the MCP inherits the doctrine, it does not bypass it. If confidence-threshold routing ever arrives, it arrives as a **merchant-configured** per-strategy grant (Decagon's AOP pattern), never a default.

**Auth/packaging**: permission inherits the connecting user's Tideover role (owner/member, the Plain/Gorgias pattern) plus an explicit per-user MCP-access toggle (the Pylon pattern). Bundled in plan, no extra charge (universal pattern #1). Scopes: `mcp:read`, `mcp:draft`, `mcp:queue`.

**Positioning line**: *"Equip your agent with presale-grade judgment. Every helpdesk MCP lets your agent answer; Tideover's is the only one where it can't be talked into promising a date."* A `/agents` page states it plainly; the MCP is also the cleanest demo of the proof-only doctrine we have — the guarantee is architectural, not aspirational.

**Bonus fit**: this rides pattern #2 ("bring your data to the AI you already use") for merchants who run their own support agent — the segment the torch pass currently writes off as "automation-first competitors' game." The MCP lets us serve that segment **without** becoming an auto-sender: their agent does the labor, our server enforces the truth, their human still approves. The doctrine stops being a handicap in that market and becomes the selling point.

---

**Feeds**: `docs/TORCH-PASS-TO-OPUS.md` §9C (build direction) · board card A1. Companion additions from the same session: §9A learning loop, §9B reply decision layer.
