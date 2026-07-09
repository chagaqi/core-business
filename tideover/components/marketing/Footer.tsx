import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CalButton } from "@/components/booking/CalButton";
import { FEATURE_COLUMNS, resolveHref } from "@/components/marketing/nav/nav-data";

/**
 * Site footer — dark-teal surface rebuilt into a sitemap-style link mesh (the
 * studied model's traffic-acquisition structure), but the iron rule holds: only
 * routes that ship TODAY are rendered. The Compare column, a Resources blog, a
 * help center, and an affiliate program are documented as build-next, never
 * linked before they exist (one live link beats three "coming soon").
 *
 * Product links mirror the header mega-menu (single source of truth: nav-data +
 * resolveHref, so the DEMO_MODE fallback stays in sync). Proof-only: no ratings,
 * counts, badges, status pills, or "featured on" rows.
 */

// Mirror the mega-menu's product surfaces (short footer labels, shared hrefs).
const featBy = new Map(FEATURE_COLUMNS.flatMap((c) => c.items).map((i) => [i.label, i] as const));
const PRODUCT_LINKS: readonly { label: string; href: string }[] = [
  { label: "Reassurance inbox", key: "Reassurance inbox" },
  { label: "Refund-risk", key: "Refund-risk scoring" },
  { label: "Status pages", key: "Customer status pages" },
  { label: "Goodwill gifts", key: "Goodwill gifts" },
  { label: "WISMO forecast", key: "WISMO cohort forecast" },
  { label: "Baseline report", key: "Day-0 baseline report" },
].map((x) => ({ label: x.label, href: resolveHref(featBy.get(x.key)!) }));

const RESOURCE_LINKS: readonly { label: string; href: string }[] = [
  { label: "Cold Loom", href: "/vsl/cold-loom" },
  { label: "Landing VSL", href: "/vsl/landing-vsl" },
  { label: "Partner demo", href: "/vsl/partner-demo" },
  { label: "Playbook promo", href: "/vsl/playbook-promo" },
];

const COMPANY_LINKS: readonly { label: string; href: string }[] = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Who it's for", href: "/who-its-for" },
  { label: "Founder story", href: "/#operator" },
  { label: "Case study (sample)", href: "/case-study" },
  { label: "Security", href: "/security" },
  { label: "Procurement", href: "/procurement" },
];

const HELP_LINKS: readonly { label: string; href: string }[] = [
  { label: "Email us", href: "mailto:contact@tideover.app" },
  { label: "Book a call", href: "/book" },
  { label: "Security", href: "/security" },
  { label: "Procurement", href: "/procurement" },
];

const LEGAL_LINKS: readonly { label: string; href: string }[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const HEAD_CLS = "text-[12px] font-semibold uppercase tracking-[0.1em]";
const LINK_CLS = "no-underline hover:underline";

function FooterCol({
  heading,
  links,
  linkColor = "#A9C2C0",
}: {
  heading: string;
  links: readonly { label: string; href: string }[];
  linkColor?: string;
}) {
  return (
    <div>
      <span className={HEAD_CLS} style={{ color: "#7E9B98" }}>
        {heading}
      </span>
      <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0 text-[14px]">
        {links.map((l) => {
          const external = l.href.startsWith("mailto:") || l.href.startsWith("http");
          return (
            <li key={l.label + l.href}>
              {external ? (
                <a href={l.href} className={LINK_CLS} style={{ color: linkColor }}>
                  {l.label}
                </a>
              ) : (
                <Link href={l.href} className={LINK_CLS} style={{ color: linkColor }}>
                  {l.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
          className="grid grid-cols-2 gap-x-8 gap-y-9 pt-9 sm:grid-cols-3 lg:grid-cols-6"
          style={{ color: "#A9C2C0" }}
        >
          <FooterCol heading="Product" links={PRODUCT_LINKS} />

          {/*
            Compare — the studied model's traffic hand (compare-vs pages that catch
            high-intent search). Omitted from render until the first page ships.
            Build-next, recommended order:
              /compare/hiring-a-va      (the real alternative our ICP weighs first)
              /compare/gorgias
              /compare/zendesk-macros
            Light this column the moment /compare/hiring-a-va exists.
          */}

          <FooterCol heading="Resources" links={RESOURCE_LINKS} linkColor="#E9B486" />
          <FooterCol heading="Company" links={COMPANY_LINKS} />
          {/*
            TODO(Dylan): affiliate program — a business call, not something we
            invent. Decide commission %, cookie window, and payout threshold, then
            build /affiliates and light a slot here. No badge, number, or link
            until it ships. (Also deliberately omitted: a "featured on" backlink
            row and an "all systems operational" status pill — no real placements
            and no public uptime page; /status/[token] is customer order status.)
          */}
          {/*
            Case study: the "(sample)" link above points at /case-study — the
            honest TEMPLATE (every metric/quote/outcome a dashed placeholder slot,
            [CASE STUDY PLACEHOLDER] until real). It fills with real deltas vs. the
            day-0 baseline the day the first pilot cohort closes; the label keeps
            "(sample)" until then. Stays out of the top nav per the header/IA
            decision. Founder story above is our real first-party narrative today.
          */}
          <FooterCol heading="Help" links={HELP_LINKS} />
          <FooterCol heading="Legal" links={LEGAL_LINKS} />
        </nav>

        <p className="mt-9 max-w-[640px] text-[13.5px] leading-relaxed" style={{ color: "#7E9B98" }}>
          Every figure on this page is a target to measure against your own baseline &mdash; never a claimed result. We
          never make hard delivery promises; confidence bands only.
        </p>

        <div
          className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px]"
          style={{ color: "#7E9B98" }}
        >
          <span>&copy; {new Date().getFullYear()} Tideover</span>
        </div>
      </div>
    </footer>
  );
}
