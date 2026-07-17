import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { PaperTexture } from "@/components/marketing/paper/PaperTexture";
import "./globals.css";

/**
 * Tideover's brand kit calls for a warm serif (≈ Iowan Old Style) for display
 * and a clean sans for body. Closest Google fonts: Fraunces (display/headlines)
 * + Inter (body). Exposed as CSS vars consumed by tailwind.config.ts + globals.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const title = "Tideover — Keep your presale buyers calm and aboard through the long wait";
const description =
  "Tideover is the presale-specialist support layer for Shopify brands with 60–120 day waits. It reads each order's real timeline and drafts calm, day-stage reassurance — bolted onto the helpdesk you already run.";

export const metadata: Metadata = {
  // Absolute base for OG/Twitter image URLs. Without this, file-based image
  // routes (opengraph-image / twitter-image) fail to prerender with "Invalid
  // URL" because Next can't resolve their relative path to an absolute one.
  // `||` not `??`: an empty APP_URL ("" from an env pull) is not null/undefined, so
  // `??` would pass it straight to new URL("") and crash the build (hit 2026-07-16).
  metadataBase: new URL(process.env.APP_URL || "https://www.tideover.app"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Tideover",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {/* bakes the crumpled-paper tiles once and sets the --paper-crumple
            CSS vars every surface reads; renders nothing itself */}
        <PaperTexture />
        {children}
      </body>
    </html>
  );
}
