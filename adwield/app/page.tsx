import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import FatigueWall from "@/components/FatigueWall";
import Loadout from "@/components/Loadout";
import AdExamples from "@/components/AdExamples";
import FirstStrike from "@/components/FirstStrike";
import Paths from "@/components/Paths";
import Guarantee from "@/components/Guarantee";
import Proof from "@/components/Proof";
import FAQ from "@/components/FAQ";
import CalButton from "@/components/CalButton";
import Footer from "@/components/Footer";
import GameChrome from "@/components/GameChrome";

/**
 * Homepage section order. Booking no longer lives on the homepage — it has its
 * own `/book` route, so the inline `<BookCall/>` section is removed. The page
 * now closes with a focused final-CTA block whose primary `<CalButton>` routes
 * to `/book`.
 *
 * `<AdExamples/>` (the Loadout Wall) now LEADS: it sits immediately after the
 * hero — taking the place the hero's old "Equipped Kit" HUD box held — so on a
 * 1440x900 desktop the first row of example tiles clears the fold. It appears
 * exactly ONCE; the old slot after `<Loadout/>` is removed so there's no
 * duplicate lower down. Every other section + GameChrome is intact.
 */
export default function Page() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <AdExamples />
        <FatigueWall />
        <Loadout />
        <FirstStrike />
        <Paths />
        <Guarantee />
        <Proof />
        <FAQ />

        {/* Final CTA — replaces the old inline-calendar section; routes to /book */}
        <section
          className="section"
          data-quest="Open the war room"
          data-rare="equip"
          data-xp="100"
          data-kicker="War room opened"
        >
          <div className="wrap">
            <div className="panel mx-auto max-w-[760px] px-[30px] py-[44px] text-center md:px-[48px] md:py-[56px]">
              <div className="mono mb-[18px] text-[11px] uppercase tracking-[0.18em] text-gold">
                War Room · Book the Call
              </div>
              <h2 className="mx-auto max-w-[18ch]">
                Equip the weapon. Win the auction.
              </h2>
              <p className="mx-auto mt-[18px] max-w-[54ch] text-[17px] leading-[1.55] text-ink-soft">
                Fifteen minutes. We point the weapon at your product, show you the
                angle we&rsquo;d swing first, and you decide if you want the free
                First Strike built. No deck, no pressure.
              </p>
              <div className="mt-[30px] flex flex-wrap items-center justify-center gap-[18px]">
                <CalButton variant="primary" large>
                  Book your First Strike call
                </CalButton>
                <CalButton variant="quiet">
                  Claim your First Strike{" "}
                  <span className="arrow" aria-hidden="true">
                    &rarr;
                  </span>
                </CalButton>
              </div>
              <p className="mono mt-[22px] text-[11px] leading-[1.5] tracking-[0.04em] text-ink-mute">
                No card · no pitch · capped at 5 brands. Worst case, you leave with
                a free teardown of your account.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <GameChrome />
    </>
  );
}
