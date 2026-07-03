"use client";

import { useState } from "react";
import type { HelpdeskSetup } from "@/lib/ingest-templates";

/**
 * "Connect your helpdesk" panel (ADR-0011, task W2 §6). The clean API path: the
 * merchant's helpdesk POSTs a structured, tag-filtered ticket to their private
 * Tideover ingest URL. Shows the per-merchant URL + derived signing secret, a
 * Gorgias/Zendesk toggle rendering the copy-paste JSON body template, the
 * plain-English tag rule, and the trust line. The merchant's OWN rule does the
 * presale categorization — Tideover only ever receives what that rule sends.
 *
 * All artifacts are computed server-side (the signing secret is derived from a
 * server-only root) and passed in as props; this component only renders + copies.
 */

type Vendor = "gorgias" | "zendesk";

interface ConnectPanelProps {
  gorgias: HelpdeskSetup;
  zendesk: HelpdeskSetup;
}

function CopyRow({ label, value }: { label: string; value: string }) {
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
    </div>
  );
}

export function ConnectPanel({ gorgias, zendesk }: ConnectPanelProps) {
  const [vendor, setVendor] = useState<Vendor>("gorgias");
  const [copiedBody, setCopiedBody] = useState(false);
  const setup = vendor === "gorgias" ? gorgias : zendesk;

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
        The clean API path: your helpdesk sends presale tickets straight to a private Tideover URL.
        Add one rule &mdash; tag <code className="rounded bg-sand px-1.5 py-0.5 text-[13px]">presale</code>{" "}
        &rarr; send here &mdash; and the tagged tickets flow in structured, no forwarding.
      </p>

      <div className="flex flex-col gap-4">
        <CopyRow label="Your ingest URL" value={setup.url} />
        <CopyRow label="Signing secret" value={setup.secret} />
      </div>

      <div className="mt-6">
        <div className="mb-3 inline-flex rounded-full border border-border bg-paper p-1">
          {(["gorgias", "zendesk"] as const).map((v) => (
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
              {v === "gorgias" ? "Gorgias" : "Zendesk"}
            </button>
          ))}
        </div>

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

        <ol className="mt-4 flex list-decimal flex-col gap-1.5 pl-5 text-[13.5px] leading-relaxed text-slate">
          {setup.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <p className="mt-5 rounded-xl border border-teal-300 bg-accent-card/60 p-3 text-[13px] font-medium text-ink">
        We&rsquo;ll only ever receive the tickets your rule sends. Untagged tickets never reach
        Tideover, and anything that slips through without your presale tag is dropped before it
        touches a database.
      </p>
    </div>
  );
}
