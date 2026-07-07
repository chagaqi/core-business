import { getDraftAlternates, getPreviouslyTold, getQueue, getTicketView } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import { MerchantSwitcher } from "@/components/product/MerchantSwitcher";
import { QueueList, type QueueItem } from "@/components/product/QueueList";
import { QueueKeyboard } from "@/components/product/QueueKeyboard";
import { FactorBreakdown } from "@/components/product/FactorBreakdown";
import { PreviouslyTold } from "@/components/product/PreviouslyTold";
import { DraftRail } from "@/components/product/DraftRail";
import { GiftSuggestion } from "@/components/product/GiftSuggestion";
import { SlaChip } from "@/components/product/SlaChip";
import { FocusDraft } from "@/components/product/FocusDraft";
import { RiskBadge, Tag } from "@/components/ui/Badge";
import { slaChip, ticketSlaState } from "@/lib/sla";
import { isFlagged } from "@/lib/escalation";
import type { Channel, RiskColor, Sentiment } from "@/lib/types";

export const dynamic = "force-dynamic";

// Display name of the merchant's helpdesk, for the "Copied — paste into …" label.
// "manual" is a send strategy, not an inbound channel, so it maps generically.
const HELPDESK_LABEL: Record<Channel, string> = {
  mock: "your helpdesk",
  gorgias: "Gorgias",
  tidio: "Tidio",
  intercom: "Intercom",
  email: "your email",
  manual: "your helpdesk",
};

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
  searchParams: { merchant?: string; ticket?: string; focus?: string };
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

  const merchant = merchants.find((m) => m.id === merchantId)!;
  const now = new Date();
  const queue = await getQueue(merchantId);

  // The priority queue is the OPEN work — a sent ticket has been handled and
  // drops out on re-read, so the list visibly shrinks as the operator clears it
  // (and reaches "Queue clear" when empty). Sent tickets still count toward the
  // dashboard's before/after metrics, which read the ticket store directly.
  const openQueue = queue.filter((r) => r.ticket.status !== "sent");

  const items: QueueItem[] = openQueue.map((r) => ({
    ticketId: r.ticket.id,
    firstName: r.customer.firstName,
    group: r.order.group,
    subject: r.ticket.subject,
    daysInWait: r.daysInWait,
    riskScore: r.riskScore,
    color: r.color as RiskColor,
    escalated: escalatedSentiment(r.ticket.sentiment),
    // F/UX-10: persisted operator follow-up self-flag (survives refresh).
    flagged: isFlagged(r.ticket.tags),
    // C5 — computed first-response SLA chip from the ticket's own timestamps
    // and the merchant's configured support windows (ADR-0016). Open queue rows
    // are unanswered, so this is a live countdown/breach state.
    sla: slaChip(ticketSlaState(r.ticket, merchant.slaWindows, now)),
  }));

  // A deep-linked ticket (even an already-sent one) resolves against the full
  // queue so its detail still opens; otherwise default to the top of the open
  // queue (or nothing when the queue is clear).
  const selectedId =
    searchParams.ticket && queue.some((r) => r.ticket.id === searchParams.ticket)
      ? searchParams.ticket
      : openQueue[0]?.ticket.id ?? null;

  // Approve-and-advance target: the open item after the selected one in priority
  // order; if the selected item is last (or not in the open list), fall back to
  // the front of the queue; null when sending would empty the queue.
  const selectedIndex = items.findIndex((i) => i.ticketId === selectedId);
  const nextTicketId =
    selectedIndex >= 0 && selectedIndex < items.length - 1
      ? items[selectedIndex + 1].ticketId
      : items.find((i) => i.ticketId !== selectedId)?.ticketId ?? null;

  const view = selectedId ? await getTicketView(selectedId) : null;
  // C3 "Previously told": the selected customer's most-recent prior sent reply,
  // surfaced above the draft so a new reply never walks back a prior promise.
  // null on first contact — the strip then renders nothing.
  const previouslyTold = view
    ? await getPreviouslyTold(merchantId, view.ticket.customerId, view.ticket.id)
    : null;
  // C2: the three toggleable draft views for the selected ticket. `standard` is
  // byte-identical to view.intel.reassurance.draftText, so the rail's initial
  // state is unchanged. null on unresolved tickets → the rail hides the toggle.
  const alternates = view ? await getDraftAlternates(view.ticket.id) : null;
  // C5 — the selected ticket's SLA chip. A deep-linked already-sent ticket shows
  // met/missed against its target; an open one shows the live countdown.
  const selectedSla = view
    ? slaChip(ticketSlaState(view.ticket, view.merchant.slaWindows, now))
    : null;
  const queueCleared = items.length === 0;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-paper px-5 py-3">
        <div>
          <p className="kicker">Operator inbox</p>
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
          <div className="sticky top-0 z-10 border-b border-border bg-paper px-4 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-mute">
                Priority queue
              </span>
              <span className="text-[12px] text-ink-mute">{items.length}</span>
            </div>
            {items.length > 0 ? (
              <p className="mt-1 text-[11px] text-ink-mute">
                J/K to move · Enter to open · ⌘↵ to send
              </p>
            ) : null}
          </div>
          <QueueKeyboard
            ticketIds={items.map((i) => i.ticketId)}
            selectedId={selectedId}
            merchantId={merchantId}
          />
          <QueueList rows={items} selectedId={selectedId} merchantId={merchantId} />
        </div>

        {/* CENTER — ticket detail */}
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          {!view ? (
            queueCleared ? (
              <div className="mx-auto mt-16 flex max-w-[320px] flex-col items-center gap-3 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-card text-teal">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h2 className="font-serif text-[22px] text-ink">Queue clear</h2>
                <p className="text-[13px] text-ink-mute">
                  You&rsquo;ve cleared the at-risk queue. New tickets land here the
                  moment they arrive.
                </p>
              </div>
            ) : (
              <div className="proof-placeholder mt-10">
                Select a ticket from the queue to open it.
              </div>
            )
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-[24px] text-ink">
                    {view.customer.firstName}
                  </h2>
                  <p className="text-[13px] text-ink-mute">{view.customer.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <RiskBadge color={view.intel.risk.color as RiskColor}>
                    Risk {view.intel.risk.riskScore} ·{" "}
                    {view.intel.risk.band.replace("_", " ")}
                  </RiskBadge>
                  {selectedSla ? <SlaChip chip={selectedSla} /> : null}
                </div>
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
            <div className="proof-placeholder">
              {queueCleared ? "Nothing to draft — queue clear." : "No ticket selected."}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* UX-52: only after a send auto-advance (?focus=draft) do we pull
                  focus into the fresh draft, so ⌘↵ chains — plain j/k nav leaves
                  the queue keyboard in control. */}
              {searchParams.focus === "draft" ? <FocusDraft key={view.ticket.id} /> : null}
              <PreviouslyTold firstName={view.customer.firstName} prior={previouslyTold} />
              <DraftRail
                key={view.ticket.id}
                ticketId={view.ticket.id}
                draftText={view.intel.reassurance.draftText}
                confidenceBand={view.intel.reassurance.confidenceBand}
                priority={view.intel.reassurance.priority}
                managerNote={view.intel.reassurance.managerNote}
                overdue={view.intel.reassurance.overdue}
                alreadySent={view.ticket.status === "sent"}
                sentText={view.ticket.sent?.text ?? null}
                firstName={view.customer.firstName}
                firstResponseSec={view.ticket.firstResponseSec}
                merchantId={merchantId}
                nextTicketId={nextTicketId}
                helpdesk={HELPDESK_LABEL[view.merchant.helpdesk] ?? view.merchant.helpdesk}
                alternates={alternates ?? undefined}
              />
              <GiftSuggestion
                key={view.ticket.id}
                ticketId={view.ticket.id}
                gift={view.intel.gift.gift}
                reasoning={view.intel.gift.reasoning}
                roi={view.intel.gift.roi}
                availability={view.intel.availability}
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
