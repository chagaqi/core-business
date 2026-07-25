import { agentConfigured, isSkillName, runAgent, SKILLS, TENANT_TOOLS, type AgentEvent } from "@/lib/agent";
import { getRepositories } from "@/lib/repositories";
import { getTenantSession } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_CHARS = 4_000;

/**
 * POST /api/agent/stream (SWAN SPRINT P1) — run a skill for the session's
 * merchant, streaming AgentEvents as SSE (`data: <json>\n\n`). The first SSE
 * surface in the repo; the UI ToolChecklist/StreamingText consume it.
 *
 * Tenant safety: the merchant is ALWAYS resolved from the authenticated session
 * (same pattern as lib/team-route.ts) — the request body cannot name one.
 * No-dead-end: unconfigured provider → 503 with a JSON reason so callers fall
 * back to the deterministic path instead of hanging on an empty stream.
 */
export async function POST(req: Request): Promise<Response> {
  let body: { skill?: unknown; input?: unknown };
  try {
    body = (await req.json()) as { skill?: unknown; input?: unknown };
  } catch {
    return Response.json({ error: "bad-json" }, { status: 400 });
  }
  const skill = typeof body.skill === "string" ? body.skill : "";
  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (!isSkillName(skill) || !input || input.length > MAX_INPUT_CHARS) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  if (!agentConfigured()) {
    return Response.json({ error: "agent-disabled" }, { status: 503 });
  }

  const session = await getTenantSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  // Merchant is OPTIONAL (P2 onboarding runs diagnose-page before a merchant
  // exists) — but any skill whose tools read tenant data requires one.
  const merchant = await getRepositories().merchants.findByMemberOrOwnerSub(session.sub);
  if (!merchant && SKILLS[skill].tools.some((t) => TENANT_TOOLS.has(t))) {
    return Response.json({ error: "no-merchant" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: AgentEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          /* client went away mid-run — the runner finishes, events drop */
        }
      };
      void runAgent({ skill, input, merchantId: merchant?.id, onEvent: send })
        .catch(() => {
          /* runAgent never throws by contract; belt-and-braces */
        })
        .finally(() => {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
