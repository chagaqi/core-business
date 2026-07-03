"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the embeddable widget and reports its rendered height to the host page
 * via postMessage, so an embedding <iframe> can size itself to fit. Reports on
 * mount, on resize, and whenever content changes (ResizeObserver). The host
 * listens for { type: "tideover-widget-height", height }.
 */
export function WidgetFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const post = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      window.parent.postMessage({ type: "tideover-widget-height", height }, "*");
    };

    post();

    const ro = new ResizeObserver(post);
    ro.observe(el);
    window.addEventListener("resize", post);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", post);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
