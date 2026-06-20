import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

/**
 * The reference uses a grotesk display + a mono wordmark. Closest Google
 * fonts: Space Grotesk (display/body) + Space Mono (wordmark, eyebrows, HUD
 * labels). Exposed as CSS vars consumed by tailwind.config.ts fontFamily.
 */
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

const title = "Adwield — Equip your secret weapon in the ad auction";
const description =
  "Adwield is an AI-native ad-creative engine for functional-consumables brands. More hits. More crits. Every two weeks.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Adwield",
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
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
