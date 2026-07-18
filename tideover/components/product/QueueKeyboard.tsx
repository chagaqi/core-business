"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Keyboard-first triage layer for the operator cockpit. A thin, headless client
 * component (renders nothing) that wraps the server-rendered queue: it maps
 * j / ArrowDown → next, k / ArrowUp → previous (no wrap, clamped at the ends),
 * and Enter → scroll the selected row into view + focus the draft editor.
 *
 * Selection is kept in the URL — every move is a router.replace() to
 * ?merchant=…&ticket=… so the server re-renders the chosen ticket and deep-links
 * / refresh survive. `replace` (not `push`) keeps the back button clean.
 *
 * INPUT SAFETY: while the event target is an <input>, <textarea>, or
 * contenteditable, navigation keys are ignored so typing "j"/"k" in the draft or
 * an ask box never moves the queue. Escape blurs the active editor. The one
 * input-context shortcut, ⌘/Ctrl+Enter = send, is owned by the draft textarea
 * (DraftRail → ApprovalBar), not this global handler.
 */
export function QueueKeyboard({
  ticketIds,
  selectedId,
  merchantId,
}: {
  ticketIds: string[];
  selectedId: string | null;
  merchantId: string;
}) {
  const router = useRouter();

  // Latest props are read through a ref so the window listener is registered
  // once (no re-subscribe churn on every server re-render) yet never stale.
  const stateRef = useRef({ ticketIds, selectedId, merchantId });
  stateRef.current = { ticketIds, selectedId, merchantId };

  useEffect(() => {
    function isEditable(el: EventTarget | null): el is HTMLElement {
      if (!(el instanceof HTMLElement)) return false;
      return (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      );
    }

    // A focused interactive control keeps its NATIVE key behavior: Enter
    // activates a button / follows a queue-row link, arrows move the merchant
    // <select>. Queue nav is driven only from non-interactive focus, so we must
    // not preventDefault or hijack keys aimed at these.
    function isInteractive(el: EventTarget | null): boolean {
      return (
        el instanceof HTMLElement &&
        el.closest('button, a, select, [role="button"]') !== null
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target;

      // Escape always blurs an active editor (and does nothing else).
      if (e.key === "Escape") {
        if (isEditable(target)) target.blur();
        return;
      }

      // Never navigate while the operator is typing, or when a focused button /
      // link / select should handle the key natively.
      if (isEditable(target)) return;
      if (isInteractive(target)) return;
      // Reserve modifier combos (e.g. ⌘↵ send, browser shortcuts).
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const isNext = e.key === "j" || e.key === "ArrowDown";
      const isPrev = e.key === "k" || e.key === "ArrowUp";
      const isOpen = e.key === "Enter";
      if (!isNext && !isPrev && !isOpen) return;

      const { ticketIds, selectedId, merchantId } = stateRef.current;

      if (isOpen) {
        e.preventDefault();
        focusDraftEditor(selectedId);
        return;
      }

      if (ticketIds.length === 0) return;
      const current = selectedId ? ticketIds.indexOf(selectedId) : -1;

      // No wrap: clamp at both ends. When nothing is selected, land on the top.
      let targetIndex: number;
      if (current === -1) {
        targetIndex = 0;
      } else if (isNext) {
        targetIndex = Math.min(current + 1, ticketIds.length - 1);
      } else {
        targetIndex = Math.max(current - 1, 0);
      }

      e.preventDefault();
      if (targetIndex === current) return; // already at the clamped end — no-op.
      router.replace(
        `/app/inbox?merchant=${merchantId}&ticket=${ticketIds[targetIndex]}`,
      );
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  // Keep the selected row visible as selection moves under the keyboard.
  useEffect(() => {
    if (!selectedId) return;
    document
      .querySelector<HTMLElement>(`[data-queue-item="${selectedId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  return null;
}

/** Enter: reveal the selected row and drop the cursor into the draft editor. */
function focusDraftEditor(selectedId: string | null): void {
  if (selectedId) {
    document
      .querySelector<HTMLElement>(`[data-queue-item="${selectedId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }
  document
    .querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Editable reassurance draft"]',
    )
    ?.focus();
}
