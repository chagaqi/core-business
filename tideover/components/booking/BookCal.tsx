"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CONTACT_EMAIL } from "@/lib/security-content";

/**
 * Inline Cal.com calendar for the teardown call. Mirrors the Adwield two-layer
 * theming (config prop + one-time getCalApi("ui")) but in Tideover's warm light
 * register: light theme, sea-teal brand accent.
 *
 * The Cal handle comes ONLY from NEXT_PUBLIC_CAL_LINK (baked at build time).
 * There is deliberately no baked-in fallback handle: the old default
 * ("bookthecall/tidedisco") resolved to a dead Cal.com 404, so an unset env
 * meant every booking CTA landed on a dead calendar. With the env unset we now
 * fail VISIBLY into a mailto fallback instead — a real path to a call, never a
 * silent dead end. Set NEXT_PUBLIC_CAL_LINK on every deploy that should book.
 */
const CAL_NAMESPACE = process.env.NEXT_PUBLIC_CAL_NAMESPACE || "tidedisco";
const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK;
const BRAND = "#0E5366"; // = --teal

function MailFallback() {
  return (
    <div className="rounded-2xl border border-border bg-accent-card p-8 text-center">
      <h2 className="mb-2 font-serif text-[22px] font-semibold text-ink">Booking is a quick email away</h2>
      <p className="mx-auto mb-5 max-w-[46ch] text-[15px] leading-relaxed text-slate">
        The calendar isn&rsquo;t connected on this deployment. Email{" "}
        <a className="font-semibold text-teal" href={`mailto:${CONTACT_EMAIL}?subject=15-minute%20teardown`}>
          {CONTACT_EMAIL}
        </a>{" "}
        and we&rsquo;ll set up your free 15-minute teardown by reply.
      </p>
    </div>
  );
}

export function BookCal() {
  useEffect(() => {
    if (!CAL_LINK) return;
    let active = true;
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      if (!active) return;
      cal("ui", {
        theme: "light",
        cssVarsPerTheme: {
          light: { "cal-brand": BRAND },
          dark: { "cal-brand": BRAND },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!CAL_LINK) return <MailFallback />;

  return (
    <Cal
      namespace={CAL_NAMESPACE}
      calLink={CAL_LINK}
      id="book-cal"
      style={{ width: "100%", height: "100%", minHeight: "640px", overflow: "scroll" }}
      config={{ layout: "month_view", theme: "light" }}
    />
  );
}
