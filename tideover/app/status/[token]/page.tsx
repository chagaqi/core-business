import type { Metadata } from "next";
import { getPublicStatus } from "@/lib/status";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { StatusView } from "./StatusView";

// Generic title — never leak the customer's name or order into metadata.
export const metadata: Metadata = {
  title: "Your order status",
  description: "A calm, honest view of where your order is in production.",
  robots: { index: false, follow: false },
};

export default async function StatusPage({ params }: { params: { token: string } }) {
  const status = await getPublicStatus(params.token);

  if (!status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand px-6">
        <div className="panel max-w-[440px] p-8 text-center">
          <div className="mb-5 flex justify-center">
            <Logo href="/" />
          </div>
          <h1 className="mb-3 text-[26px]">This order link isn&rsquo;t valid</h1>
          <p className="mb-6 text-[15px] leading-relaxed text-slate">
            The link you followed may be incomplete or expired. Check the link in your confirmation
            email, or reach out to the store and they&rsquo;ll point you to the right place.
          </p>
          <Button href="/" variant="ghost">
            Go to Tideover
          </Button>
        </div>
      </div>
    );
  }

  return <StatusView status={status} token={params.token} />;
}
