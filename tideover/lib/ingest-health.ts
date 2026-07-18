import type { IngestRejectReason } from "@/lib/ingest-auth";
import { vendorSpec, type IngestVendor } from "@/lib/channel-adapters/ingest-vendors";

/**
 * Ingest health counters (ADR-0021, part 2 — "scream when it's broken").
 *
 * THE FAILURE THIS EXISTS TO KILL: a merchant whose webhook 401s or drops
 * everything sees a CALM, EMPTY QUEUE. In the 10-merchant simulation, four
 * merchants (17,450 orders, including the two best-paying) ran a full month on a
 * cockpit that looked healthy while their real inbox burned. Silence looked like
 * a quiet week. Nothing anywhere in the product said otherwise — the one check
 * built to catch it (`integrationHealth`) returns quiet:false when nothing has
 * EVER arrived, i.e. it is coded to look the other way in precisely the case that
 * matters.
 *
 * So every terminal outcome of the ingest route is COUNTED, with its reason, and
 * "nothing is arriving" is rendered as an alarm, never as peace.
 *
 * STORAGE: process-local and bounded, deliberately.
 *   - The ALARM ITSELF is derived from DURABLE data (has any real inbound ever
 *     landed for this merchant? — lib/setup-status.ts), so it survives a restart,
 *     a redeploy and a cold serverless instance. It cannot be lost.
 *   - These counters are the DIAGNOSIS layered on top: what was rejected, why,
 *     and the exact fix. They are best-effort telemetry — a restart resets them,
 *     and a multi-instance deploy sees only its own instance's rejections. That
 *     is acceptable because a broken webhook keeps retrying: the counters refill
 *     within one vendor retry cycle. Persisting them needs a new repository +
 *     Merchant field (both owned by another lane), so they are deliberately kept
 *     out of the datastore seam rather than half-persisted. See ADR-0021 §5.
 */

export type IngestEventKind =
  /** passed auth + schema + tag filter and became a ticket. */
  | "accepted"
  /** a vendor redelivery of an external_id we already have. Healthy. */
  | "duplicate"
  /** ingested, but no order could be matched — it sits in the unmatched bucket. */
  | "unmatched"
  /** dropped at the edge by the merchant's own presale tag rule. */
  | "discarded"
  /** turned away at the door: auth failed. THIS is the silent killer. */
  | "rejected"
  /** authenticated but the body did not match the canonical schema. */
  | "invalid"
  /** an operator-fired connection test from the connect panel. */
  | "test";

export interface IngestEvent {
  at: string;
  kind: IngestEventKind;
  /** the URL `[channel]` label the payload arrived on. */
  channel: string;
  /** why, for the failure kinds. */
  reason?: string;
  /** one short human detail (never a raw payload — no PII in telemetry). */
  detail?: string;
}

export interface IngestFailure extends IngestEvent {
  /** the copy-paste fix shown to the merchant on /app/setup. */
  fix: string;
}

export interface IngestHealthSnapshot {
  counts: Record<IngestEventKind, number>;
  /** every payload that reached the endpoint, whatever happened to it. */
  total: number;
  lastEventAt: string | null;
  lastAcceptedAt: string | null;
  lastRejectedAt: string | null;
  /** the most recent failure (rejected/invalid/discarded), with its fix. */
  lastFailure: IngestFailure | null;
  /** newest-first, capped. */
  recent: IngestEvent[];
}

/** POSTs to a token that resolves to no merchant land here — a real signal
 *  (someone pasted a stale/rotated URL into their helpdesk) with nowhere else
 *  to go. Read by the ops surface, never by a merchant. */
export const UNKNOWN_TOKEN_BUCKET = "__unknown_token__";

const RECENT_LIMIT = 25;
const MAX_MERCHANTS = 500;

const KINDS: IngestEventKind[] = [
  "accepted",
  "duplicate",
  "unmatched",
  "discarded",
  "rejected",
  "invalid",
  "test",
];

interface Bucket {
  counts: Record<IngestEventKind, number>;
  total: number;
  lastEventAt: string | null;
  lastAcceptedAt: string | null;
  lastRejectedAt: string | null;
  lastFailure: IngestFailure | null;
  recent: IngestEvent[];
}

function emptyBucket(): Bucket {
  const counts = {} as Record<IngestEventKind, number>;
  for (const k of KINDS) counts[k] = 0;
  return {
    counts,
    total: 0,
    lastEventAt: null,
    lastAcceptedAt: null,
    lastRejectedAt: null,
    lastFailure: null,
    recent: [],
  };
}

const buckets = new Map<string, Bucket>();

const FAILURE_KINDS: ReadonlySet<IngestEventKind> = new Set(["rejected", "invalid", "discarded"]);

/**
 * The copy-paste fix for a failure. Vendor-specific because the whole point is
 * that the merchant can act on it without opening a support ticket: it names the
 * screen, the field, and the value.
 */
export function ingestFixFor(args: {
  kind: IngestEventKind;
  reason?: string;
  channel: string;
}): string {
  const { kind, reason, channel } = args;
  const vendor: IngestVendor =
    channel === "gorgias" || channel === "zendesk" || channel === "helpscout"
      ? (channel as IngestVendor)
      : "generic";
  const label = vendorSpec(vendor).label;

  if (kind === "discarded") {
    return `Your presale tag rule is dropping everything that arrives. Open Setup → Connect your helpdesk, check the tags listed there against the tags ${label} is actually stamping on these tickets, and make one of them match. Nothing is being stored until they do.`;
  }
  if (kind === "invalid") {
    return `${label} is reaching Tideover but its request body doesn't match the template. Re-copy the "Request body template" from Setup → Connect your helpdesk and paste it into the ${label} webhook body, replacing what is there now.`;
  }

  switch (reason as IngestRejectReason | undefined) {
    case "no-root-secret":
      return "Tideover itself is misconfigured: WEBHOOK_ROOT_SECRET is not set on this deployment, so no webhook can be accepted. This is on us — contact support. Nothing is being lost at your end; your helpdesk will keep retrying.";
    case "missing-credential":
      if (vendor === "helpscout") {
        return "Help Scout isn't sending a signature. In Help Scout, open Manage → Apps → Webhooks, edit the Tideover webhook, and paste the Secret Key shown in Setup → Connect your helpdesk into its Secret Key field.";
      }
      if (vendor === "generic") {
        return "Your webhook isn't sending a credential. Add the header shown in Setup → Connect your helpdesk — either X-Tideover-Signature (an HMAC of the body) or Authorization: Bearer with your connection secret.";
      }
      return `${label} isn't sending its credential. Open ${
        vendor === "gorgias"
          ? "Gorgias → Settings → Integrations → HTTP integration"
          : "Zendesk → Admin Center → Apps and integrations → Webhooks"
      }, edit the Tideover webhook, and add the header \`Authorization: Bearer <your connection secret>\` exactly as shown in Setup → Connect your helpdesk.`;
    case "bad-bearer":
      return `The connection secret ${label} is sending doesn't match. It was probably copied with a stray space, truncated, or your ingest URL was rotated. Copy the connection secret again from Setup → Connect your helpdesk and paste it into the Authorization header, replacing the old value.`;
    case "bad-signature":
      if (vendor === "helpscout") {
        return "Help Scout's signature didn't verify — its Secret Key doesn't match ours. In Help Scout → Manage → Apps → Webhooks, replace the Secret Key with the exact value in Setup → Connect your helpdesk (no spaces, all 32 characters).";
      }
      return "The X-Tideover-Signature didn't verify. Your tool must send sha256=<hex HMAC-SHA256 of the exact raw request body> using the signing secret in Setup → Connect your helpdesk. Signing a re-serialized or pretty-printed body is the usual cause.";
    case "ip-not-allowed":
      return `This request came from an IP outside your ingest allowlist, so it was refused. Either add ${label}'s webhook egress IPs to INGEST_IP_ALLOWLIST or turn the allowlist off — until then nothing from ${label} will be accepted.`;
    default:
      return "This payload was refused at the door. Re-check the credential and URL in Setup → Connect your helpdesk against what your helpdesk is sending.";
  }
}

/** Record one terminal ingest outcome. Never throws — telemetry must not be able
 *  to fail a webhook and make a vendor retry a payload we already handled. */
export function recordIngestEvent(
  merchantId: string,
  ev: Omit<IngestEvent, "at"> & { at?: string },
): void {
  try {
    let bucket = buckets.get(merchantId);
    if (!bucket) {
      if (buckets.size >= MAX_MERCHANTS) {
        // Bounded memory: evict the least-recently-active merchant.
        let oldestKey: string | null = null;
        let oldestAt = Infinity;
        for (const [key, b] of buckets) {
          const t = b.lastEventAt ? Date.parse(b.lastEventAt) : 0;
          if (t < oldestAt) {
            oldestAt = t;
            oldestKey = key;
          }
        }
        if (oldestKey) buckets.delete(oldestKey);
      }
      bucket = emptyBucket();
      buckets.set(merchantId, bucket);
    }

    const event: IngestEvent = {
      at: ev.at ?? new Date().toISOString(),
      kind: ev.kind,
      channel: ev.channel,
      ...(ev.reason ? { reason: ev.reason } : {}),
      ...(ev.detail ? { detail: ev.detail } : {}),
    };

    bucket.counts[event.kind] = (bucket.counts[event.kind] ?? 0) + 1;
    bucket.total += 1;
    bucket.lastEventAt = event.at;
    if (event.kind === "accepted" || event.kind === "duplicate" || event.kind === "unmatched") {
      bucket.lastAcceptedAt = event.at;
    }
    if (event.kind === "rejected") bucket.lastRejectedAt = event.at;
    if (FAILURE_KINDS.has(event.kind)) {
      bucket.lastFailure = {
        ...event,
        fix: ingestFixFor({ kind: event.kind, reason: event.reason, channel: event.channel }),
      };
    }
    bucket.recent.unshift(event);
    if (bucket.recent.length > RECENT_LIMIT) bucket.recent.length = RECENT_LIMIT;

    // One structured line per terminal outcome so a failing install is greppable
    // in the platform logs even before anyone opens /app/setup.
    if (FAILURE_KINDS.has(event.kind)) {
      console.warn(
        JSON.stringify({
          event: `ingest.${event.kind}`,
          merchantId,
          channel: event.channel,
          reason: event.reason ?? null,
        }),
      );
    }
  } catch {
    /* telemetry is never load-bearing on the request path */
  }
}

export function getIngestHealth(merchantId: string): IngestHealthSnapshot {
  const b = buckets.get(merchantId) ?? emptyBucket();
  return {
    counts: { ...b.counts },
    total: b.total,
    lastEventAt: b.lastEventAt,
    lastAcceptedAt: b.lastAcceptedAt,
    lastRejectedAt: b.lastRejectedAt,
    lastFailure: b.lastFailure ? { ...b.lastFailure } : null,
    recent: b.recent.slice(),
  };
}

/** Test seam. */
export function resetIngestHealth(merchantId?: string): void {
  if (merchantId) buckets.delete(merchantId);
  else buckets.clear();
}
