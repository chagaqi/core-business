"use client";

import { useEffect } from "react";

/**
 * UX-52: when a send auto-advances to the next ticket, the draft textarea must
 * receive focus so ⌘/Ctrl+Enter chains straight into the next send with no
 * intervening Enter.
 *
 * DraftRail (which owns the textarea) is out of scope to edit, so the inbox page
 * renders this headless helper ONLY when the URL carries the post-send focus
 * signal (`?focus=draft`, set by ApprovalBar.advance()). On plain j/k navigation
 * the signal is absent, so the textarea does NOT steal focus and QueueKeyboard's
 * j/k/Enter keep driving the queue. Keyed by ticketId so each advance re-mounts
 * and re-focuses the fresh textarea.
 *
 * It targets the same selector QueueKeyboard's Enter handler uses, so there is a
 * single source of truth for "the draft editor".
 */
export function FocusDraft() {
  useEffect(() => {
    const focus = (): boolean => {
      const el = document.querySelector<HTMLTextAreaElement>(
        'textarea[aria-label="Editable reassurance draft"]',
      );
      el?.focus();
      return el != null;
    };
    // The textarea mounts in the same commit; focus after paint, with one rAF
    // retry in case hydration order lands this effect first.
    if (!focus()) {
      const raf = requestAnimationFrame(() => focus());
      return () => cancelAnimationFrame(raf);
    }
  }, []);
  return null;
}
