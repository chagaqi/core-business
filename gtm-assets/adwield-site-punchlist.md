# Adwield site — design-tweaks punch-list

**Status (2026-06-17): BUILD ON HOLD.** Chaga said do NOT build/deploy yet — he's sending inspiration sites to pull design tweaks from. This file captures the tweak list + the Tideover Cal code so nothing is lost. Feed this + the inspiration sites into the next build workflow.

Live site: **www.adwield.com** (+ /book). Project: `adwield/` (Next.js 14 + TS + Tailwind + Framer Motion).

---

## Pending design tweaks

### 1. Loadout 4×24 grid renders as ugly PLAIN TEXT — needs a real visual inventory grid
- **Component:** `adwield/components/Loadout.tsx`.
- The "Inventory · Cycle Loadout · 4×24" block currently shows as a wall of text: `Angle 01 Mechanism … v01 v02 v03 v04 v05 v06 / Angle 02 Identity … v07 CRIT v09 … / Angle 03 Objection … / Angle 04 Proof …` + the honest note, all unstyled.
- **Fix:** rebuild as a proper designed grid — **4 angle columns × 6 variation cells (v01–v24)**, each angle with its label (Mechanism / Identity / Objection / Proof) + one-line sub, the **CRIT cell highlighted** (legendary treatment), the `Launch → Read @ 2wk → Reload` pill, and the honest note styled (not raw text). Command Deck idiom.

### 2. Move the ad-examples wall ("The Loadout Wall") UP — first row above the fold on desktop
- The ad examples look great but should **lead**. On desktop, position the wall so the **first row peeks above the fold**, likely in the hero region — **REPLACING the hero "Character · Equipped Kit" HUD stats box** (hit rate / crit / loadout / fatigue).
- **Components:** `Hero.tsx` (remove/replace the Equipped Kit box), `AdExamples.tsx`, `app/page.tsx` (reorder so the wall sits high).
- ⚠️ CONFIRM with Chaga: "fold" = the desktop page fold, and yes-replace the Equipped Kit box.

### 3. Preview the Loadout Wall WITH VIDEO
- Wire the placeholder tiles to play **9:16 sample videos** so we can see the design with motion.
- ⚠️ CAVEAT (proof-only + ownership): Creatify's actual ad videos may be used ONLY as a throwaway visual mock to eyeball the layout — they are NOT ours and must NOT ship on the live site as "our examples." For production, swap to Adwield's own rendered ads (or clearly-neutral stock).

### 4. (Whatever Chaga's inspiration sites add — PENDING.)

---

## Tideover booking — Cal inline embed (for the FUTURE Tideover site build; NOT built yet)
- **Namespace:** `tidedisco` · **calLink:** `bookthecall/tidedisco` · inline embed · `#my-cal-inline-tidedisco` · month_view.
- Tideover gets its own Next.js build later (same pattern as Adwield's `/book`). This is its discovery-call event.
- Exact snippet Chaga provided:

```html
<!-- Cal inline embed code begins -->
<div style="width:100%;height:100%;overflow:scroll" id="my-cal-inline-tidedisco"></div>
<script type="text/javascript">
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "tidedisco", {origin:"https://app.cal.com"});
Cal.config = Cal.config || {};
Cal.config.forwardQueryParams = true;
  Cal.ns.tidedisco("inline", {
    elementOrSelector:"#my-cal-inline-tidedisco",
    config: {"layout":"month_view","useSlotsViewOnSmallScreen":"true"},
    calLink: "bookthecall/tidedisco",
  });
  Cal.ns.tidedisco("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
</script>
<!-- Cal inline embed code ends -->
```
