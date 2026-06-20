import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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
      <body>{children}</body>
    </html>
  );
}
