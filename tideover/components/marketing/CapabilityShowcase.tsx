import { Reveal } from "@/components/ui/Reveal";
import { ImageSlot } from "@/components/marketing/paper/ImageSlot";

/**
 * S2 — Capability Showcase. Turns "presale support layer" into six concrete
 * jobs the product visibly does, killing the vague-AI reflex before skepticism
 * sets in. Each card is a paper motif (ImageSlot with a CSS/SVG paper fallback)
 * + a 2–3-word job label + one verb-first outcome line, and the whole card is a
 * deep-link into the live demo (S5) pre-seeded for that job.
 *
 * Proof-only: every job below is a SHIPPED capability (reassurance engine,
 * refund-risk engine, inbox/forecast, /status pages, seed group-separation, the
 * escalation lib + /api/escalate). Each card links to
 * the live demo running that job, not to a claim.
 *
 * Deep-link discipline: the query param comes BEFORE the hash
 * (`?scene=<key>#demo`) — a query after a hash won't parse. The scene keys here
 * MUST match the keys DemoCenterpiece reads.
 */
interface Capability {
  /** Deep-link scene key — must match DemoCenterpiece's SCENE_LABELS keys. */
  scene: string;
  label: string;
  outcome: string;
  /** ImageSlot id — maps to the papercraft motif in IMAGE-SHOT-LIST.md §2–7. */
  slotId: string;
  /** Screen-reader description of the paper motif. */
  motif: string;
}

const CAPABILITIES: readonly Capability[] = [
  {
    scene: "reassurance",
    label: "Reassurance drafts",
    outcome: "Answer the long wait in your voice, ready for one-click approval.",
    slotId: "motif-boat",
    motif: "Paper boat on a wave",
  },
  {
    scene: "refund-risk",
    label: "Refund-risk scoring",
    outcome: "See which anxious buyer is one reply from disputing.",
    slotId: "motif-buoy",
    motif: "Paper buoy",
  },
  {
    scene: "wismo",
    label: "WISMO triage",
    outcome: "Catch every “where’s my order?” the moment it lands, and start the reply.",
    slotId: "motif-tideline",
    motif: "Paper tide-line",
  },
  {
    scene: "status",
    label: "Customer status pages",
    outcome: "Give each buyer a calm page showing where their order really is.",
    slotId: "motif-lighthouse",
    motif: "Paper lighthouse",
  },
  {
    scene: "digest",
    label: "Backer & preorder digest",
    outcome: "Keep Kickstarter backers and Shopify preorders on separate clocks.",
    slotId: "motif-strata",
    motif: "Layered paper strata",
  },
  {
    scene: "escalation",
    label: "Escalation flags",
    outcome: "Surface the worry that needs the founder, not a template.",
    slotId: "motif-anchor",
    motif: "Paper anchor",
  },
];

export function CapabilityShowcase() {
  return (
    <section className="section">
      <div className="wrap">
        <Reveal index={0}>
          <div className="mb-11 max-w-[640px]">
            <span className="kicker mb-3.5">What the layer does</span>
            <h2 className="m-0 text-balance">Six jobs the long wait creates &mdash; off your plate.</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap, i) => (
            <Reveal key={cap.scene} index={1 + i}>
              <a
                href={`?scene=${cap.scene}#demo`}
                className="group flex h-full flex-col rounded-[20px] border border-border bg-paper p-6 no-underline shadow-card transition-[transform,box-shadow] duration-300 ease-in-out hover:-translate-y-1.5 hover:shadow-lift"
              >
                <div className="mb-5 w-[92px]">
                  <ImageSlot slotId={cap.slotId} aspect="1/1" />
                  <span className="sr-only">{cap.motif}</span>
                </div>
                <h3 className="mb-2 font-serif text-[20px] font-semibold text-ink">{cap.label}</h3>
                <p className="m-0 text-[15px] leading-snug text-slate">{cap.outcome}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-teal transition-transform duration-300 ease-in-out group-hover:translate-x-0.5">
                  See it run &rarr;
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
