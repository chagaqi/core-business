import Link from "next/link";
import type { ReactNode } from "react";
import { NoMerchantState } from "@/components/product/NoMerchantState";
import { Tag } from "@/components/ui/Badge";
import { loadSkillBody } from "@/lib/agent";
import { getRepositories } from "@/lib/repositories";

export const metadata = { title: "Memory — what Tideover knows" };
export const dynamic = "force-dynamic";

/**
 * /app/memory (SW9, backlog #9 + #18) — the inspectable record of every fact
 * the product will ever assert about this merchant's preorder, plus the rules
 * the agent follows (GUARDRAILS.md rendered inline). Swan's memory-doc pattern
 * on our doctrine: transparency, not black-box — the merchant can see and
 * correct everything, so nothing is asserted they didn't approve.
 *
 * v1 is read + edit-links (each fact names where it's edited). A per-change
 * history rail needs a config audit trail that doesn't exist yet — shipped
 * without it rather than faking one.
 */
export default async function MemoryPage() {
  const repos = getRepositories();
  const merchants = await repos.merchants.list();
  if (merchants.length === 0) return <NoMerchantState />;
  const merchant = merchants[0];
  const guardrails = await loadSkillBody("GUARDRAILS").catch(() => null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="font-serif text-[28px] tracking-tightish text-ink">
        What Tideover knows about {merchant.name}
      </h1>
      <p className="mt-1 text-[14px] text-slate">
        Every fact the product will assert on your behalf — inspectable here, editable at the
        linked screens. Nothing else exists, and edits apply from the next draft onward.
      </p>

      <MemorySection title="Brand voice" editHref="/app/settings" editLabel="Edit in Settings">
        <FactRow label="Voice">{merchant.brand.voice}</FactRow>
        <FactRow label="Tone">
          <span className="inline-flex flex-wrap gap-1.5">
            {merchant.brand.tone.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </span>
        </FactRow>
        <FactRow label="Banned words">
          {merchant.brand.banned.length > 0 ? merchant.brand.banned.join(", ") : "none set"}
        </FactRow>
        <FactRow label="Sign-off">{merchant.brand.signoff}</FactRow>
      </MemorySection>

      <MemorySection title="The real timeline" editHref="/app/settings" editLabel="Edit in Settings">
        <FactRow label="Wait window">
          {merchant.fulfillmentWindowDays.min}–{merchant.fulfillmentWindowDays.max} days — every
          confidence band derives from this.
        </FactRow>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-mute">
                <th className="py-1 pr-3 font-medium">Stage</th>
                <th className="py-1 pr-3 font-medium">Days</th>
                <th className="py-1 font-medium">What buyers are told is happening</th>
              </tr>
            </thead>
            <tbody>
              {merchant.stages.map((s) => (
                <tr key={s.key} className="border-t border-border">
                  <td className="py-1.5 pr-3 font-medium text-ink">{s.label}</td>
                  <td className="py-1.5 pr-3 text-slate">
                    {s.dayBand.from}–{s.dayBand.to}
                  </td>
                  <td className="py-1.5 text-slate">{s.blurb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MemorySection>

      <MemorySection title="Promises on record" editHref="/app/status" editLabel="Post status updates">
        {merchant.disclosedEtas && merchant.disclosedEtas.length > 0 ? (
          merchant.disclosedEtas.map((eta, i) => (
            <FactRow key={i} label={`Disclosed ETA (${eta.source})`}>
              {eta.value}
            </FactRow>
          ))
        ) : (
          <p className="text-[14px] text-slate">
            No disclosed delivery promise on record — buyers see confidence bands only.
          </p>
        )}
      </MemorySection>

      <MemorySection title="Channels & gestures" editHref="/app/setup" editLabel="Manage in Setup">
        <FactRow label="Helpdesk">{merchant.helpdesk}</FactRow>
        <FactRow label="Goodwill gift catalog">
          {merchant.giftCatalogIds.length} gesture{merchant.giftCatalogIds.length === 1 ? "" : "s"}{" "}
          configured —{" "}
          <Link href="/app/gifts" className="link-quiet">
            see the catalog
          </Link>
        </FactRow>
      </MemorySection>

      {guardrails ? (
        <MemorySection title="The rules the agent follows">
          <div className="space-y-2">{renderGuardrails(guardrails)}</div>
        </MemorySection>
      ) : null}
    </div>
  );
}

function MemorySection({
  title,
  editHref,
  editLabel,
  children,
}: {
  title: string;
  editHref?: string;
  editLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel mt-6 p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        {editHref ? (
          <Link href={editHref} className="shrink-0 text-[13px] font-semibold text-terracotta-700 hover:underline">
            {editLabel ?? "Edit"} →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="border-t border-border py-2 text-[14px] leading-relaxed first:border-t-0 first:pt-0">
      <span className="font-medium text-ink">{label}:</span> <span className="text-slate">{children}</span>
    </p>
  );
}

/** minimal server-side rendering of GUARDRAILS.md — headings, bullets, bold; no raw HTML */
function renderGuardrails(md: string): ReactNode[] {
  return md
    .split("\n")
    .filter((line) => !line.startsWith("# ")) // page already has its own h1
    .map((line, i) => {
      const trimmed = line.trim();
      if (trimmed === "") return null;
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={i} className="pt-2 text-[14px] font-semibold text-ink">
            {trimmed.slice(3)}
          </h3>
        );
      }
      const bulleted = /^(\d+\.|-)\s+/.test(trimmed);
      const src = trimmed.replace(/^(\d+\.|-)\s+/, "");
      const parts: ReactNode[] = src.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
        const bold = /^\*\*([^*]+)\*\*$/.exec(seg);
        return bold ? <strong key={j}>{bold[1]}</strong> : <span key={j}>{seg}</span>;
      });
      return (
        <p key={i} className={`text-[13px] leading-relaxed text-slate ${bulleted ? "pl-4" : ""}`}>
          {bulleted ? <>• {parts}</> : parts}
        </p>
      );
    })
    .filter(Boolean);
}
