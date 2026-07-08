/**
 * Shared catch-all wrapper for API route handlers (EN-28, Cluster C).
 *
 * Most mutation routes have no try/catch: an unhandled throw (a bug, a bad
 * repository write, an engine surprise) escapes past Next's default handling
 * as a bare 500 with no server-side trail to debug it from. This wraps a
 * route's handler so any thrown error is caught once, logged as a structured
 * line (route + error message only — never the request body, which may carry
 * customer PII), and turned into a plain 500 JSON response instead of leaking
 * a stack trace to the client.
 *
 * Deliberately returns the Web-standard `Response` (not `NextResponse`) so this
 * file stays importable from a plain `node --test` run with no Next runtime —
 * same discipline as lib/inbound-route.ts / lib/ingest-route.ts. Any
 * route-level structured error response a handler already returns (400s, 404s,
 * the 422 hard-date block, etc.) passes straight through untouched: this only
 * catches what the handler itself did NOT handle — a thrown exception.
 */

type RouteHandler<Args extends unknown[]> = (req: Request, ...args: Args) => Promise<Response>;

/**
 * Wrap `handler` so an uncaught throw becomes a logged, generic 500 instead of
 * an unhandled crash. `route` is a label for the log line (e.g. "/api/draft"),
 * not parsed or trusted input.
 */
export function withApiErrorHandling<Args extends unknown[] = []>(
  route: string,
  handler: RouteHandler<Args>,
): RouteHandler<Args> {
  return async (req: Request, ...args: Args): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      console.error(
        JSON.stringify({
          event: "api.unhandled-error",
          route,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return Response.json({ error: "internal error" }, { status: 500 });
    }
  };
}
