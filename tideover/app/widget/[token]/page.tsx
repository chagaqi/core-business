import type { Metadata } from "next";
import { getPublicStatus } from "@/lib/status";
import { ConfidenceBand } from "@/components/status/ConfidenceBand";
import { OrderTimeline } from "@/components/status/OrderTimeline";
import { AskBox } from "@/components/status/AskBox";
import { WidgetFrame } from "@/components/status/WidgetFrame";

// Generic, non-indexed — this lives inside a merchant's <iframe>.
export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

/**
 * Embeddable widget variant of the status page. Minimal chrome (no big header),
 * designed to live in an <iframe>: a compact confidence band + condensed
 * timeline + AskBox. WidgetFrame reports its height to the host page so the
 * iframe can size itself. Renders ONLY PublicStatus fields.
 */
export default async function WidgetPage({ params }: { params: { token: string } }) {
  const status = await getPublicStatus(params.token);

  if (!status) {
    return (
      <WidgetFrame>
        <div className="bg-sand p-5">
          <div className="rounded-xl border border-border bg-paper p-5 text-center">
            <p className="text-[14px] font-semibold text-ink">This order link isn&rsquo;t valid</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-mute">
              Check the link in your confirmation email, or reach out to the store.
            </p>
          </div>
        </div>
      </WidgetFrame>
    );
  }

  const accent = status.merchant.colors.primary;

  return (
    <WidgetFrame>
      <div className="bg-sand p-4">
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-[13px] text-ink-mute">
              Hi {status.firstName} — here&rsquo;s where your {status.merchant.name} order is.
            </p>
            <ConfidenceBand timeline={status.timeline} accent={accent} compact />
          </div>

          <div className="rounded-xl border border-border bg-paper p-4">
            <OrderTimeline timeline={status.timeline} accent={accent} compact />
          </div>

          <AskBox token={params.token} accent={accent} compact />

          <p className="text-center text-[11px] text-ink-mute">
            Powered by{" "}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline decoration-border underline-offset-2"
            >
              Tideover
            </a>
          </p>
        </div>
      </div>
    </WidgetFrame>
  );
}
