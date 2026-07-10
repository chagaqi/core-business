"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { CalButton } from "@/components/booking/CalButton";
import { FoldCard } from "@/components/marketing/paper/FoldCard";
import { ImageSlot } from "@/components/marketing/paper/ImageSlot";

/**
 * S5 — Live before→after demo, DAY-ONE FALLBACK. The single large labeled
 * capture of the real cockpit on sample data; the interactive live embed is a
 * later serialized batch. This is our strongest real proof asset: a working
 * product shown early is a stronger "this is real" signal than any logo.
 *
 * Progressive enhancement: the section server-renders a neutral caption; on the
 * client it reads the `?scene=` deep-link (set by the S2 capability cards) and
 * varies ONLY the caption eyebrow — the varying text is the exact capability
 * label from the plan, and the fixed "Live cockpit on sample data" line is
 * always visible. Reading window.location.search in an effect (rather than
 * useSearchParams) keeps this self-contained and avoids a Suspense boundary.
 *
 * Proof-only: runs on clearly-labeled sample data. No metric is claimed — the
 * demo IS the proof.
 */

/** Scene key → verbatim capability label (must match CapabilityShowcase keys). */
const SCENE_LABELS: Record<string, string> = {
  reassurance: "Reassurance drafts",
  "refund-risk": "Refund-risk scoring",
  wismo: "WISMO triage",
  status: "Customer status pages",
  digest: "Backer & preorder digest",
  escalation: "Escalation flags",
};

export function DemoCenterpiece() {
  const [sceneLabel, setSceneLabel] = useState<string | null>(null);

  useEffect(() => {
    const scene = new URLSearchParams(window.location.search).get("scene");
    if (scene && scene in SCENE_LABELS) setSceneLabel(SCENE_LABELS[scene]);
  }, []);

  return (
    <section id="demo" className="section scroll-mt-24">
      <div className="wrap">
        <Reveal index={0}>
          <div className="mx-auto mb-11 max-w-[680px] text-center">
            <span className="kicker mb-3.5">See it run</span>
            <h2 className="mb-4 text-balance">The tide coming in on a flooded inbox.</h2>
            <p className="mx-auto max-w-[560px] text-[17px] leading-relaxed text-slate">
              Watch a day-89 &ldquo;where IS my order??&rdquo; become a calm, approved reply in your voice. This is the
              live cockpit, on sample data.
            </p>
          </div>
        </Reveal>

        <figure className="mx-auto max-w-[960px]">
          <FoldCard
            index={1}
            lift="strong"
            hover={false}
            className="overflow-hidden rounded-[24px] border border-border bg-paper"
          >
            <ImageSlot slotId="demo-cockpit-capture" aspect="16/10" />
          </FoldCard>
          <Reveal index={2}>
            <figcaption className="mt-4 flex flex-col items-center gap-1 text-center">
              {sceneLabel ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#D2E2E4] bg-accent-card px-3 py-1 text-[12px] font-semibold text-teal">
                  Showing &middot; {sceneLabel}
                </span>
              ) : null}
              <span className="text-[13px] font-medium uppercase tracking-wide text-ink-mute">
                Live cockpit on sample data
              </span>
            </figcaption>
          </Reveal>
        </figure>

        <Reveal index={3}>
          <div className="mt-9 text-center">
            {/* The demo is the show-don't-tell proof; the action it drives is a
                booked demo call (Dylan, 2026-07-09), not a self-serve draft. */}
            <CalButton large>Book a demo &rarr;</CalButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
