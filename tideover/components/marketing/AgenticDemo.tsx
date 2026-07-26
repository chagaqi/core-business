"use client";

import { useEffect, useState } from "react";
import { ChatTurn, DraftArtifact, StreamingText, ToolChecklist } from "@/components/agentic";

/**
 * AgenticDemo (SW11, backlog #12 — ADR-0023) — the homepage's "watch it work"
 * product moment: a SCRIPTED, looping replay of the real onboarding flow's
 * three beats (research checklist → diagnosis → drafted reply + refrain).
 *
 * Proof-only: this is a replay on fictional sample data and says so in the
 * surrounding caption — it never pretends to be a live agent run (the live
 * run exists at /onboarding; this sells the feeling of it). No metrics, no
 * dates — the draft speaks in a confidence band, exactly like the engine.
 * prefers-reduced-motion renders the completed scene statically, no loop.
 */

const CHECKLIST = [
  "Reading tidepool-supply.example",
  "Found the stated ship window",
  "Detected 4 fulfillment stages",
];

const DIAGNOSIS =
  "Your page promises an 8-week build but never says when backers hear from you next — that gap is what turns a quiet wait into a refund request. Here's what I'd send your day-89 backer:";

const DRAFT =
  "Hi Riley — fair question at day 89, and you deserve a real answer. Your order is in the freight leg, and the current window is 2–4 weeks. That's its true position; if it moves, you hear it from us first. Your status page has the running detail. — Mara at Tidepool Supply";

// phase: 0..CHECKLIST.length = checklist progress · then diagnosis types ·
// then the draft shows · then hold and loop.
type Phase = { step: number; diagnosing: boolean; draftVisible: boolean };

const DONE: Phase = { step: CHECKLIST.length, diagnosing: true, draftVisible: true };

export function AgenticDemo() {
  const [phase, setPhase] = useState<Phase>({ step: 0, diagnosing: false, draftVisible: false });
  const [reduced, setReduced] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setPhase(DONE);
      return;
    }
    setPhase({ step: 0, diagnosing: false, draftVisible: false });
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    CHECKLIST.forEach((_, i) => {
      timers.push(setTimeout(() => setPhase((p) => ({ ...p, step: i + 1 })), 1000 * (i + 1)));
    });
    timers.push(
      setTimeout(() => setPhase((p) => ({ ...p, diagnosing: true })), 1000 * CHECKLIST.length + 500),
    );
    return () => timers.forEach(clearTimeout);
  }, [cycle]);

  // draft reveal is driven by the diagnosis finishing (StreamingText onDone);
  // then hold the completed scene, then loop.
  useEffect(() => {
    if (reduced || !phase.draftVisible) return;
    const timer = setTimeout(() => setCycle((c) => c + 1), 9000);
    return () => clearTimeout(timer);
  }, [phase.draftVisible, reduced]);

  return (
    <div className="bg-paper px-6 py-7 text-left sm:px-9" aria-label="Scripted product replay on sample data">
      <ChatTurn role="user">what do backers see on tidepool-supply.example?</ChatTurn>
      <div className="mt-4">
        <ChatTurn role="agent">
          <ToolChecklist
            steps={CHECKLIST.map((label, i) => ({
              label,
              state: i < phase.step ? "done" : i === phase.step ? "active" : "pending",
            }))}
          />
          {phase.diagnosing ? (
            <div className="mt-3">
              <StreamingText
                typewriter={!reduced}
                speedMs={38}
                text={DIAGNOSIS}
                onDone={() => setPhase((p) => ({ ...p, draftVisible: true }))}
              />
            </div>
          ) : null}
          {(reduced || phase.draftVisible) ? (
            <div className="mt-3">
              <DraftArtifact title="Draft — day 89 check-in (SAMPLE)">{DRAFT}</DraftArtifact>
              <p className="mt-3 text-[13px] font-semibold text-ink">
                Nothing sends without you hitting approve.
              </p>
            </div>
          ) : null}
        </ChatTurn>
      </div>
    </div>
  );
}
