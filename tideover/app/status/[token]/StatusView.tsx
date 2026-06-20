import { Tag } from "@/components/ui/Badge";
import { ConfidenceBand } from "@/components/status/ConfidenceBand";
import { OrderTimeline } from "@/components/status/OrderTimeline";
import { ReassuranceCard } from "@/components/status/ReassuranceCard";
import { AskBox } from "@/components/status/AskBox";
import type { PublicStatus } from "@/lib/status";

const GROUP_LABEL: Record<PublicStatus["group"], string> = {
  "ks-backer": "Kickstarter backer",
  "late-pledge": "Late pledge",
  "new-preorder": "Preorder",
};

/**
 * The merchant-branded customer reassurance page. Renders ONLY what
 * PublicStatus exposes (first name + timeline + reassurance) — never email, LTV,
 * risk, or other orders. The merchant's primary color tints accents so it reads
 * as the merchant's own page, inside Tideover's calm layout.
 */
export function StatusView({ status, token }: { status: PublicStatus; token: string }) {
  const accent = status.merchant.colors.primary;

  return (
    <div className="min-h-screen bg-sand">
      {/* merchant-branded header */}
      <header className="border-b border-border bg-paper">
        <div className="wrap flex items-center gap-3 py-5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[15px] font-bold text-white"
            style={{ background: accent }}
            aria-hidden
          >
            {status.merchant.logoText.slice(0, 1).toUpperCase()}
          </span>
          <span className="font-serif text-[19px] font-semibold text-ink">{status.merchant.logoText}</span>
        </div>
      </header>

      <main className="wrap max-w-[720px] py-10 md:py-14">
        {/* greeting */}
        <div className="mb-8">
          <h1 className="text-[clamp(26px,4vw,34px)] text-balance">
            Hi {status.firstName} — here&rsquo;s exactly where your {status.merchant.name} order is
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Tag>Order {status.orderRef}</Tag>
            <Tag>{GROUP_LABEL[status.group]}</Tag>
            <Tag>{status.region}</Tag>
          </div>
        </div>

        <div className="flex flex-col gap-7">
          <ConfidenceBand timeline={status.timeline} accent={accent} />

          <section className="panel p-6 md:p-7">
            <p className="kicker mb-5" style={{ color: accent }}>
              Production timeline
            </p>
            <OrderTimeline timeline={status.timeline} accent={accent} />
          </section>

          <ReassuranceCard
            stageKey={status.stageKey}
            firstName={status.firstName}
            merchantName={status.merchant.name}
            stageBlurb={status.stageBlurb}
            signoff={status.merchant.signoff}
            accent={accent}
          />

          <AskBox token={token} accent={accent} />
        </div>

        {/* subtle powered-by */}
        <footer className="mt-12 text-center text-[12px] text-ink-mute">
          Powered by{" "}
          <a href="/" className="font-semibold text-ink-mute underline decoration-border underline-offset-2">
            Tideover
          </a>
        </footer>
      </main>
    </div>
  );
}
