import { getQueue, getTicketView } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { QueueList, type QueueItem } from "@/components/product/QueueList";
import { FactorBreakdown } from "@/components/product/FactorBreakdown";
import { DraftRail } from "@/components/product/DraftRail";
import { GiftSuggestion } from "@/components/product/GiftSuggestion";
import { RiskBadge, Tag } from "@/components/ui/Badge";
import type { RiskColor, Sentiment } from "@/lib/types";

export const dynamic = "force-dynamic";

const GROUP_LABEL: Record<string, string> = {
  "ks-backer": "KS backer",
  "late-pledge": "Late pledge",
  "new-preorder": "New preorder",
};

const STAGE_LABEL: Record<string, string> = {
  sourcing: "Sourcing",
  tooling: "Tooling",
  production: "Production",
  qc: "QC",
  freight: "Freight",
  dispatch: "Dispatch",
};

const SENTIMENT_LABEL: Record<Sentiment, string> = {
  calm: "Calm",
  anxious: "Anxious",
  hostile: "Hostile",
  "chargeback-threat": "Chargeback threat",
};

const dollars = (cents: number) => `$${(cents / 100).toFixed(0)}`;

function escalatedSentiment(s: Sentiment): boolean {
  return s === "hostile" || s === "chargeback-threat";
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { merchant?: string; ticket?: string };
}) {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) {
    return <div className="p-8 text-ink-mute">No merchants seeded.</div>;
  }
  const merchantId =
    searchParams.merchant && merchants.some((m) => m.id === searchParams.merchant)
      ? searchParams.merchant
      : merchants[0].id;

  const queue = await getQueue(merchantId);

  const items: QueueItem[] = queue.map((r) => ({
    ticketId: r.ticket.id,
    firstName: r.customer.firstName,
    group: r.order.group,
    subject: r.ticket.subject,
    daysInWait: r.daysInWait,
    riskScore: r.riskScore,
    color: r.color as RiskColor,
    escalated: escalatedSentiment(r.ticket.sentiment),
  }));

  const selectedId =
    searchParams.ticket && queue.some((r) => r.ticket.id === searchParams.ticket)
      ? searchParams.ticket
      : queue[0]?.ticket.id ?? null;

  const view = selectedId ? await getTicketView(selectedId) : null;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-paper px-5 py-3">
        <div>
          <p className="kicker">Operator cockpit</p>
          <h1 className="font-serif text-[22px] leading-tight text-ink">Inbox</h1>
        </div>
        <MerchantSwitcher
          merchants={merchants.map((m) => ({ id: m.id, name: m.name }))}
          current={merchantId}
        />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_360px]">
        {/* LEFT — priority queue */}
        <div className="min-h-0 overflow-y-auto border-r border-border bg-paper">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-paper px-4 py-2.5">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-mute">
              Priority queue
            </span>
            <span className="text-[12px] text-ink-mute">{items.length}</span>
          </div>
          <QueueList rows={items} selectedId={selectedId} merchantId={merchantId} />
        </div>

        {/* CENTER — ticket detail */}
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          {!view ? (
            <div className="proof-placeholder mt-10">
              Select a ticket from the queue to open it.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-[24px] text-ink">
                    {view.customer.firstName}
                  </h2>
                  <p className="text-[13px] text-ink-mute">{view.customer.email}</p>
                </div>
                <RiskBadge color={view.intel.risk.color as RiskColor}>
                  Risk {view.intel.risk.riskScore} ·{" "}
                  {view.intel.risk.band.replace("_", " ")}
                </RiskBadge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <DetailStat label="Group" value={GROUP_LABEL[view.order.group] ?? view.order.group} />
                <DetailStat label="Waiting" value={`${view.timeline.daysInWait} days`} />
                <DetailStat
                  label="Stage"
                  value={STAGE_LABEL[view.order.productionStage] ?? view.order.productionStage}
                />
                <DetailStat label="Customer LTV" value={dollars(view.customer.ltvCents)} />
              </div>

              <div className="panel p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-ink">{view.ticket.subject}</h3>
                  <Tag>{SENTIMENT_LABEL[view.ticket.sentiment]}</Tag>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-slate">
                  {view.ticket.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  <DetailInline label="Order value" value={dollars(view.order.orderValueCents)} />
                  <DetailInline label="Region" value={view.order.region} />
                  <DetailInline label="Channel" value={view.ticket.channel} />
                  <DetailInline label="Confidence" value={view.timeline.confidenceBand} />
                </div>
              </div>

              <div className="panel p-4">
                <h3 className="mb-3 text-[15px] font-semibold text-ink">
                  Why this is at risk
                </h3>
                <FactorBreakdown
                  factors={view.intel.risk.factors}
                  topDriver={view.intel.risk.topDriver}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — draft rail + gift */}
        <div className="min-h-0 overflow-y-auto border-l border-border bg-sand px-4 py-5">
          {!view ? (
            <div className="proof-placeholder">No ticket selected.</div>
          ) : (
            <div className="flex flex-col gap-4">
              <DraftRail
                ticketId={view.ticket.id}
                draftText={view.intel.reassurance.draftText}
                confidenceBand={view.intel.reassurance.confidenceBand}
                priority={view.intel.reassurance.priority}
                managerNote={view.intel.reassurance.managerNote}
                overdue={view.intel.reassurance.overdue}
                alreadySent={view.ticket.status === "sent"}
                sentText={view.ticket.sent?.text ?? null}
                firstResponseSec={view.ticket.firstResponseSec}
              />
              <GiftSuggestion
                ticketId={view.ticket.id}
                gift={view.intel.gift.gift}
                reasoning={view.intel.gift.reasoning}
                roi={view.intel.gift.roi}
                alreadySent={view.ticket.tags.some((t) => t.startsWith("gift-sent:"))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-3">
      <div className="text-[11px] uppercase tracking-wider text-ink-mute">{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold text-ink">{value}</div>
    </div>
  );
}

function DetailInline({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[12px] text-ink-mute">
      <span className="font-semibold text-slate">{label}:</span> {value}
    </span>
  );
}
