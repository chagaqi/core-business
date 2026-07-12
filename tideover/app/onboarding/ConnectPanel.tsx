"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { ConnectKit, HelpdeskSetup } from "@/lib/ingest-templates";
import type { IngestVendor } from "@/lib/channel-adapters/ingest-vendors";

/**
 * "Connect your helpdesk" panel (ADR-0011 §6, rebuilt by ADR-0021).
 *
 * WHAT WAS WRONG. The old panel showed one signing secret and told every vendor
 * to "HMAC-SHA256 the body… otherwise leave it unsigned (demo mode accepts
 * unsigned)". Gorgias physically cannot HMAC a body. Help Scout signs with its
 * own scheme and its own secret field. Zendesk wasn't offered auth at all. And
 * "leave it unsigned" is true only in demo — the moment the merchant went live,
 * every ticket 401'd, forever, silently. Four of ten simulated merchants — the
 * two best-paying among them — could never have connected.
 *
 * WHAT THIS DOES. Each vendor gets its own tab with the exact credential it can
 * actually send, the exact field in ITS UI to paste it into, and a LIVE TEST that
 * fires a real request at the real endpoint through the real gate. The merchant
 * finds out the connection works BEFORE they trust the queue — instead of finding
 * out it never worked when a backer files a chargeback.
 *
 * The test posts `{ test: true, … }`, which the route honors AFTER auth and AFTER
 * the merchant's own tag rule, and then stops: no synthetic ticket is ever written
 * into a real queue. A green result means a real ticket, tagged the same way,
 * would land.
 *
 * All secrets are computed server-side (they derive from a server-only root) and
 * passed in as props; this component renders, copies, and tests.
 */

interface ConnectPanelProps extends Partial<ConnectKit> {
  gorgias: HelpdeskSetup;
  zendesk: HelpdeskSetup;
}

const ORDER: IngestVendor[] = ["gorgias", "zendesk", "helpscout", "generic"];

function CopyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the value is visible to select manually */
    }
  }
  return (
    <div>
      <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-sand px-3 py-2 text-[13px] font-semibold text-ink">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="link-quiet flex-none text-[13px]"
          aria-label={`Copy ${label}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {hint && <p className="mt-1 text-[12px] leading-relaxed text-ink-mute">{hint}</p>}
    </div>
  );
}

// ── the live test ───────────────────────────────────────────────────────────
// The browser computes the SAME credential the vendor would send, against the
// same endpoint, so the test exercises the real gate rather than a mock of it.

async function hmac(hash: "SHA-1" | "SHA-256", secret: string, message: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return new Uint8Array(sig);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

type TestResult =
  | { state: "ok"; message: string }
  | { state: "dropped"; message: string }
  | { state: "fail"; message: string };

async function runConnectionTest(setup: HelpdeskSetup): Promise<TestResult> {
  // Tag the test the way the merchant's own rule expects, so the test also
  // proves the TAG RULE — the second-most-common reason a queue stays empty.
  const tag = setup.presaleTags[0] ?? "presale";
  const body = JSON.stringify({
    test: true,
    external_id: `tideover-test-${Date.now()}`,
    customer_email: "connection-test@tideover.app",
    subject: "Tideover connection test",
    body: "This is a Tideover connection test. It is not stored and no customer sees it.",
    tags: [tag],
    created_at: new Date().toISOString(),
  });

  const headers: Record<string, string> = { "content-type": "application/json" };
  if (setup.scheme === "bearer") {
    headers["authorization"] = `Bearer ${setup.credential}`;
  } else if (setup.scheme === "helpscout-hmac-sha1") {
    headers["x-helpscout-signature"] = toBase64(await hmac("SHA-1", setup.credential, body));
  } else {
    headers["x-tideover-signature"] = `sha256=${toHex(await hmac("SHA-256", setup.secret, body))}`;
  }

  let res: Response;
  try {
    res = await fetch(setup.path, { method: "POST", headers, body });
  } catch {
    return { state: "fail", message: "The request never reached Tideover. Check your connection and try again." };
  }

  if (res.status === 401) {
    return {
      state: "fail",
      message: `Tideover refused the credential (401). ${setup.label} would be turned away exactly like this, and your queue would stay empty. Re-copy the ${setup.credentialLabel.toLowerCase()} above into ${setup.label} and try again.`,
    };
  }
  if (res.status === 404) {
    return {
      state: "fail",
      message: "That ingest URL no longer resolves to your account (404). Your token was rotated — copy the URL above again.",
    };
  }
  if (!res.ok) {
    return { state: "fail", message: `Tideover rejected the test event (HTTP ${res.status}).` };
  }

  const data = (await res.json().catch(() => ({}))) as { status?: string; reason?: string };
  if (data.status === "test-ok") {
    return {
      state: "ok",
      message: `Connected. The test event passed authentication and your \`${tag}\` tag rule, so a real ${setup.label} ticket tagged \`${tag}\` will land in your queue. Nothing was stored.`,
    };
  }
  if (data.status === "discarded") {
    return {
      state: "dropped",
      message:
        data.reason ??
        `Authentication worked, but your presale tag rule dropped the test event. Tickets tagged \`${tag}\` are not reaching your queue.`,
    };
  }
  return { state: "fail", message: `Unexpected response from the ingest endpoint: ${data.status ?? "none"}.` };
}

function TestButton({ setup }: { setup: HelpdeskSetup }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      setResult(await runConnectionTest(setup));
    } catch {
      setResult({ state: "fail", message: "The test could not run in this browser." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="rounded-full bg-teal px-4 py-2 text-[13px] font-semibold text-ink-inverse transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Sending a test event…" : "Send a test event"}
      </button>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-mute">
        Fires a real request at your real ingest URL, through the same gate a real ticket goes
        through. Nothing is stored and no customer sees it.
      </p>
      {result && (
        <p
          role="status"
          className={clsx(
            "mt-3 rounded-xl border p-3 text-[13px] font-medium leading-relaxed",
            result.state === "ok"
              ? "border-teal-300 bg-accent-card/60 text-ink"
              : "border-risk-red bg-risk-red/10 text-ink",
          )}
        >
          {result.state === "ok" ? "✓ " : "⚠ "}
          {result.message}
        </p>
      )}
    </div>
  );
}

export function ConnectPanel(props: ConnectPanelProps) {
  const [vendor, setVendor] = useState<IngestVendor>("gorgias");
  const [copiedBody, setCopiedBody] = useState(false);

  const kit: Partial<ConnectKit> = props;
  const available = ORDER.filter((v): v is IngestVendor => Boolean(kit[v]));
  const setup = kit[vendor] ?? kit[available[0]]!;

  async function copyBody() {
    try {
      await navigator.clipboard.writeText(setup.bodyTemplate);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="panel mt-6 p-6">
      <p className="kicker mb-3">Connect your helpdesk</p>
      <p className="mb-4 text-[14px] leading-relaxed text-slate">
        Your helpdesk sends presale tickets straight to a private Tideover URL. Add one rule &mdash;
        tag{" "}
        <code className="rounded bg-sand px-1.5 py-0.5 text-[13px]">
          {setup.presaleTags[0] ?? "presale"}
        </code>{" "}
        &rarr; send here &mdash; and the tagged tickets flow in structured, no forwarding. Every
        helpdesk proves itself differently, so pick yours: the credential below is the one your tool
        can actually send.
      </p>

      <div className="mb-4 inline-flex flex-wrap rounded-full border border-border bg-paper p-1">
        {available.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVendor(v)}
            aria-pressed={vendor === v}
            className={
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition " +
              (vendor === v ? "bg-teal text-ink-inverse" : "text-slate hover:text-ink")
            }
          >
            {kit[v]!.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <CopyRow label="Your ingest URL" value={setup.url} />
        <CopyRow
          label={setup.credentialLabel}
          value={setup.credential}
          hint={
            setup.scheme === "bearer"
              ? `${setup.label} sends this back as the header \`Authorization: Bearer <secret>\`. Without it, every ticket is refused.`
              : setup.scheme === "helpscout-hmac-sha1"
                ? "Help Scout signs every payload with this key and Tideover verifies the signature. Paste it into Help Scout's Secret Key field, exactly as shown."
                : "HMAC-SHA256 the raw request body with this and send it as X-Tideover-Signature: sha256=<hex>."
          }
        />
      </div>

      {setup.bodyTemplate ? (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-mute">
              Request body template
            </p>
            <button type="button" onClick={copyBody} className="link-quiet text-[13px]">
              {copiedBody ? "Copied" : "Copy JSON"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-border bg-sand p-4 text-[12.5px] leading-relaxed text-ink">
            <code>{setup.bodyTemplate}</code>
          </pre>
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-sand px-4 py-3 text-[13px] leading-relaxed text-slate">
          {setup.label} doesn&rsquo;t let you configure a request body &mdash; it sends its own
          conversation payload. There is nothing to paste; Tideover reads it directly.
        </p>
      )}

      <ol className="mt-4 flex list-decimal flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate">
        {setup.instructions.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      <TestButton key={setup.vendor} setup={setup} />

      <p className="mt-5 rounded-xl border border-teal-300 bg-accent-card/60 p-3 text-[13px] font-medium text-ink">
        We&rsquo;ll only ever receive the tickets your rule sends. Untagged tickets never reach
        Tideover, and anything that slips through without your presale tag is dropped before it
        touches a database.
      </p>
    </div>
  );
}
