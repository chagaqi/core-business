import { handleCanonicalIngest } from "@/lib/ingest-route";

/**
 * POST /api/ingest/[channel]/[token] — the per-merchant helpdesk webhook
 * (ADR-0011, task W2). `token` is the merchant's unguessable inboxToken (reused
 * from ADR-0008); merchant identity comes from the path, never a query/body id.
 * The handler core lives in @/lib/ingest-route so its body-fetch seam is
 * unit-testable and this route file exports only its HTTP verb (a Next App
 * Router requirement).
 *
 * PUBLIC endpoint: authenticated by its own token + signature, so middleware.ts
 * must NOT put it behind the operator cookie gate.
 */
export function POST(
  req: Request,
  { params }: { params: { channel: string; token: string } },
): Promise<Response> {
  return handleCanonicalIngest(req, params.channel, params.token);
}
