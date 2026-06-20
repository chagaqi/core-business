import type { Metadata } from "next";
import BookPage from "./BookPage";

/**
 * /book — the dedicated First Strike booking landing page (the destination the
 * site CTAs now link to as a real URL, not a scroll anchor).
 *
 * This file is a server component so it can export route-level <title>/metadata;
 * the interactive body (the inline Cal calendar + Framer Motion reveals) lives in
 * the client component `./BookPage`. The page deliberately does NOT render the
 * homepage Nav or the GameChrome hotbar — it carries its own minimal header.
 */

const title = "Book your First Strike call — Adwield";
const description =
  "Fifteen minutes, no pitch, no card. See the first angle we'd swing at your product and scope your free First Strike — one battle-ready ad of your product, built before you pay.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/book" },
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "Adwield",
    url: "/book",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function Page() {
  return <BookPage />;
}
