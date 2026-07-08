import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { CornerFold } from "@/components/marketing/paper/CornerFold";

/**
 * S7 — Three-column objection blocks. Converts features into a worldview and
 * knocks down the top three conceptual objections in the label → X-not-Y
 * aphorism → mechanism rhythm. These answers were buried in the FAQ; promote
 * them. A terracotta corner-fold accent (CornerFold) heads each card.
 *
 * Proof-only: the mechanism claims are architecture facts — #2's "a hard
 * delivery date physically can't leave the system" is genuinely enforced by
 * assertNoHardDate at send time — not outcome metrics.
 */
interface Objection {
  label: string;
  aphorism: ReactNode;
  mechanism: ReactNode;
}

const OBJECTIONS: readonly Objection[] = [
  {
    label: "Voice",
    aphorism: <>Your words, not a template.</>,
    mechanism: (
      <>
        Replies are assembled from a playbook built on your own tickets, keyed to where each order sits. It reads like
        you on a good day, not a macro.
      </>
    ),
  },
  {
    label: "Control",
    aphorism: <>Drafts for approval, never auto-sends.</>,
    mechanism: (
      <>
        Nothing reaches an anxious backer without a person&rsquo;s eyes. A hard delivery date physically can&rsquo;t
        leave the system &mdash; the check runs in code at send time.
      </>
    ),
  },
  {
    label: "Change",
    aphorism: <>Update the timeline once, every reply follows.</>,
    mechanism: (
      <>
        When the factory slips, you move one production window. Every future reply and status page reflects it. No
        re-writing macros.
      </>
    ),
  },
];

export function ObjectionBlocks() {
  return (
    <section className="section section-sand2">
      <div className="wrap">
        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
          {OBJECTIONS.map((obj, i) => (
            <Reveal key={obj.label} index={i}>
              <div className="relative h-full overflow-hidden rounded-[20px] border border-border bg-paper p-7 shadow-card">
                <CornerFold />
                <span className="kicker mb-4">{obj.label}</span>
                <h3 className="mb-3.5 font-serif text-[22px] font-semibold leading-snug text-ink">{obj.aphorism}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-slate">{obj.mechanism}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
