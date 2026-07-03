"use client";

import { useState } from "react";
import { readableAccent } from "@/lib/color";

/**
 * One-tap CSAT (ADR-0012, E2) — the single customer-feedback primitive on the
 * status page. "Did this update help? 👍 / 👎" POSTs the thumbs to
 * /api/csat/[token] (public — the status token authenticates, like the rest of
 * the status surface). The tap is attributed server-side to the variant of the
 * order's most recent reply, so it feeds the Script Performance panel. Re-tapping
 * replaces the prior answer rather than stacking. Nothing is stored beyond the
 * event; no PII leaves the page.
 */
export function CsatTap({ token, accent }: { token: string; accent?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [picked, setPicked] = useState<"up" | "down" | null>(null);
  const iconAccent = accent ? readableAccent(accent) : undefined;

  async function tap(value: "up" | "down") {
    if (state === "sending") return;
    setPicked(value);
    setState("sending");
    try {
      const res = await fetch(`/api/csat/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        className="flex items-center gap-2.5 rounded-2xl border border-border bg-paper px-5 py-4"
        role="status"
      >
        <span aria-hidden className="text-[17px]">
          {picked === "down" ? "🙏" : "🙌"}
        </span>
        <p className="m-0 text-[14px] leading-relaxed text-slate">
          <strong className="text-ink">Thanks for the feedback.</strong>{" "}
          {picked === "down"
            ? "We hear you — a real person reads these and we'll keep making the wait clearer."
            : "Glad this helped. We'll keep this page current as your order moves."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-paper px-5 py-4">
      <p className="m-0 text-[14px] font-medium text-ink">Did this update help?</p>
      <div className="flex items-center gap-2">
        {/* min-h/w 44px: comfortable mobile touch target (WCAG 2.5.5). */}
        <button
          type="button"
          onClick={() => tap("up")}
          disabled={state === "sending"}
          aria-label="Yes, this update helped"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border bg-sand px-3 text-[18px] transition-colors hover:bg-accent-card/60 disabled:opacity-50"
          style={iconAccent ? { borderColor: iconAccent } : undefined}
        >
          <span aria-hidden>👍</span>
        </button>
        <button
          type="button"
          onClick={() => tap("down")}
          disabled={state === "sending"}
          aria-label="No, this update did not help"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border bg-sand px-3 text-[18px] transition-colors hover:bg-accent-card/60 disabled:opacity-50"
        >
          <span aria-hidden>👎</span>
        </button>
      </div>
      {state === "error" ? (
        <span className="text-[13px] text-terracotta-600">Couldn&rsquo;t save that — please try again.</span>
      ) : null}
    </div>
  );
}
