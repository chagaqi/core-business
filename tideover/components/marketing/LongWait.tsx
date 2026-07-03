import { Reveal } from "@/components/ui/Reveal";
import { citedStat } from "@/lib/proof";

/**
 * "The long wait" section. Frames WISMO as a months-long emotional journey, not
 * one ticket: four day-stage timeline cards (Curious → Dispute-risk) pulled from
 * the sales-page arc, then three "stakes" cards (chargebacks / WISMO floods /
 * "scam" reviews) carrying the cited external stats. Proof-only: every external
 * number is sourced inline via citedStat and never restated as a Tideover result.
 */
const STAGES: readonly { day: string; dot: string; dayColor: string; title: string; body: string }[] = [
  {
    day: "DAY 7",
    dot: "#7FB0A6",
    dayColor: "#0E5366",
    title: "Curious",
    body: "The order is fresh and she's still excited. She checks for a tracking page that doesn't exist yet and sends a friendly “just making sure my order went through?”",
  },
  {
    day: "DAY 30",
    dot: "#E1C07A",
    dayColor: "#0E5366",
    title: "Restless",
    body: "A month in. The excitement's gone, the card statement showed up and the product didn't. She's quietly wondering whether she handed money to someone about to ghost her.",
  },
  {
    day: "DAY 60",
    dot: "#D89A6A",
    dayColor: "#0E5366",
    title: "Frustrated",
    body: "Two months. Now it's “This is taking forever. I want a refund.” Founders read that as a decision. It usually isn't — it's “convince me to keep waiting.”",
  },
  {
    day: "DAY 89",
    dot: "#C0603A",
    dayColor: "#B05A30",
    title: "Dispute-risk",
    body: "The highest-stakes moment in the wait. “Where IS my order?? Last chance before I dispute.” You have maybe one reply and 24 hours.",
  },
];

const STAKES: readonly { title: string; body: string }[] = [
  {
    title: "Chargebacks hit more than revenue",
    body: `A refund is a lost sale. A chargeback is a dispute on your record — and enough of them put your Stripe or PayPal standing at risk, in the exact category card networks watch most closely. ${citedStat(
      "Each chargeback runs $15–25 in fees before you lose the product and the customer",
      "card-network dispute fee range",
    )}.`,
  },
  {
    title: "WISMO floods the inbox",
    body: `“Where's my order?” arrives in waves for months, burying the tickets that actually need you. ${citedStat(
      "Presale-heavy stores see 5–10× more “where is my order?” tickets during long waits",
      "YepAI 2026, industry benchmark",
    )}.`,
  },
  {
    title: "“Scam” reviews stick",
    body: "An anxious buyer left in the dark writes the review first and asks questions later. She doesn't conclude that production takes time — she concludes she's been had, and says so in the review the next hundred buyers read.",
  },
];

export function LongWait() {
  return (
    <section id="long-wait" className="section scroll-mt-20">
      <div className="wrap">
        <Reveal index={0}>
          <div className="mb-12 max-w-[680px]">
            <span className="kicker mb-3.5">The long wait</span>
            <h2 className="mb-4 text-balance">It isn&rsquo;t one ticket. It&rsquo;s a months-long emotional journey.</h2>
            <p className="m-0 text-[17px] leading-relaxed text-slate">
              You collected the cash today and ship in 60 to 120 days. In that gap a confident buyer slowly turns into an
              anxious one &mdash; and an anxious one turns into a refund request. The same words mean something different
              depending on how long she&rsquo;s waited.
            </p>
          </div>
        </Reveal>

        <ol className="mb-14 grid list-none grid-cols-1 gap-[18px] p-0 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <Reveal key={s.day} index={i} as="li">
              <div className="h-full rounded-[18px] border border-border bg-paper p-[22px] shadow-card">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full" style={{ background: s.dot }} />
                  <span className="text-[13px] font-bold tracking-[0.05em]" style={{ color: s.dayColor }}>
                    {s.day}
                  </span>
                </div>
                <h3 className="mb-[7px] font-serif text-[20px] font-semibold text-ink">{s.title}</h3>
                <p className="m-0 text-[14.5px] leading-snug text-slate">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {STAKES.map((s, i) => (
            <Reveal key={s.title} index={i}>
              <div className="h-full rounded-[18px] border border-border bg-sand-2 p-[26px]">
                <h3 className="mb-2.5 font-serif text-[20px] font-semibold text-ink">{s.title}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-slate">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
