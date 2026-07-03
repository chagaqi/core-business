import type { Metadata } from "next";
import BookPage from "./BookPage";

export const metadata: Metadata = {
  title: "Book your free presale-support teardown — Tideover",
  description:
    "Book a free 15-minute presale-support teardown. A real operator looks at how your presale tickets are handled today and tells you honestly whether a pilot is worth your time. No pitch, no card.",
};

export default function Page() {
  return <BookPage />;
}
