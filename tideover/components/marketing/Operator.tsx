import { Reveal } from "@/components/ui/Reveal";
import { CASE_STUDY_PLACEHOLDER } from "@/lib/proof";

/**
 * The operator-behind-it section. The founder war-story blockquote (verbatim from
 * the source) carries lived-experience credibility; the proof-pledge box states
 * the proof-only discipline plainly, and the literal CASE_STUDY_PLACEHOLDER sits
 * where a real refund-reduction case study will go after the first cohort.
 */
export function Operator() {
  return (
    <section id="operator" className="section section-sand2">
      <div className="wrap max-w-[900px]">
        <Reveal index={0}>
          <span className="kicker mb-3.5">The operator behind it</span>
        </Reveal>

        <Reveal index={1}>
          <blockquote className="m-0 mb-8 border-0 p-0">
            <p className="m-0 font-serif text-[clamp(22px,3vw,30px)] leading-[1.32] text-ink">
              &ldquo;I ran a physical-goods company that did around <strong className="text-teal">$2M a year</strong>
              &mdash; our own warehouse, our own shipping, our own fulfillment. I spent years in the inbox writing the
              &lsquo;where&rsquo;s my order?&rsquo; replies during long waits. I&rsquo;m not a vendor who read about this
              problem. I lived it from your side of the counter.&rdquo;
            </p>
          </blockquote>
        </Reveal>

        <Reveal index={2}>
          <div className="rounded-[20px] border border-border bg-paper p-[30px] shadow-card">
            <h3 className="mb-3.5 font-serif text-[20px] font-semibold text-ink">A plain-spoken proof pledge</h3>
            <p className="mb-6 text-[15.5px] leading-relaxed text-slate">
              No invented metric. No fake testimonial. No borrowed logo. No unearned star rating. Every number on this
              page is a target measured against your own baseline &mdash; and the full refund-reduction case study lands
              only after a real cohort completes.
            </p>
            <div className="proof-placeholder">{CASE_STUDY_PLACEHOLDER}</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
