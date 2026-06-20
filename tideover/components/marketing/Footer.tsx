import { Logo } from "@/components/ui/Logo";
import { CalButton } from "@/components/booking/CalButton";

/**
 * Site footer. Dark teal surface: wordmark + tagline, a booking CTA, the
 * proof-only disclaimer line, and a small link row to the /vsl pages.
 */
const VSL_LINKS: readonly { label: string; href: string }[] = [
  { label: "Cold Loom", href: "/vsl/cold-loom" },
  { label: "Landing VSL", href: "/vsl/landing-vsl" },
  { label: "Partner demo", href: "/vsl/partner-demo" },
  { label: "Playbook promo", href: "/vsl/playbook-promo" },
];

export function Footer() {
  return (
    <footer className="section-dark">
      <div className="wrap py-14">
        <div className="flex flex-wrap items-start justify-between gap-7 border-b border-[rgba(255,255,255,0.1)] pb-7">
          <div className="max-w-[420px]">
            <Logo tone="dark" />
            <p className="mb-1.5 mt-3.5 text-[15px] leading-relaxed" style={{ color: "#B9D0CE" }}>
              The support layer that tides your customers over until their order ships.
            </p>
          </div>
          <CalButton variant="ondark">Get a free teardown</CalButton>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-[14px]" style={{ color: "#A9C2C0" }}>
          <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#7E9B98" }}>
            Watch
          </span>
          {VSL_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="no-underline hover:underline" style={{ color: "#E9B486" }}>
              {l.label}
            </a>
          ))}
        </div>

        <p className="mt-6 max-w-[640px] text-[13.5px] leading-relaxed" style={{ color: "#7E9B98" }}>
          Every figure on this page is a target to measure against your own baseline &mdash; never a claimed result. We
          never make hard delivery promises; confidence bands only.
        </p>
      </div>
    </footer>
  );
}
