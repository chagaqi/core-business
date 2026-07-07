"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { ImportPanel } from "@/app/onboarding/ImportPanel";

/**
 * "Where do your backers live?" data-source picker (onboarding connection
 * experience). Crowdfunding (Kickstarter, BackerKit) is the only LIVE, clickable
 * group — selecting one reveals the CSV import panel below. E-commerce and
 * helpdesk/ticket sources are shown greyed as "Coming soon" so the roadmap is
 * visible without pretending they're wired up yet (proof-only: no fabricated
 * capability). Ticket sources can still reach Tideover today by forwarded email
 * or the helpdesk webhook rule set up in a later step.
 */

type LiveSourceId = "kickstarter" | "backerkit";

interface SourceDef {
  id: string;
  name: string;
  blurb: string;
}

const CROWDFUNDING: SourceDef[] = [
  { id: "kickstarter", name: "Kickstarter", blurb: "Backer report CSV — pledges, tiers, emails." },
  { id: "backerkit", name: "BackerKit", blurb: "Pledge manager export — orders, add-ons, shipping." },
];

const ECOMMERCE: SourceDef[] = [
  { id: "shopify", name: "Shopify", blurb: "Store orders and customers, synced automatically." },
];

const HELPDESK: SourceDef[] = [
  { id: "gorgias", name: "Gorgias", blurb: "Presale tickets routed in automatically." },
  { id: "zendesk", name: "Zendesk", blurb: "Presale tickets routed in automatically." },
  { id: "intercom", name: "Intercom", blurb: "Presale conversations routed in automatically." },
  { id: "tidio", name: "Tidio", blurb: "Presale chats routed in automatically." },
];

function isLiveSource(id: string): id is LiveSourceId {
  return id === "kickstarter" || id === "backerkit";
}

function SourceCard({
  name,
  blurb,
  live,
  selected,
  onSelect,
}: {
  name: string;
  blurb: string;
  live: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={live ? onSelect : undefined}
      disabled={!live}
      aria-disabled={!live}
      aria-pressed={live ? Boolean(selected) : undefined}
      className={clsx(
        "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
        !live && "cursor-default border-border bg-sand opacity-50",
        live && selected && "cursor-pointer border-teal bg-accent-card/60 shadow-sm",
        live && !selected && "cursor-pointer border-border bg-paper hover:border-teal-300",
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="text-[14.5px] font-semibold text-ink">{name}</span>
        {live ? (
          <span className="inline-flex flex-none items-center rounded-full border border-teal-300 bg-accent-card px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-teal">
            Available
          </span>
        ) : (
          <span className="inline-flex flex-none items-center rounded-full border border-border bg-paper px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-mute">
            Coming soon
          </span>
        )}
      </div>
      <span className="text-[12.5px] leading-snug text-ink-mute">{blurb}</span>
    </button>
  );
}

export function DataSourcePicker({ merchantId }: { merchantId: string }) {
  const [selected, setSelected] = useState<LiveSourceId | null>(null);

  return (
    <>
      <div className="panel mt-6 p-6">
        <p className="kicker mb-3">Connect your data</p>
        <h3 className="mb-1">Where do your backers live?</h3>
        <p className="mb-5 max-w-[560px] text-[13.5px] leading-relaxed text-slate">
          Pick where your backer list comes from. Crowdfunding sources import today &mdash;
          everything else on the roadmap is shown below so you know what&rsquo;s next.
        </p>

        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-teal">
              Crowdfunding &mdash; live
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CROWDFUNDING.map((s) => (
                <SourceCard
                  key={s.id}
                  name={s.name}
                  blurb={s.blurb}
                  live
                  selected={selected === s.id}
                  onSelect={() => isLiveSource(s.id) && setSelected(s.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">
              E-commerce &mdash; coming soon
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {ECOMMERCE.map((s) => (
                <SourceCard key={s.id} name={s.name} blurb={s.blurb} live={false} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-mute">
              Where do support tickets come from? &mdash; coming soon
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {HELPDESK.map((s) => (
                <SourceCard key={s.id} name={s.name} blurb={s.blurb} live={false} />
              ))}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-mute">
              For now, tickets can still reach Tideover by forwarded email or the helpdesk webhook
              rule from the previous step &mdash; no direct connection needed yet.
            </p>
          </div>
        </div>
      </div>

      {selected ? <ImportPanel merchantId={merchantId} /> : null}
    </>
  );
}
