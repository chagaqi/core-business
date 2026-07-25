import { OnboardingFlow } from "./OnboardingFlow";

export const metadata = {
  title: "Set up Tideover",
  robots: { index: false, follow: false },
};

/**
 * /onboarding/flow (SWAN SPRINT P2) — the conversational onboarding. Public
 * like /onboarding (the classic wizard): the page renders for anyone; every
 * POST it makes is gated server-side (session on /api/onboarding in real mode,
 * rate limits on analyze/preview, session on /api/agent/stream). Becomes the
 * default /onboarding at build step 6; the classic wizard stays reachable.
 */
export default function OnboardingFlowPage() {
  return <OnboardingFlow />;
}
