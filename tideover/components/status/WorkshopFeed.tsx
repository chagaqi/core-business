import { clsx } from "clsx";
import { readableAccent } from "@/lib/color";
import { timeAgo } from "@/lib/time";
import type { PublicStatus } from "@/lib/status";

/**
 * "Latest from the workshop" (ADR-0009). Renders the merchant's most recent
 * public updates on the customer status page + embeddable widget, so a backer
 * who checks twice sees real motion (the labor illusion — Buell & Norton 2011).
 *
 * This is the merchant's OWN broadcast: text + an optional externally-hosted
 * image (max-width:100%, never uploaded). A relative freshness stamp ("2 days
 * ago") replaces any hard date. If there are no updates it renders NOTHING — no
 * empty box, no "no updates yet" placeholder that would read as silence.
 */
export function WorkshopFeed({
  updates,
  accent,
  compact = false,
}: {
  updates: PublicStatus["updates"];
  accent?: string;
  compact?: boolean;
}) {
  if (!updates || updates.length === 0) return null;

  // Any accent used as TEXT or a thin edge must clear AA on the sand/paper bg.
  const edge = accent ? readableAccent(accent) : "var(--teal)";

  return (
    <section className={clsx(compact ? "" : "panel p-6 md:p-7")}>
      <p className="kicker mb-4" style={{ color: edge }}>
        Latest from the workshop
      </p>

      <ol className="flex flex-col gap-4">
        {updates.map((u, i) => (
          <li
            key={`${u.createdAt}-${i}`}
            className={clsx(
              "relative rounded-xl border border-border bg-sand pl-4 pr-4 py-3.5",
              compact && "bg-paper",
            )}
          >
            <span
              aria-hidden
              className="absolute inset-y-2 left-0 w-1 rounded-full"
              style={{ background: edge }}
            />
            <p
              className={clsx(
                "whitespace-pre-line break-words leading-relaxed text-slate",
                compact ? "text-[13px]" : "text-[15px]",
              )}
            >
              {u.text}
            </p>

            {u.imageUrl ? (
              // Merchant-supplied external URL (ADR-0009): render at max-width,
              // never uploaded/stored. Plain <img> so no next/image domain config
              // is required for an arbitrary merchant host.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={u.imageUrl}
                alt="Workshop update"
                loading="lazy"
                className="mt-3 block w-full max-w-full rounded-lg border border-border object-cover"
              />
            ) : null}

            <p className={clsx("mt-2 text-ink-mute", compact ? "text-[11px]" : "text-[12px]")}>
              {timeAgo(u.createdAt)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
