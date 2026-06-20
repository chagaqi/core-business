import { Reveal } from "@/components/ui/Reveal";

/**
 * Honest-fit section — two cards drawn from the sales-page who-it's-for / not-for
 * lists. Calm and disqualifying on purpose: we'd rather both sides find out fast.
 */
const FIT: readonly string[] = [
  "You're graduating a Kickstarter, Indiegogo, or BackerKit campaign onto Shopify.",
  "You sell hardware, design, or made-to-order goods with 60–120 day waits.",
  "You're juggling backers, late pledges, and fresh preorders at once.",
  "Your inbox floods with “where's my order?” for months.",
  "You'd rather keep the sale than fight a chargeback.",
];

const NOT_YET: readonly string[] = [
  "You ship in-stock orders within a few days.",
  "You want to replace your whole helpdesk.",
  "You sell regulated or supplement goods with timeline liability.",
  "You only have a handful of orders to cover.",
  "You want a bot that auto-fires delivery promises.",
];

export function HonestFit() {
  return (
    <section id="fit" className="section">
      <div className="wrap">
        <Reveal index={0}>
          <div className="mb-11 max-w-[640px]">
            <span className="kicker mb-3.5">Honest fit</span>
            <h2 className="m-0 text-balance">We&rsquo;d rather tell you now if this isn&rsquo;t for you.</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
          <Reveal index={1}>
            <div className="h-full rounded-[20px] border border-[#D6E5E0] bg-paper p-[30px] shadow-card">
              <h3 className="mb-4.5 font-serif text-[21px] font-semibold text-teal">A strong fit if&hellip;</h3>
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {FIT.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] leading-snug text-slate">
                    <span className="mt-px flex-none font-bold text-[#2E7D6E]" aria-hidden>
                      &#10003;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal index={2}>
            <div className="h-full rounded-[20px] border border-border bg-sand-2 p-[30px]">
              <h3 className="mb-4.5 font-serif text-[21px] font-semibold text-[#9A6B45]">Probably not yet if&hellip;</h3>
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {NOT_YET.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[15px] leading-snug text-slate">
                    <span className="mt-px flex-none font-bold text-[#B5836A]" aria-hidden>
                      &mdash;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
