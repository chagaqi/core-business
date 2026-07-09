"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { ImportPanel } from "@/app/onboarding/ImportPanel";
import { DEFAULT_ORDER_VALUE_CENTS, type ImportFormat, type MappedRow } from "@/lib/csv";

/**
 * "Where do your backers live?" data-source picker — now a STEP INSIDE the
 * onboarding wizard (D-onboarding revamp), not a post-onboarding afterthought.
 * Crowdfunding (Kickstarter, BackerKit) is the only LIVE, clickable group —
 * selecting one reveals the CSV import panel, which parses in the browser and
 * STAGES the mapped rows into wizard state. Nothing is sent here: the staged
 * rows import atomically when the merchant clicks the final onboarding CTA.
 *
 * E-commerce and helpdesk/ticket sources are shown greyed as "Coming soon" so
 * the roadmap is visible without pretending they're wired up yet (proof-only: no
 * fabricated capability). Helpdesk tickets connect after setup from the optional
 * "Connect your helpdesk" card on the success screen (email forwarding dropped).
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

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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

/** Once rows are staged, show the confirmation + a compact preview so the count
 *  survives back-navigation (the wizard owns the staged rows, not this panel). */
function StagedSummary({
  rows,
  fileName,
  onClear,
}: {
  rows: MappedRow[];
  fileName: string | null;
  onClear: () => void;
}) {
  const preview = rows.slice(0, 5);
  return (
    <div className="mt-4 rounded-xl border border-teal-300 bg-accent-card/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-ink">
            {rows.length} backer{rows.length === 1 ? "" : "s"} staged &mdash; they import the moment
            you finish.
          </p>
          {fileName ? <p className="mt-0.5 text-[12.5px] text-ink-mute">From {fileName}</p> : null}
        </div>
        <Button variant="ghost" onClick={onClear}>
          Choose a different file
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-paper">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-sand text-left text-ink-mute">
              <th className="px-3 py-2 font-semibold">First name</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Group</th>
              <th className="px-3 py-2 font-semibold">Pledge value</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i) => (
              <tr key={i} className="border-t border-border text-slate">
                <td className="px-3 py-2">{r.firstName || "—"}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.group ?? "ks-backer"}</td>
                <td className="px-3 py-2">
                  {r.orderValueCents !== undefined ? (
                    dollars(r.orderValueCents)
                  ) : (
                    <span className="text-ink-mute">
                      {dollars(DEFAULT_ORDER_VALUE_CENTS)}
                      <span className="ml-1.5 rounded bg-sand px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        default
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > preview.length ? (
          <p className="border-t border-border px-3 py-2 text-[12px] text-ink-mute">
            + {rows.length - preview.length} more row{rows.length - preview.length === 1 ? "" : "s"} staged
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DataSourcePicker({
  stagedRows,
  stagedFileName,
  onStage,
  onClear,
}: {
  stagedRows: MappedRow[];
  stagedFileName: string | null;
  onStage: (rows: MappedRow[], format: ImportFormat, fileName: string) => void;
  onClear: () => void;
}) {
  const staged = stagedRows.length > 0;
  const [selected, setSelected] = useState<LiveSourceId | null>(staged ? "kickstarter" : null);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-1">Where do your backers live?</h3>
        <p className="max-w-[560px] text-[13.5px] leading-relaxed text-slate">
          Pick where your backer list comes from and drop in the export you already hold &mdash;
          it&rsquo;s parsed in your browser and staged here, then imports the moment you finish.
          Optional: you can skip this and import later from your setup checklist.
        </p>
      </div>

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
            Support tickets connect after setup &mdash; you&rsquo;ll get a one-rule &ldquo;Connect
            your helpdesk&rdquo; card the moment you finish.
          </p>
        </div>
      </div>

      {staged ? (
        <StagedSummary rows={stagedRows} fileName={stagedFileName} onClear={onClear} />
      ) : selected ? (
        <ImportPanel onStage={onStage} />
      ) : null}
    </div>
  );
}
