import type { ReactNode } from "react";
import { CASE_STUDY_PLACEHOLDER } from "@/lib/proof";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";
import { CornerFold } from "@/components/marketing/paper/CornerFold";

/**
 * /case-study — the honest case-study TEMPLATE.
 *
 * Every metric, quote, and outcome is a DESIGNED PLACEHOLDER SLOT, unmistakably
 * a template waiting on the first completed pilot cohort. It serves two jobs at
 * once: (a) the page that goes live the day cohort one finishes (each slot filled
 * with real numbers only), and (b) a pitch-call asset that shows a prospective
 * partner the exact anatomy of what they get.
 *
 * Proof-only, hard: no fabricated ratings, counts, testimonials, logos, or
 * metrics. The METRIC NAMES below are real product metrics; every VALUE is a
 * dashed slot, never a sample number. The headline-outcome and the founder quote
 * render the literal CASE_STUDY_PLACEHOLDER in the site's `.proof-placeholder`
 * dashed style. scripts/proof-lint.mjs is the enforcing gate.
 */

/* ── slot primitives (all values are dashed placeholders, never numbers) ── */

// Light context-field slot: a labelled field whose value fills in from cohort one.
function FieldSlot({ label, hint }: { label: string; hint: string }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold uppercase tracking-[0.09em] text-ink-mute">{label}</dt>
      <dd className="m-0 mt-2">
        <span className="inline-flex items-center rounded-lg border border-dashed border-[#c8bda4] px-3 py-1.5 text-[13px] italic text-ink-mute">
          {hint}
        </span>
      </dd>
    </div>
  );
}

// A single dark before/after cell — the number lands here after the cohort closes.
function StatCell({ label }: { label: string }) {
  return (
    <div>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#7E9B98" }}>
        {label}
      </span>
      <div
        className="mt-1.5 grid place-items-center rounded-lg border border-dashed py-4 text-[12px] tracking-[0.04em]"
        style={{ borderColor: "rgba(233,180,134,0.45)", color: "#E9B486" }}
      >
        fills from cohort
      </div>
    </div>
  );
}

// One before/after metric: real product-metric NAME + one-line definition + two dashed cells.
function MetricSlab({ name, defn }: { name: string; defn: string }) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "rgba(233,180,134,0.22)", background: "rgba(255,255,255,0.03)" }}
    >
      <h3 className="m-0 font-serif text-[19px] leading-tight" style={{ color: "var(--tan)" }}>
        {name}
      </h3>
      <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "#B9D0CE" }}>
        {defn}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <StatCell label="Day 0 baseline" />
        <StatCell label="Day 90" />
      </div>
    </div>
  );
}

// A narrative-arc stub: names the section and describes what will be written there.
function ArcStub({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <article className="panel relative overflow-hidden p-7">
      <CornerFold corner="tr" />
      <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-teal">{step}</span>
      <h3 className="mb-2.5 mt-2 font-serif text-[22px] leading-tight text-ink">{title}</h3>
      <p className="m-0 text-[14.5px] leading-relaxed text-slate">{children}</p>
      <div className="mt-4 inline-flex items-center rounded-md border border-dashed border-[#c8bda4] px-2.5 py-1 text-[11.5px] italic text-ink-mute">
        written from cohort one
      </div>
    </article>
  );
}

/* ── the persistent SAMPLE banner (rendered above the shared Nav in page.tsx) ── */

export function CaseStudySampleBanner() {
  return (
    <div className="border-b border-border bg-sand-2">
      <div className="wrap flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
        <span className="inline-flex items-center rounded-md bg-teal px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-inverse">
          Sample
        </span>
        <p className="m-0 text-[13.5px] leading-snug text-slate">
          This is the template our first completed pilot fills in. No numbers below are real.
        </p>
      </div>
    </div>
  );
}

/* ── the template body ── */

export function CaseStudyTemplate() {
  return (
    <>
      {/* 1 — HERO: merchant-name slot + headline-outcome placeholder */}
      <section className="section relative overflow-hidden">
        <PaperStrata />
        <div className="wrap relative z-10 max-w-[900px]">
          <Reveal index={0}>
            <span className="kicker mb-4">Case study · sample template</span>
          </Reveal>

          <Reveal index={1}>
            <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="text-[15px] font-medium text-ink-mute">Case study:</span>
              <span className="inline-flex items-center rounded-xl border border-dashed border-[#c8bda4] px-4 py-2 font-serif text-[clamp(24px,4vw,38px)] leading-none text-ink-mute">
                [Your brand here]
              </span>
            </div>
          </Reveal>

          <Reveal index={2}>
            <h1 className="mb-6 max-w-[760px] font-serif text-[clamp(38px,6vw,76px)] font-semibold leading-[1.03] tracking-[-0.03em] text-ink">
              The one line your pilot earns lands right here.
            </h1>
          </Reveal>

          <Reveal index={3}>
            {/* headline-outcome slot — the literal placeholder in the site's dashed style */}
            <div className="proof-placeholder max-w-[680px] text-[15px]" style={{ padding: "22px 24px" }}>
              {CASE_STUDY_PLACEHOLDER}
            </div>
          </Reveal>

          <Reveal index={4}>
            <p className="mt-6 max-w-[640px] text-[16px] leading-relaxed text-slate">
              When the first cohort closes, the outcome slot above holds one measured result, stated against that
              merchant&rsquo;s own Day-0 baseline. Until then it stays a placeholder. Everything below shows the shape of
              the finished page.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2 — CONTEXT: merchant profile, every field a slot */}
      <section className="section section-sand2">
        <div className="wrap max-w-[900px]">
          <Reveal index={0}>
            <span className="kicker mb-3.5">The merchant</span>
          </Reveal>
          <Reveal index={1}>
            <h2 className="mb-8 max-w-[620px] text-balance">Who this pilot was, in their own numbers.</h2>
          </Reveal>
          <Reveal index={2}>
            <div className="panel relative overflow-hidden p-8">
              <CornerFold corner="tr" />
              <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
                <FieldSlot label="Category" hint="what they sell" />
                <FieldSlot label="Backers waiting" hint="how many are in the queue" />
                <FieldSlot label="Wait window" hint="their promised production window" />
                <FieldSlot label="Channel" hint="Kickstarter, BackerKit, or store" />
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      <PaperEdge variant="wave" color="teal" />

      {/* 3 — BEFORE / AFTER: dark stat slab, real metric names, placeholder values */}
      <section className="section section-dark relative">
        <div className="wrap max-w-[1000px]">
          <Reveal index={0}>
            <span className="kicker mb-3.5" style={{ color: "var(--tan)" }}>
              Day 0 vs. Day 90
            </span>
          </Reveal>
          <Reveal index={1}>
            <h2 className="mb-3 max-w-[640px] text-balance">The four numbers this page will settle.</h2>
          </Reveal>
          <Reveal index={2}>
            <p className="mb-9 max-w-[620px] text-[15.5px] leading-relaxed" style={{ color: "#B9D0CE" }}>
              Each metric is captured before Tideover touches a thing, then again ninety days in. The names are the real
              product metrics. The values fill in from the cohort, measured, never rounded up.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Reveal index={3}>
              <MetricSlab
                name="Median first reply time"
                defn="How fast the first approved reply reaches a waiting customer."
              />
            </Reveal>
            <Reveal index={4}>
              <MetricSlab
                name="WISMO contacts per 100 orders"
                defn="How many where-is-it messages you field for every hundred orders in flight."
              />
            </Reveal>
            <Reveal index={5}>
              <MetricSlab
                name="Status-page deflection"
                defn="Share of where-is-it questions the self-serve order page answers before the inbox does."
              />
            </Reveal>
            <Reveal index={6}>
              <MetricSlab
                name="At-risk order saves"
                defn="Orders flagged likely to refund that stayed after a timed, goodwill-backed reach-out."
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4 — NARRATIVE ARC: three section stubs */}
      <section className="section">
        <div className="wrap max-w-[1040px]">
          <Reveal index={0}>
            <span className="kicker mb-3.5">The arc</span>
          </Reveal>
          <Reveal index={1}>
            <h2 className="mb-9 max-w-[640px] text-balance">Three sections, written once the wait plays out.</h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Reveal index={2}>
              <ArcStub step="Part one" title="The wait problem">
                Sets the scene: the specific long wait this merchant sold into, and the pressure of where-is-it
                questions that built while orders sat in production. Drawn from their real Day-0 baseline, not before it.
              </ArcStub>
            </Reveal>
            <Reveal index={3}>
              <ArcStub step="Part two" title="What Tideover did">
                Documents which surfaces went live, the reassurance inbox, the branded status page, the timed goodwill
                reach-outs, and the cadence customers actually felt across the wait.
              </ArcStub>
            </Reveal>
            <Reveal index={4}>
              <ArcStub step="Part three" title="What changed">
                Reports the measured movement against the Day-0 baseline once the cohort closes: the four metrics above,
                side by side, with real figures and nothing dressed up.
              </ArcStub>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5 — QUOTE slot */}
      <section className="section section-sand2">
        <div className="wrap max-w-[820px]">
          <Reveal index={0}>
            <span className="kicker mb-4">In their words</span>
          </Reveal>
          <Reveal index={1}>
            <figure className="m-0">
              <div className="proof-placeholder text-[15px]" style={{ padding: "40px 28px" }}>
                {CASE_STUDY_PLACEHOLDER}
              </div>
              <figcaption className="mt-4 text-[15px] font-semibold text-slate">
                &mdash; founder, first cohort
              </figcaption>
            </figure>
          </Reveal>
          <Reveal index={2}>
            <p className="mt-6 max-w-[600px] text-[14.5px] leading-relaxed text-ink-mute">
              A real quote from the pilot founder replaces this block. We publish it verbatim, with their name and brand,
              only after they sign off.
            </p>
          </Reveal>
        </div>
      </section>

      <PaperEdge variant="wave" color="teal" />

      {/* 6 — CTA */}
      <section className="section section-dark relative overflow-hidden">
        <div className="wrap max-w-[720px] text-center">
          <Reveal index={0}>
            <h2 className="mb-4 text-balance">Be the case study.</h2>
          </Reveal>
          <Reveal index={1}>
            <p className="mx-auto mb-8 max-w-[560px] text-[16.5px] leading-relaxed" style={{ color: "#B9D0CE" }}>
              The first founding pilot fills every slot on this page. You bring the wait; we run the reassurance layer
              and measure it straight against your Day-0 baseline. The numbers we publish are yours.
            </p>
          </Reveal>
          <Reveal index={2}>
            <Button href="/book" variant="primary" large>
              Be the case study &mdash; founding pilot &rarr;
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
