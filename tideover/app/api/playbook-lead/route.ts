import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api-handler";
import { getRepositories } from "@/lib/repositories";
import { createRateLimiter, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/playbook-lead — the VSL pages' playbook email form (EmailCapture).
 * Persists { email, source, at } to the leads collection through the repository
 * seam, so the same code lands in the JSON store on demo hosts and in Mongo on
 * the real host. A human reads the collection and sends the playbook — this
 * route sends no email and triggers nothing downstream.
 *
 * PUBLIC + SELF-GATING by design: it is deliberately NOT in middleware.ts's
 * matcher (the /vsl pages are public on every host, so their form must be
 * too). Its own gates: zod validation (bounded email + source), a naive
 * per-IP rate limit (lib/rate-limit — per-instance, cost-control not a
 * security boundary), and a hard cap on stored field sizes via the schema.
 * No datastore reads, no merchant data touched, nothing echoed back but ok.
 */
export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email().max(254),
  // A site-relative path like "/vsl/playbook-promo" — never a free-form string.
  source: z
    .string()
    .trim()
    .max(80)
    .regex(/^\/[a-z0-9\-/]*$/i)
    .catch("/vsl"),
});

// 5 submissions/min per IP: a human filling a form never hits this.
const rateLimited = createRateLimiter(5);

export const POST = withApiErrorHandling("/api/playbook-lead", async (req: Request): Promise<Response> => {
  if (rateLimited(clientIp(req))) {
    return Response.json({ ok: false, reason: "rate-limited" }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, reason: "invalid-body" }, { status: 400 });
  }

  const { email, source } = parsed.data;
  await getRepositories().leads.create({ email, source, at: new Date().toISOString() });
  return Response.json({ ok: true });
});
