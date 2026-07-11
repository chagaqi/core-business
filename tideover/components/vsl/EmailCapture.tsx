"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Playbook email capture, used on the VSL pages alongside the booking CTA.
 * Submits to POST /api/playbook-lead, which persists { email, source, at }
 * through the repository seam. Proof-only copy: a person sends the playbook
 * (there is no autoresponder), and the success state only renders after the
 * server confirmed the write — never on a dropped or failed request.
 */
export function EmailCapture({
  heading = "Want the Presale Anxiety Playbook?",
  blurb = "The day-7 / 30 / 60 / 89 reassurance moves, free. Drop your email and we'll send it over — a real person sends these, so give it a little time.",
  cta = "Send me the playbook",
}: {
  heading?: string;
  blurb?: string;
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/playbook-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: window.location.pathname }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-accent-card p-7">
      {status === "sent" ? (
        <div>
          <h3 className="mb-2 font-serif text-[20px] font-semibold text-ink">Got it &mdash; it&rsquo;s on its way.</h3>
          <p className="m-0 text-[15px] leading-relaxed text-slate">
            We have your email and we&rsquo;ll send the playbook over. A person sends these, not an autoresponder, so
            allow a little time. Whenever you&rsquo;re ready, you can also book a free 15-minute teardown and
            we&rsquo;ll look at your actual setup together.
          </p>
        </div>
      ) : (
        <>
          <h3 className="mb-2 font-serif text-[20px] font-semibold text-ink">{heading}</h3>
          <p className="mb-4 text-[15px] leading-relaxed text-slate">{blurb}</p>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brand.com"
              aria-label="Email address"
              className="min-w-[220px] flex-1 rounded-[10px] border border-border bg-paper px-4 py-3 text-[15px] text-ink outline-none focus:border-teal"
            />
            <Button type="submit" variant="primary" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : cta}
            </Button>
          </form>
          <p role="status" aria-live="polite" className="m-0 mt-3 text-[13.5px] text-slate">
            {status === "error"
              ? "That didn't go through — try again in a minute, or email contact@tideover.app and we'll send it by reply."
              : null}
          </p>
        </>
      )}
    </div>
  );
}
