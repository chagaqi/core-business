import { Reveal } from "@/components/ui/Reveal";

/**
 * "How it works" — the presale-specialist layer. Four feature cards, then a
 * routing diagram (your data → Tideover presale layer routing WISMO only → your
 * helpdesk, which stays as-is), then the comparison table with the Tideover
 * column highlighted in bg-accent-card. All styled divs/arrows — no chart libs.
 */
function FeatureIcon({ path }: { path: React.ReactNode }) {
  return (
    <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[11px] bg-accent-card">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        {path}
      </svg>
    </span>
  );
}

const FEATURES: readonly { title: string; body: string; icon: React.ReactNode }[] = [
  {
    title: "Plugs into your existing stack",
    body: "We bolt onto the Gorgias, Tidio, or Intercom you already run. No migration, no second inbox, no infra change.",
    icon: (
      <>
        <rect x="3" y="4" width="8" height="7" rx="2" stroke="#0E5366" strokeWidth="1.7" />
        <rect x="13" y="13" width="8" height="7" rx="2" stroke="#0E5366" strokeWidth="1.7" />
        <path d="M11 7.5h4a2 2 0 0 1 2 2V13" stroke="#0E5366" strokeWidth="1.7" fill="none" />
      </>
    ),
  },
  {
    title: "Knows each order's real timeline",
    body: "Tideover reads order data and your production schedule, so every reply is grounded in where that specific order actually is — tooling, production, QC, packing, dispatch.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" stroke="#0E5366" strokeWidth="1.7" />
        <path d="M12 7v5l3.5 2" stroke="#0E5366" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Timeline-aware, day-stage replies",
    body: "A Day 7 nudge and a Day 89 worry need different words. Replies meet the buyer at the emotional stage they're in, in honest confidence bands — never an invented hard date.",
    icon: (
      <>
        <path d="M4 5h16v11H8l-4 3V5Z" stroke="#0E5366" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
        <path d="M8 10h8M8 13h5" stroke="#0E5366" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Every novel reply is human-approved",
    body: "Nothing auto-fires a promise. New situations get a real person's eyes before they ever reach your customer.",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.4" stroke="#0E5366" strokeWidth="1.7" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" stroke="#0E5366" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M16.5 8.5l1.6 1.6 2.4-2.6" stroke="#D9762F" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

const COMPARISON: readonly { row: string; generic: string; tideover: string }[] = [
  { row: "Knows it's a preorder", generic: "Treats it like any ticket", tideover: "Built for it" },
  { row: "Knows the real timeline", generic: "No production context", tideover: "Reads each order's schedule" },
  { row: "Handles the 60–120 day journey", generic: "One reply, then silence", tideover: "Day-stage reassurance" },
  { row: "Tone", generic: "Canned & transactional", tideover: "Warm, human, calm" },
  { row: "Replaces your stack", generic: "It is the stack", tideover: "Plugs in — nothing to replace" },
  { row: "Setup", generic: "Migration, new tool to learn", tideover: "Bolt-on — zero infra change" },
];

function Arrow() {
  return (
    <span aria-hidden className="text-[26px] font-light text-[#C0CFD1]">
      &rarr;
    </span>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="section section-sand2 scroll-mt-20">
      <div className="wrap">
        <Reveal index={0}>
          <div className="mb-12 max-w-[680px]">
            <span className="kicker mb-3.5">The presale-specialist layer</span>
            <h2 className="mb-4 text-balance">A calm layer on top of the stack you already run.</h2>
            <p className="m-0 text-[17px] leading-relaxed text-slate">
              We don&rsquo;t replace your helpdesk. We bolt on, take the presale tickets, and answer the long wait
              &mdash; while everything else stays exactly as it is.
            </p>
          </div>
        </Reveal>

        {/* 4 feature cards */}
        <div className="mb-11 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} index={i}>
              <div className="h-full rounded-[18px] border border-border bg-paper p-[26px] shadow-card">
                <FeatureIcon path={f.icon} />
                <h3 className="mb-2 font-serif text-[19px] font-semibold text-ink">{f.title}</h3>
                <p className="m-0 text-[14.5px] leading-relaxed text-slate">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* routing diagram */}
        <Reveal index={0}>
          <div className="mb-11 rounded-[22px] border border-border bg-paper p-6 shadow-card md:p-10">
            <div className="mb-7 text-center text-[13px] font-bold uppercase tracking-[0.06em] text-[#8A9A9D]">
              How the bolt-on routes
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-7">
              {/* inputs */}
              <div className="flex flex-col gap-2.5">
                <div className="mb-0.5 text-center text-[12px] font-bold uppercase tracking-[0.05em] text-[#8A9A9D]">
                  Your data
                </div>
                {["Order data", "Production timeline", "Backer & preorder list"].map((d) => (
                  <div
                    key={d}
                    className="rounded-xl border border-[#D2E2E4] bg-[#F3F8F8] px-4 py-2.5 text-center text-[14px] font-semibold text-teal"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <Arrow />

              {/* tideover node */}
              <div className="rounded-[18px] bg-teal px-6 py-6 text-center text-ink-inverse shadow-lift">
                <svg width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden className="mx-auto mb-2">
                  <path d="M2 23 Q9 17 16 23 T30 23" stroke="#F4F9F9" strokeWidth="2.1" fill="none" strokeLinecap="round" />
                  <path d="M5 17 Q11 12 16 17 T27 17" stroke="#F4F9F9" strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.66" />
                  <path d="M8 11 Q12.5 7 16 11 T24 11" stroke="#F4F9F9" strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.4" />
                </svg>
                <div className="font-serif text-[21px] font-semibold">Tideover</div>
                <div className="mt-0.5 text-[12.5px] opacity-80">presale layer &middot; routes WISMO only</div>
              </div>

              <Arrow />

              {/* outputs */}
              <div className="flex flex-col gap-2.5">
                <div className="mb-0.5 text-center text-[12px] font-bold uppercase tracking-[0.05em] text-[#8A9A9D]">
                  Your helpdesk
                </div>
                {["Gorgias", "Tidio", "Intercom"].map((d) => (
                  <div
                    key={d}
                    className="rounded-xl border border-border bg-sand-2 px-4 py-2.5 text-center text-[14px] font-semibold text-slate"
                  >
                    {d}
                  </div>
                ))}
                <div className="mt-0.5 text-center text-[12px] italic text-[#8A9A9D]">stays exactly as it is</div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* comparison table */}
        <Reveal index={0}>
          <div className="overflow-hidden rounded-[22px] border border-border bg-paper shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <caption className="px-6 pb-1 pt-6 text-left font-serif text-[21px] font-semibold text-ink">
                  Generic helpdesk vs. Tideover
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="border-b border-border px-6 py-4 text-left" />
                    <th scope="col" className="border-b border-border px-5 py-4 text-left text-[14px] font-semibold text-slate">
                      Generic helpdesk
                      <br />
                      <span className="text-[12.5px] font-normal text-[#9AA8AB]">Gorgias / Tidio / Intercom</span>
                    </th>
                    <th
                      scope="col"
                      className="border-b-2 border-teal bg-accent-card px-5 py-4 text-left text-[14px] font-bold text-teal"
                    >
                      Tideover
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((c) => (
                    <tr key={c.row}>
                      <th
                        scope="row"
                        className="border-b border-[#F1EADC] px-6 py-[15px] text-left text-[14.5px] font-semibold text-ink"
                      >
                        {c.row}
                      </th>
                      <td className="border-b border-[#F1EADC] px-5 py-[15px] text-[14px] text-[#8A9A9D]">{c.generic}</td>
                      <td className="border-b border-[#F1EADC] bg-accent-card px-5 py-[15px] text-[14px] font-semibold text-teal-700">
                        {c.tideover}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
