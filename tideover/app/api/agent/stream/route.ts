import { agentConfigured, isSkillName, runAgent, SKILLS, TENANT_TOOLS, type AgentEvent } from "@/lib/agent";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { getRepositories } from "@/lib/repositories";
import { getTenantSession } from "@/lib/tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A run makes multiple provider calls; without this the platform kills the
// function mid-stream (pre-merge review 2026-07-27). Kept above the runner's
// 55s wall-clock deadline; lower to your plan's ceiling if needed.
export const maxDuration = 60;

const MAX_INPUT_CHARS = 4_000;
// Hard byte cap read BEFORE JSON.parse — App Router handlers have no default
// body limit, so an unbounded req.json() would buffer any payload (pre-merge
// review 2026-07-27). Generous headroom over MAX_INPUT_CHARS for JSON framing.
const MAX_BODY_BYTES = 16_000;

// Each run costs real provider pennies — bound anonymous/demo usage hard.
const rateLimited = createRateLimiter(5);

/**
 * POST /api/agent/stream (SWAN SPRINT P1) — run a skill for the session's
 * merchant, streaming AgentEvents as SSE (`data: <json>\n\n`).
 *
 * AUTH (pre-merge review 2026-07-27): a valid session is REQUIRED in every
 * mode. This route is also in the middleware matcher, but middleware skips
 * demo hosts entirely — so the route-level gate is the only control there, and
 * a missing session returns 503 `agent-disabled` (not 401), which the client
 * hook treats as "degrade to the manual branch" rather than an auth error. The
 * old real+auth0-only gate let the agent (and its outbound-fetch tool) run
 * unauthenticated on demo/*.vercel.app hosts and in password mode.
 *
 * Tenant safety: the merchant is ALWAYS resolved from the session — the body
 * cannot name one. Merchant is optional (onboarding runs diagnose-page before
 * one exists), but any skill whose tools read tenant data requires it.
 */
export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "payload-too-large" }, { status: 413 });
  }
  let body: { skill?: unknown; input?: unknown };
  try {
    body = JSON.parse(raw) as { skill?: unknown; input?: unknown };
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

  if (rateLimited(clientIp(req))) {
    return Response.json({ error: "rate-limited" }, { status: 429 });
  }

  // A session is required, full stop. No session (demo host, password mode,
  // anonymous) → 503 so the flow degrades to the manual branch, never runs the
  // agent unauthenticated.
  const session = await getTenantSession().catch(() => null);
  if (!session) {
    return Response.json({ error: "agent-disabled" }, { status: 503 });
  }
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
          /* client went away mid-run — the abort below stops the run */
        }
      };
      // A client disconnect aborts the run so provider spend stops (the request
      // AbortSignal fires when the connection closes on the Node runtime).
      void runAgent({ skill, input, merchantId: merchant?.id, signal: req.signal, onEvent: send })
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
