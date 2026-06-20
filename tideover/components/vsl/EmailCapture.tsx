"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * A demo email-capture form. No backend — on submit it just shows a calm
 * thank-you state. On-voice copy; used on the VSL pages alongside the booking CTA.
 */
export function EmailCapture({
  heading = "Want the Presale Anxiety Playbook?",
  blurb = "The day-7 / 30 / 60 / 89 reassurance moves, free. Drop your email and we'll send it over.",
  cta = "Send me the playbook",
}: {
  heading?: string;
  blurb?: string;
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSent(true);
  }

  return (
    <div className="rounded-2xl border border-border bg-accent-card p-7">
      {sent ? (
        <div>
          <h3 className="mb-2 font-serif text-[20px] font-semibold text-ink">You&rsquo;re on the list.</h3>
          <p className="m-0 text-[15px] leading-relaxed text-slate">
            Thanks &mdash; keep an eye on your inbox. Whenever you&rsquo;re ready, you can book a free 15-minute teardown
            and we&rsquo;ll look at your actual setup together.
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
            <Button type="submit" variant="primary">
              {cta}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
