import type { Metadata } from "next";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "Set up Tideover — near-frictionless onboarding",
  description:
    "Answer a few questions about your brand, your tools, and your real production timeline. Tideover turns them into a working day-stage reassurance playbook.",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-sand">
      <OnboardingWizard />
    </main>
  );
}
