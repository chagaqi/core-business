import { Button } from "@/components/ui/Button";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";

/**
 * S3 — Trust / Integration strip. The credibility beat the staircase needs
 * right after the product feels real, filled with what actually ships. NO third-party logo
 * marks: a monochrome logo band reads as a "trusted by" endorsement no matter
 * the caption, collides with the Operator "no borrowed logo" pledge, and several
 * would-be marks aren't live integrations. Instead, plain-TEXT capability chips
 * that mirror the onboarding DataSourcePicker's truth exactly (live / beta /
 * coming-soon), so the site and product never disagree — plus the founder
 * credibility anchor and a link into /security.
 *
 * Thin sand-2 band with a torn-paper top edge.
 */
interface Chip {
  text: string;
  /** Truth state, mirrored from DataSourcePicker. Drives the status dot only. */
  state: "live" | "beta" | "soon";
}

const CHIPS: readonly Chip[] = [
  { text: "Kickstarter · BackerKit — backer-list import, live", state: "live" },
  { text: "Webhook — any helpdesk that can POST JSON (beta)", state: "beta" },
  { text: "Shopify — coming soon", state: "soon" },
];

const DOT: Record<Chip["state"], string> = {
  live: "bg-teal",
  beta: "bg-amber-status",
  soon: "bg-ink-mute",
};

export function TrustStrip() {
  return (
    <section className="section-sand2 relative">
      {/* Torn-paper top edge — the sand-2 band tearing up into the section above. */}
      <PaperEdge variant="torn" color="sand-2" flip />

      <div className="wrap flex flex-wrap items-center justify-between gap-x-10 gap-y-6 py-[clamp(2rem,4vw,3rem)]">
        <div className="min-w-[300px] flex-1">
          <p className="mb-3 text-[14px] font-semibold text-ink">Connects to where your backers already live.</p>
          <ul className="m-0 flex flex-wrap gap-2.5 p-0">
            {CHIPS.map((chip) => (
              <li
                key={chip.text}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-paper px-3.5 py-1.5 text-[12.5px] font-medium text-slate"
              >
                <span className={`h-1.5 w-1.5 flex-none rounded-full ${DOT[chip.state]}`} aria-hidden />
                {chip.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-[260px] max-w-[380px] flex-1">
          <p className="m-0 text-[13.5px] leading-relaxed text-ink-mute">
            Built by an operator who spent two years tiding customers over 60-plus-day waits.
          </p>
          <div className="mt-2.5">
            <Button href="/security" variant="quiet">
              See what we can and can&rsquo;t see &rarr;
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
