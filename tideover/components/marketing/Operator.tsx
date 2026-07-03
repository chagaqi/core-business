import { Reveal } from "@/components/ui/Reveal";
import { CASE_STUDY_PLACEHOLDER } from "@/lib/proof";

/**
 * The operator-behind-it section. The founder note is Dylan's own first-person
 * account of the gym-equipment business he ran through the COVID freight crisis —
 * lived-experience credibility, self-reported numbers only. The proof-pledge box
 * states the proof-only discipline plainly, and the literal CASE_STUDY_PLACEHOLDER
 * sits where a real refund-reduction case study will go after the first cohort.
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
              In 2020 I started a gym-equipment business the week the gyms closed. I closed
              <strong className="text-teal"> $200K in orders</strong> in my first seven days &mdash; and that was the
              start of the hardest two years of my working life.
            </p>
            <p className="mt-6 text-[15.5px] leading-relaxed text-slate">
              Every one of those orders shipped into the worst freight delays in e-commerce history. Customers waited 60
              days and more, and every morning the inbox refilled with the same question: where is my order? I couldn&rsquo;t
              make a single container move faster. The only real job was convincing good people to wait a little longer,
              then doing it again the next day.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-slate">
              That&rsquo;s where Tideover came from. The name is literal &mdash; I spent two years tiding customers over,
              learning order by order what keeps someone calm through a long wait and what turns a delay into a chargeback.
              Then I built that judgment into software, because instinct doesn&rsquo;t scale. At 11pm, on your
              three-hundredth &lsquo;where&rsquo;s my order?&rsquo; email, instinct fails.
            </p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-slate">
              Those numbers &mdash; $200K in week one, 60-plus-day waits, two years of it &mdash; are my own account of my
              own business. They stay the only numbers on this page until real merchant results, shared with permission,
              replace them.
            </p>
            <p className="mt-5 font-serif text-[17px] text-ink">&mdash; Dylan</p>
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
