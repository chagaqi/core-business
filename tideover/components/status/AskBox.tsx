"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";

/**
 * "Have a question about your order?" — a small textarea that turns a customer's
 * message into a real ticket via POST /api/widget-submit. On success it shows a
 * calm acknowledgment so the customer knows they're not being ignored. Used on
 * both the full status page and the embeddable widget.
 */
export function AskBox({ token, accent, compact = false }: { token: string; accent?: string; compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    const trimmed = message.trim();
    if (!trimmed || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/widget-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: trimmed }),
      });
      if (!res.ok) throw new Error("failed");
      setState("sent");
      setMessage("");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div
        className="flex items-start gap-3 rounded-2xl border border-border bg-paper p-5"
        role="status"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 flex-none text-teal" style={accent ? { color: accent } : undefined}>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 12.5l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="m-0 text-[14.5px] leading-relaxed text-slate">
          <strong className="text-ink">Got it — someone will follow up.</strong> You&rsquo;re not being
          ignored. We read every message and a real person will reply.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "rounded-2xl border border-border bg-paper p-5 md:p-6"}>
      {!compact ? (
        <p className="mb-1 text-[15px] font-semibold text-ink">Have a question about your order?</p>
      ) : null}
      <p className={compact ? "mb-2 text-[13px] text-ink-mute" : "mb-3 text-[13.5px] text-ink-mute"}>
        Ask us anything &mdash; a real person will follow up.
      </p>
      <TextArea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          if (state === "error") setState("idle");
        }}
        placeholder="Type your question here…"
        className={compact ? "min-h-[72px]" : undefined}
        aria-label="Your question about your order"
      />
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={submit} disabled={state === "sending" || !message.trim()}>
          {state === "sending" ? "Sending…" : "Send"}
        </Button>
        {state === "error" ? (
          <span className="text-[13px] text-terracotta-600">
            That didn&rsquo;t go through &mdash; please try again.
          </span>
        ) : null}
      </div>
    </div>
  );
}
