import { analyzeSite } from "@/lib/site-analyze";
import { getDrafter } from "@/lib/drafting/LlmDrafter";
import { getRepositories } from "@/lib/repositories";
import { computeTimeline } from "@/lib/time";
import { READABLE_DOCS, loadSkillBody, type ReadableDoc } from "@/lib/agent/skills";
import type { AgentContext, AgentTool } from "@/lib/agent/types";

/**
 * Core agent tools (SWAN SPRINT P1). Naming: tideover-verb-noun (Swan's
 * convention). Every repository-backed tool is tenant-guarded by ctx.merchantId
 * — a tool can never read across workspaces because the id comes from the
 * authenticated session, not the model. Tool results are JSON strings; errors
 * are returned as {"error": ...} so the model can react (never fabricate).
 *
 * By design there is NO send tool, NO write-to-ticket tool, and NO free-form
 * fetch — the scrape tool goes through analyzeSite's SSRF guard (ADR-0019).
 */

function err(reason: string): string {
  return JSON.stringify({ error: reason });
}

function clampLimit(value: unknown, fallback: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.min(Math.max(n, 1), max);
}

const scrapePage: AgentTool = {
  name: "tideover-scrape-page",
  label: "Reading the page",
  labelFor(args) {
    try {
      const u = new URL(String(args.url ?? ""));
      const path = u.pathname === "/" ? "" : u.pathname;
      return `Reading ${u.hostname.replace(/^www\./, "")}${path}`;
    } catch {
      return "Reading the page";
    }
  },
  maxCalls: 2, // the skill's two-scrape ceiling, enforced structurally
  description:
    "Fetch and analyze a merchant's store or campaign page (platform, brand name, stated delivery estimate, reward tiers). Call this when the merchant gives a URL — never guess page contents. One call per URL per conversation.",
  parameters: {
    type: "object",
    properties: { url: { type: "string", description: "The page URL exactly as the merchant gave it" } },
    required: ["url"],
  },
  async run(args) {
    const url = typeof args.url === "string" ? args.url : "";
    if (!url) return err("missing-url");
    const result = await analyzeSite(url);
    return JSON.stringify(result);
  },
};

const readOrders: AgentTool = {
  name: "tideover-read-orders",
  label: "Reading your orders",
  description:
    "List the merchant's presale orders with live timeline facts (stage, days waiting, overdue flag, the confidence band). Call before making any claim about order state.",
  parameters: {
    type: "object",
    properties: { limit: { type: "number", description: "Max orders to return (default 20, max 50)" } },
    required: [],
  },
  async run(args, ctx: AgentContext) {
    if (!ctx.merchantId) return err("no-merchant-scope");
    const repos = getRepositories();
    const merchant = await repos.merchants.findById(ctx.merchantId);
    if (!merchant) return err("merchant-not-found");
    const orders = await repos.orders.listByMerchant(ctx.merchantId);
    const now = ctx.now ?? new Date();
    const rows = orders.slice(0, clampLimit(args.limit, 20, 50)).map((order) => {
      const tl = computeTimeline(order, merchant, now);
      return {
        id: order.id,
        stage: order.productionStage,
        daysInWait: tl.daysInWait,
        overdue: tl.overdue,
        confidenceBand: tl.confidenceBand,
      };
    });
    return JSON.stringify({ total: orders.length, returned: rows.length, orders: rows });
  },
};

const readTickets: AgentTool = {
  name: "tideover-read-tickets",
  label: "Reading your tickets",
  description:
    "List the merchant's support tickets (subject, a body excerpt, sentiment, status). Call to find a ticket the merchant described, or to see what's waiting.",
  parameters: {
    type: "object",
    properties: {
      status: { type: "string", description: "Optional status filter, e.g. \"open\"" },
      limit: { type: "number", description: "Max tickets to return (default 20, max 50)" },
    },
    required: [],
  },
  async run(args, ctx: AgentContext) {
    if (!ctx.merchantId) return err("no-merchant-scope");
    const repos = getRepositories();
    let tickets = await repos.tickets.list({ merchantId: ctx.merchantId });
    if (typeof args.status === "string" && args.status) {
      tickets = tickets.filter((t) => String(t.status) === args.status);
    }
    const rows = tickets.slice(0, clampLimit(args.limit, 20, 50)).map((t) => ({
      id: t.id,
      subject: t.subject,
      body: t.body.length > 300 ? `${t.body.slice(0, 300)}…` : t.body,
      sentiment: t.sentiment,
      status: t.status,
      channel: t.channel,
      orderId: t.orderId,
      createdAt: t.createdAt,
    }));
    return JSON.stringify({ total: tickets.length, returned: rows.length, tickets: rows });
  },
};

const draftReply: AgentTool = {
  name: "tideover-draft-reply",
  label: "Drafting through the engine",
  description:
    "Draft a reassurance reply for one ticket THROUGH the deterministic engine (real timeline, verbatim confidence band, every truth rule applied). ALWAYS call this to produce a reply — never write one from scratch.",
  parameters: {
    type: "object",
    properties: { ticketId: { type: "string", description: "The ticket id to draft for" } },
    required: ["ticketId"],
  },
  async run(args, ctx: AgentContext) {
    if (!ctx.merchantId) return err("no-merchant-scope");
    const ticketId = typeof args.ticketId === "string" ? args.ticketId : "";
    if (!ticketId) return err("missing-ticketId");
    const repos = getRepositories();
    const ticket = await repos.tickets.findById(ticketId);
    if (!ticket || ticket.merchantId !== ctx.merchantId) return err("ticket-not-found");
    const [merchant, order, customer] = await Promise.all([
      repos.merchants.findById(ctx.merchantId),
      repos.orders.findById(ticket.orderId),
      repos.customers.findById(ticket.customerId),
    ]);
    if (!merchant || !order || !customer) return err("ticket-missing-links");
    const out = await getDrafter().draft({ ticket, order, customer, merchant, now: ctx.now });
    return JSON.stringify({
      text: out.text,
      confidenceBand: out.confidenceBand,
      priority: out.priority,
      draftedBy: out.draftedBy,
      needsHuman: out.needsHuman ?? false,
      unansweredReason: out.unansweredReason ?? null,
    });
  },
};

const readSkill: AgentTool = {
  name: "tideover-read-skill",
  label: "Checking the playbook",
  description:
    "Read one of Tideover's skill documents or the GUARDRAILS contract. Call when the merchant asks what rules you follow, or when you need another skill's procedure.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: `One of: ${READABLE_DOCS.join(", ")}` },
    },
    required: ["name"],
  },
  async run(args) {
    const name = typeof args.name === "string" ? args.name : "";
    if (!(READABLE_DOCS as readonly string[]).includes(name)) return err("unknown-skill");
    const body = await loadSkillBody(name as ReadableDoc);
    return JSON.stringify({ name, body });
  },
};

export const CORE_TOOLS: readonly AgentTool[] = [scrapePage, readOrders, readTickets, draftReply, readSkill];

/**
 * Tools that read tenant data and therefore require a merchant scope. A skill
 * whose allowlist touches one of these cannot run for a session that has no
 * merchant yet (the onboarding case) — the stream route enforces this.
 */
export const TENANT_TOOLS: ReadonlySet<string> = new Set([
  readOrders.name,
  readTickets.name,
  draftReply.name,
]);

export function toolByName(name: string): AgentTool | undefined {
  return CORE_TOOLS.find((t) => t.name === name);
}
