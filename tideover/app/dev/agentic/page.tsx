import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";

export const metadata = { title: "Agentic kit gallery (dev)", robots: { index: false, follow: false } };

/**
 * /dev/agentic (ADR-0023) — dev-only visual contract for the agentic component kit.
 * Everything rendered here is CANNED SAMPLE DATA; the page 404s in production.
 */
export default function AgenticGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}
