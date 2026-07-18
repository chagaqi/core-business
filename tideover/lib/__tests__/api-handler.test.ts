import assert from "node:assert/strict";
import { test } from "node:test";
import { withApiErrorHandling } from "@/lib/api-handler";

test("withApiErrorHandling passes a successful response through unchanged", async () => {
  const handler = withApiErrorHandling("/api/example", async () =>
    Response.json({ ok: true }, { status: 201 }),
  );
  const res = await handler(new Request("http://x/api/example"));
  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), { ok: true });
});

test("withApiErrorHandling passes an existing structured error response through untouched", async () => {
  const handler = withApiErrorHandling("/api/example", async () =>
    Response.json({ error: "invalid body" }, { status: 400 }),
  );
  const res = await handler(new Request("http://x/api/example"));
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { error: "invalid body" });
});

test("withApiErrorHandling turns a thrown error into a bare 500 and logs it structured", async () => {
  const logs: string[] = [];
  const originalError = console.error;
  console.error = (msg: unknown) => {
    logs.push(String(msg));
  };
  try {
    const handler = withApiErrorHandling("/api/example", async () => {
      throw new Error("boom: some internal detail");
    });
    const res = await handler(new Request("http://x/api/example"));
    assert.equal(res.status, 500);
    // The client never sees the thrown message — generic body only.
    assert.deepEqual(await res.json(), { error: "internal error" });

    assert.equal(logs.length, 1);
    const logged = JSON.parse(logs[0]);
    assert.equal(logged.event, "api.unhandled-error");
    assert.equal(logged.route, "/api/example");
    assert.equal(logged.error, "boom: some internal detail");
  } finally {
    console.error = originalError;
  }
});

test("withApiErrorHandling catches a non-Error throw too", async () => {
  const originalError = console.error;
  let logged = "";
  console.error = (msg: unknown) => {
    logged = String(msg);
  };
  try {
    const handler = withApiErrorHandling("/api/example", async () => {
      throw "plain string throw";
    });
    const res = await handler(new Request("http://x/api/example"));
    assert.equal(res.status, 500);
    assert.equal(JSON.parse(logged).error, "plain string throw");
  } finally {
    console.error = originalError;
  }
});

test("withApiErrorHandling forwards extra handler args (dynamic route params)", async () => {
  const handler = withApiErrorHandling(
    "/api/example/[id]",
    async (_req: Request, ctx: { params: { id: string } }) => Response.json({ id: ctx.params.id }),
  );
  const res = await handler(new Request("http://x/api/example/42"), { params: { id: "42" } });
  assert.deepEqual(await res.json(), { id: "42" });
});
