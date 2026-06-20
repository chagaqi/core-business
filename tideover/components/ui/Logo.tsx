import Link from "next/link";
import { clsx } from "clsx";

/**
 * Tideover wordmark — wave-line mark + serif logotype. `tone` flips colors for
 * dark surfaces. Used in every nav/header so the brand reads consistently.
 */
export function Logo({
  tone = "light",
  href = "/",
  className,
}: {
  tone?: "light" | "dark";
  href?: string;
  className?: string;
}) {
  const ink = tone === "dark" ? "#F4F9F9" : "#0E5366";
  const inner = (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <path
          d="M2 15c2.4 0 2.4-3 4.8-3s2.4 3 4.8 3 2.4-3 4.8-3 2.4 3 4.8 3"
          stroke={ink}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M2 10c2.4 0 2.4-3 4.8-3s2.4 3 4.8 3 2.4-3 4.8-3 2.4 3 4.8 3"
          stroke="#D9762F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-serif text-[20px] font-semibold tracking-tightish" style={{ color: ink }}>
        Tideover
      </span>
    </span>
  );
  return (
    <Link href={href} aria-label="Tideover home" className="no-underline">
      {inner}
    </Link>
  );
}
