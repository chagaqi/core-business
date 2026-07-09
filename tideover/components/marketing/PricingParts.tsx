/**
 * Shared pricing primitives — the SINGLE SOURCE OF TRUTH for the held pricing
 * figures and the guarantee. Extracted verbatim from the original Pilot.tsx so
 * the Home pilot section (<Pilot/>) and the standalone /pricing page render the
 * exact same numbers and copy — change a price in one place, both surfaces move.
 *
 * NUMBERS HELD: every price phrase is byte-for-byte the locked offer. Proof-only:
 * no fabricated metrics, no "most popular" (the tier-2 line is a
 * trigger-conditioned recommendation, not a crowd claim). Both parts are styled
 * for a DARK surface (section-dark); render them on a dark background only.
 */

/**
 * The value ladder — the 3-card tier row (Free pilot / on-proof / scale) plus
 * the deferred-performance-fee line. Reused by <Pilot/> (Home) and /pricing.
 */
export function PricingLadder() {
  return (
    <div className="mb-[22px]">
      <h3 className="mb-6 font-serif text-[20px] font-semibold" style={{ color: "#F4F9F8" }}>
        A simple value ladder
      </h3>
      <div className="grid grid-cols-1 items-stretch gap-[18px] md:grid-cols-3">
        {/* Tier 1 */}
        <div
          className="flex min-h-[150px] flex-col justify-center rounded-[22px] p-7"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
        >
          <div className="font-serif text-[26px] font-semibold" style={{ color: "#F4F9F8" }}>
            Free pilot
          </div>
        </div>

        {/* Tier 2 — emphasized (trigger-conditioned recommendation, not a crowd claim) */}
        <div
          className="flex min-h-[150px] flex-col justify-center rounded-[22px] p-7 md:-translate-y-3"
          style={{ background: "rgba(233,180,134,0.1)", border: "1px solid rgba(233,180,134,0.55)" }}
        >
          <div className="mb-3 text-[13px] font-semibold leading-snug" style={{ color: "#F0C79E" }}>
            Recommended once the pilot proves out on your own tickets.
          </div>
          <div className="font-serif text-[26px] font-semibold" style={{ color: "#F4F9F8" }}>
            $199–$499/mo on proof
          </div>
        </div>

        {/* Tier 3 */}
        <div
          className="flex min-h-[150px] flex-col justify-center rounded-[22px] p-7"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
        >
          <div className="font-serif text-[26px] font-semibold" style={{ color: "#F4F9F8" }}>
            $799–$999+/mo as it scales
          </div>
        </div>
      </div>
      <p className="mt-5 text-[14px] leading-snug" style={{ color: "#A9C2C0" }}>
        Any performance fee is deferred until a real case study exists.
      </p>
    </div>
  );
}

/**
 * The guarantee box — our plain risk-reversal, kept adjacent to the ladder on
 * both surfaces. Copy is verbatim from the locked offer.
 */
export function GuaranteeBox() {
  return (
    <div
      className="rounded-[22px] p-7"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2 4 6v6c0 4.4 3.2 7.6 8 10 4.8-2.4 8-5.6 8-10V6l-8-4Z"
            stroke="#E9B486"
            strokeWidth="1.7"
            fill="none"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="m-0 font-serif text-[20px] font-semibold" style={{ color: "#F4F9F8" }}>
          The guarantee
        </h3>
      </div>
      <p className="m-0 text-[15px] leading-relaxed" style={{ color: "#C7DAD8" }}>
        We measure leading indicators &mdash; faster first response, fewer WISMO tickets, logged saves &mdash;
        against your own baseline. If the pilot doesn&rsquo;t move them, you don&rsquo;t pay. The full
        refund-reduction picture takes a complete 60&ndash;120 day cycle; we report it after the first cohort
        finishes, and we&rsquo;re telling you that up front.
      </p>
    </div>
  );
}
