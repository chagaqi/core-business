import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CalButton } from "@/components/booking/CalButton";

/**
 * Site footer. Dark teal surface: wordmark + tagline, a booking CTA, a
 * three-column site map (Explore / Trust / Watch), the proof-only disclaimer
 * line, and a legal row. Only routes that ship today are linked — the /for/*
 * persona network and /resources log (plan phase 2) get columns once they exist,
 * never a link to a page that isn't there.
 */
const EXPLORE_LINKS: readonly { label: string; href: string }[] = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Who it’s for", href: "/who-its-for" },
  { label: "See the live demo", href: "/#demo" },
  { label: "Pricing", href: "/#pricing" },
];

const TRUST_LINKS: readonly { label: string; href: string }[] = [
  { label: "Security", href: "/security" },
  { label: "Procurement", href: "/procurement" },
];

const VSL_LINKS: readonly { label: string; href: string }[] = [
  { label: "Cold Loom", href: "/vsl/cold-loom" },
  { label: "Landing VSL", href: "/vsl/landing-vsl" },
  { label: "Partner demo", href: "/vsl/partner-demo" },
  { label: "Playbook promo", href: "/vsl/playbook-promo" },
];

const LEGAL_LINKS: readonly { label: string; href: string }[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
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

        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-8 gap-y-9 pt-9 sm:grid-cols-3"
          style={{ color: "#A9C2C0" }}
        >
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#7E9B98" }}>
              Explore
            </span>
            <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0 text-[14px]">
              {EXPLORE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="no-underline hover:underline" style={{ color: "#A9C2C0" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#7E9B98" }}>
              Trust
            </span>
            <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0 text-[14px]">
              {TRUST_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="no-underline hover:underline" style={{ color: "#A9C2C0" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#7E9B98" }}>
              Watch
            </span>
            <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0 text-[14px]">
              {VSL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="no-underline hover:underline" style={{ color: "#E9B486" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <p className="mt-9 max-w-[640px] text-[13.5px] leading-relaxed" style={{ color: "#7E9B98" }}>
          Every figure on this page is a target to measure against your own baseline &mdash; never a claimed result. We
          never make hard delivery promises; confidence bands only.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]" style={{ color: "#A9C2C0" }}>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="no-underline hover:underline" style={{ color: "#A9C2C0" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
