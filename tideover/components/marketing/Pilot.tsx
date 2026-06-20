import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

/**
 * The founding-partner pilot — a dark section. Headline + "what's included"
 * checklist on one side, the value ladder + honest guarantee on the other.
 * Pricing and the deferred performance fee come straight from the locked offer.
 * CTA uses the ondark button variant.
 */
const INCLUDED: readonly string[] = [
  "Works inside your helpdesk — nothing to migrate.",
  "Timeline-aware, human-approved replies in two fixed daily windows.",
  "A day-by-day reassurance playbook, built from your real tickets.",
  "Leading-indicator measurement vs. your own clean baseline.",
  "Logged “saves” — anxious buyers who stayed aboard.",
  "Founder-led, by hand, for one full presale cycle.",
];

export function Pilot() {
  return (
    <section id="pilot" className="section section-dark scroll-mt-20">
      <div className="wrap">
        <Reveal index={0}>
          <div className="mb-11 max-w-[720px]">
            <span className="kicker mb-3.5" style={{ color: "#E9B486" }}>
              The founding-partner pilot
            </span>
            <h2 className="mb-4 text-balance">We&rsquo;ll run your presale support by hand for one cycle. Free.</h2>
            <p className="m-0 text-[17px] leading-relaxed" style={{ color: "#BDD4D2" }}>
              Concierge first. The founder and our drafting system run your presale support manually, inside your own
              helpdesk &mdash; capturing the day-by-day reassurance language that works, measured against a clean
              baseline.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[22px] md:grid-cols-2">
          {/* included card */}
          <Reveal index={1}>
            <div
              className="rounded-[22px] p-[30px]"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <span
                className="mb-5 inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-bold"
                style={{ background: "#E9B486", color: "#5A2D14" }}
              >
                Free &middot; one full cycle
              </span>
              <h3 className="mb-5 font-serif text-[22px] font-semibold" style={{ color: "#F4F9F8" }}>
                What&rsquo;s included
              </h3>
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] leading-snug" style={{ color: "#D7E6E4" }}>
                    <span className="mt-px flex-none font-bold" style={{ color: "#E9B486" }} aria-hidden>
                      &#10003;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Button href="/book" variant="ondark">
                  Apply for a founding-partner pilot &rarr;
                </Button>
              </div>
            </div>
          </Reveal>

          {/* ladder + guarantee */}
          <div className="flex flex-col gap-[22px]">
            <Reveal index={2}>
              <div
                className="rounded-[22px] p-7"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                <h3 className="mb-4 font-serif text-[20px] font-semibold" style={{ color: "#F4F9F8" }}>
                  A simple value ladder
                </h3>
                <div className="flex flex-wrap items-center gap-2.5 text-[14.5px]" style={{ color: "#D7E6E4" }}>
                  <span
                    className="rounded-full px-3.5 py-1.5 font-semibold"
                    style={{ background: "rgba(233,180,134,0.18)", border: "1px solid rgba(233,180,134,0.4)", color: "#F0C79E" }}
                  >
                    Free pilot
                  </span>
                  <span aria-hidden style={{ color: "#7FA0A4" }}>
                    &rarr;
                  </span>
                  <span className="rounded-full px-3.5 py-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                    $199–$499/mo on proof
                  </span>
                  <span aria-hidden style={{ color: "#7FA0A4" }}>
                    &rarr;
                  </span>
                  <span className="rounded-full px-3.5 py-1.5" style={{ background: "rgba(255,255,255,0.07)" }}>
                    $799–$999+/mo as it scales
                  </span>
                </div>
                <p className="mt-4 text-[14px] leading-snug" style={{ color: "#A9C2C0" }}>
                  Any performance fee is deferred until a real case study exists.
                </p>
              </div>
            </Reveal>

            <Reveal index={3}>
              <div
                className="rounded-[22px] p-7"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
              >
                <div className="mb-3.5 flex items-center gap-2.5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 2 4 6v6c0 4.4 3.2 7.6 8 10 4.8-2.4 8-5.6 8-10V6l-8-4Z"
                      stroke="#E9B486"
                      strokeWidth="1.7"
                      fill="none"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3 className="m-0 font-serif text-[20px] font-semibold" style={{ color: "#F4F9F8" }}>
                    An honest guarantee
                  </h3>
                </div>
                <p className="m-0 text-[15px] leading-relaxed" style={{ color: "#C7DAD8" }}>
                  We measure leading indicators &mdash; faster first response, fewer WISMO tickets, logged saves &mdash;
                  against your own baseline. If the pilot doesn&rsquo;t move them, you don&rsquo;t pay. The full
                  refund-reduction picture takes a complete 60&ndash;120 day cycle; we report it after the first cohort
                  finishes, and we&rsquo;re telling you that up front.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
