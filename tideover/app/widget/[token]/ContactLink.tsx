"use client";

/**
 * UX-27: the widget's invalid/expired-token state used to have nothing
 * clickable. An invalid token carries no merchant identity (verifyStatusToken
 * returns null before any merchant/order lookup runs), so there's no
 * order-scoped route left to hand a message to the way AskBox does — but a
 * customer still shouldn't be dead-ended.
 *
 * The widget only ever exists embedded in an <iframe> on the merchant's own
 * site, so the escape hatch hands the intent to that host page via
 * postMessage — the same channel WidgetFrame already uses for height
 * reporting. A merchant that wants a live "contact us" action wires a
 * listener for `{ type: "tideover-widget-contact" }` on their own site
 * (merchant-configurable); without one this is a harmless no-op rather than
 * a broken link.
 */
export function ContactLink() {
  return (
    <button
      type="button"
      onClick={() => window.parent.postMessage({ type: "tideover-widget-contact" }, "*")}
      className="mt-2 text-[12.5px] font-semibold text-teal underline decoration-border underline-offset-2"
    >
      Contact us
    </button>
  );
}
