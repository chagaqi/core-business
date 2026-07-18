import { tenantScope } from "@/lib/tenant";
import type { Merchant } from "@/lib/types";
import type { MerchantRepository, Repositories } from "@/lib/repositories/types";

/**
 * Tenant-scoped repository wrapper (ADR-0020). In auth0 mode getRepositories()
 * returns this wrapper; every method re-resolves the request's TenantScope
 * (lib/tenant.ts) at call time:
 *
 *   unscoped → pass through to the base driver, byte-for-byte today's
 *              behavior (demo hosts, public surfaces, scripts, cron, tests).
 *   scoped   → the merchants repository answers ONLY for merchants the
 *              session user owns (ownerSub === sub) or is an attached member
 *              of (memberSubs includes sub — seats). findById/findBySlug/
 *              findByInboxToken on someone else's merchant return null —
 *              indistinguishable from "does not exist".
 *   denied   → (marker present, no session — middleware should have 401ed)
 *              reads return nothing, writes throw. Fail closed.
 *
 * Scoping the MERCHANTS repository is the isolation seam: every operator
 * flow (pages via merchants.list(), APIs + lib/service/import/export/gift
 * flows via merchants.findById) resolves its merchant through it before
 * touching child collections, so a foreign merchantId dead-ends at the
 * lookup. Child repositories are reached only with merchant ids that
 * survived this gate.
 */

/** Owner or attached member (seats) — the one membership predicate. */
function matches(m: Merchant, sub: string): boolean {
  return m.ownerSub === sub || (m.memberSubs ?? []).includes(sub);
}

function scopedMerchants(base: MerchantRepository): MerchantRepository {
  const gate = (m: Merchant | null, sub: string): Merchant | null =>
    m && matches(m, sub) ? m : null;

  return {
    async findById(id) {
      const s = await tenantScope();
      if (s.kind === "denied") return null;
      const m = await base.findById(id);
      return s.kind === "scoped" ? gate(m, s.sub) : m;
    },
    async findBySlug(slug) {
      const s = await tenantScope();
      if (s.kind === "denied") return null;
      const m = await base.findBySlug(slug);
      return s.kind === "scoped" ? gate(m, s.sub) : m;
    },
    async findByInboxToken(token) {
      const s = await tenantScope();
      if (s.kind === "denied") return null;
      const m = await base.findByInboxToken(token);
      return s.kind === "scoped" ? gate(m, s.sub) : m;
    },
    async findByOwnerSub(sub) {
      const s = await tenantScope();
      if (s.kind === "denied") return null;
      if (s.kind === "scoped" && sub !== s.sub) return null;
      return base.findByOwnerSub(sub);
    },
    async findByMemberOrOwnerSub(sub) {
      const s = await tenantScope();
      if (s.kind === "denied") return null;
      // Deny-by-default: a scoped session may only resolve ITSELF.
      if (s.kind === "scoped" && sub !== s.sub) return null;
      return base.findByMemberOrOwnerSub(sub);
    },
    async list() {
      const s = await tenantScope();
      if (s.kind === "denied") return [];
      const all = await base.list();
      return s.kind === "scoped" ? all.filter((m) => matches(m, s.sub)) : all;
    },
    async create(merchant) {
      const s = await tenantScope();
      if (s.kind === "denied") throw new Error("no tenant session");
      // A scoped creator can only ever create their OWN merchant.
      return base.create(s.kind === "scoped" ? { ...merchant, ownerSub: s.sub } : merchant);
    },
    async update(id, patch) {
      const s = await tenantScope();
      if (s.kind === "denied") throw new Error(`not found: ${id}`);
      if (s.kind === "scoped") {
        const current = await base.findById(id);
        if (!current || !matches(current, s.sub)) throw new Error(`not found: ${id}`);
        // Ownership is never re-assignable through the scoped surface, and the
        // seat lists (memberSubs / pendingInvites) are writable ONLY by the
        // owner — a member must not be able to grow or shrink the team.
        const safePatch = { ...patch };
        delete safePatch.ownerSub;
        if (current.ownerSub !== s.sub) {
          delete safePatch.memberSubs;
          delete safePatch.memberEmails;
          delete safePatch.pendingInvites;
        }
        return base.update(id, safePatch);
      }
      return base.update(id, patch);
    },
  };
}

/** Wrap a driver's repositories with tenant scoping (merchants seam). */
export function withTenantScope(base: Repositories): Repositories {
  return { ...base, merchants: scopedMerchants(base.merchants) };
}
