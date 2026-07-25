import type { Metadata } from "next";
import { OnboardingFlow } from "./flow/OnboardingFlow";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "Set up Tideover — watch it do the homework",
  description:
    "Give Tideover your store or campaign URL and watch it read your page, diagnose the wait-experience gaps, and turn three answers into a working reassurance playbook.",
};

/**
 * /onboarding (SWAN SPRINT P2, build step 6) — the conversational flow is the
 * default; ?classic=1 keeps the proven 5-step wizard one query-param away
 * (escape hatch until the flow soaks; delete nothing).
 */
export default function OnboardingPage({
  searchParams,
}: {
  searchParams?: { classic?: string };
}) {
  if (searchParams?.classic) {
    return (
      <main className="min-h-screen bg-sand">
        <OnboardingWizard />
      </main>
    );
  }
  return <OnboardingFlow />;
}
