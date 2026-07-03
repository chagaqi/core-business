"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

/**
 * Inline Cal.com calendar for the teardown call. Mirrors the Adwield two-layer
 * theming (config prop + one-time getCalApi("ui")) but in Tideover's warm light
 * register: light theme, sea-teal brand accent. Namespace + link match the
 * brand spec (tidedisco / bookthecall/tidedisco) and are env-overridable.
 */
const CAL_NAMESPACE = process.env.NEXT_PUBLIC_CAL_NAMESPACE || "tidedisco";
const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK || "bookthecall/tidedisco";
const BRAND = "#0E5366"; // = --teal

export function BookCal() {
  useEffect(() => {
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
