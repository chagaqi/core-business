window.MC_DATA = {
  meta: {
    day0: "2026-06-17",
    sprintStart: "2026-06-14",
    programDays: 93,
    day90: "2026-09-15",
    founder: "Chaga Chai",
    goal: "$20K/mo is the stretch ambition (a ~Day 150-180 outcome); the honest 90-day = V1 $6-9K MRR + 3 case studies",
    updated: "2026-06-14"
  },
  deliverables: [
    {id:"d01",order:1, group:"Day 1 — Conversion Spine", title:"Adwield Brand Kit", what:"The Adwield voice bible — First Strike, Knight/Forge paths, loadout glossary, No-Risk Loadout.", path:"../gtm-assets/adwield-brand-kit.html", unlocks:"Locks the V1 voice — every downstream Adwield asset inherits it."},
    {id:"d02",order:2, group:"Day 1 — Conversion Spine", title:"Adwield Landing Page", what:"Deployable single-file page: First Strike -> Choose Your Path (Knight/Forge).", path:"../gtm-assets/v1/adwield-landing-page.html", unlocks:"[HUMAN] Deploy to adwield.com + wire the {{first_strike_form}} + {{book_call}} fields."},
    {id:"d05",order:5, group:"Day 1 — Conversion Spine", title:"Adwield Sales Page (long-form)", what:"Voice-heavy long-form sales page, 2 hero variants.", path:"../gtm-assets/v1/v1-sales-page.html", unlocks:"Use as the deep sales page / paste into a builder."},
    {id:"d06",order:6, group:"Day 1 — Conversion Spine", title:"Adwield VSL / Loom Scripts", what:"4 scripts x hooks for the cold-DM Loom, landing VSL, pre-frame, delta.", path:"../gtm-assets/v1/v1-vsl-scripts.html", unlocks:"[HUMAN] Record the Cold-DM Loom (First Strike walkthrough)."},
    {id:"d07",order:7, group:"Day 1 — Conversion Spine", title:"Adwield DM Outreach System", what:"LinkedIn+X openers, follow-ups, reply-handlers (the zero-warmup first-cash channel).", path:"../gtm-assets/v1/v1-dm-outreach.html", unlocks:"[HUMAN] Load into your DM tracker; ready to fire post-graduation."},
    {id:"d11",order:11,group:"Day 2 — Outreach & Nurture", title:"Adwield Email Sequences", what:"4 cold sequences + reactivation + post-call + pilot->retainer.", path:"../gtm-assets/v1/v1-email-sequences.html", unlocks:"[HUMAN] Load into Smartlead once domains warm (~21 days)."},
    {id:"d12",order:12,group:"Day 2 — Outreach & Nurture", title:"Adwield Content Bank", what:"~55 X+LinkedIn posts + 4 newsletters + refill hooks.", path:"../gtm-assets/v1/v1-content-bank.html", unlocks:"[HUMAN] Queue the content engine."},
    {id:"d13",order:13,group:"Day 2 — Outreach & Nurture", title:"Adwield Sales-Call Kit", what:"Discovery script + 22 objections + pricing + proposal.", path:"../gtm-assets/v1/v1-sales-call-kit.html", unlocks:"[HUMAN] Internalize before first calls."},
    {id:"d18",order:18,group:"Outreach Engine — Overnight Rebuild", title:"Outreach & Communication Playbook", what:"The durable reference: core principles, the 2026 meta, channel playbooks, the hook-sourcing engine, tailored Adwield plays.", path:"../gtm-assets/outreach-playbook.html", unlocks:"The reference every outreach + sales asset is built on."},
    {id:"d19",order:19,group:"Outreach Engine — Overnight Rebuild", title:"Outreach Proof (Evidence)", what:"5+ real-operator sources per tactic; 10 of 11 PROVEN. The proof the outreach language works.", path:"../gtm-assets/outreach-proof.html", unlocks:"Read this to trust the scripts."},
    {id:"d20",order:20,group:"Outreach Engine — Overnight Rebuild", title:"Copy Standard + Message Exemplars", what:"The anti-slop bar (minimal em-dashes, cut 30-60%) plus the 8 paste-grade message exemplars + the warm-reply objection tree.", path:"../gtm-assets/copy-standard.html", unlocks:"The quality gate for every line of copy."},
    {id:"d21",order:21,group:"Outreach Engine — Overnight Rebuild", title:"Adwield Prospecting SOP", what:"The daily routine: build the watchlist, the Meta Ad Library scan, First Strike production, the 10-touch day.", path:"../gtm-assets/v1/v1-prospecting-sop.html", unlocks:"[HUMAN] Run this daily once graduated."},
    {id:"d23",order:23,group:"Outreach Engine — Overnight Rebuild", title:"Real Scripts Library (cited + linked)", what:"The actual verbatim outreach + sales scripts proven operators publish (cold email, DM, sales call, follow-up, agency), each with a working link + proof of scale, marked VERBATIM / WEAK / PARAPHRASE.", path:"../gtm-assets/real-scripts-library.html", unlocks:"The receipts: verify our scripts against the real ones."}
  ],
  sprint: {
    start: "2026-06-14",
    note: "Agent-heavy; Chaga approves + handles deploy/record handoffs; skill-drilling continues underneath",
    days: [
      {
        day: 1,
        date: "2026-06-14",
        theme: "Both funnels, end to end",
        items: [
          { text: "Adwield brand kit locked (V1 voice bible: First Strike, Knight/Forge paths, loadout glossary, No-Risk Loadout)", tag: "[AGENT]", deliv: "d01" },
          { text: "Adwield landing page drafted (single-file: First Strike → Choose Your Path Knight/Forge)", tag: "[AGENT]", deliv: "d02" },
          { text: "V1 long-form sales page drafted (full conversion spine: hero → bridge insight → 4x24 mechanism → proof-only credibility → guarantee → offer)", tag: "[AGENT]", deliv: "d05" },
          { text: "V1 VSL scripts written (sales-page VSL + short outreach VSL variants)", tag: "[AGENT]", deliv: "d06" },
          { text: "V1 DM outreach system drafted (LinkedIn/X sample-backed variants, Track-routed, objection-bank linked)", tag: "[AGENT]", deliv: "d07" },
          { text: "Output organized into the gtm-assets/v1 folder", tag: "[AGENT]" },
          { text: "Approve the offer + landing-page structure; confirm the conversion spine reads true", tag: "[HUMAN]" }
        ]
      },
      {
        day: 2,
        date: "2026-06-15",
        theme: "Outreach + nurture engines",
        items: [
          { text: "V1 expanded email sequences written (4-email cold cadence + follow-ups, Track-routed)", tag: "[AGENT]", deliv: "d11" },
          { text: "V1 content bank built (5-pillar posts + newsletter shells, [CASE STUDY PLACEHOLDER]s left literal)", tag: "[AGENT]", deliv: "d12" },
          { text: "V1 sales-call kit assembled (discovery script, live-quote sheet, objection bank, close)", tag: "[AGENT]", deliv: "d13" },
          { text: "Every sequence written, labeled, and organized", tag: "[AGENT]" },
          { text: "Approve sequences + voice; flag any copy that over-claims or breaks honesty-lock", tag: "[HUMAN]" }
        ]
      },
      {
        day: 3,
        date: "2026-06-16",
        theme: "Assemble + stage to launch",
        items: [
          { text: "Wire both funnels: landing pages → Stripe + Calendly placeholders linked end to end", tag: "[AGENT]", deliv: "d02" },
          { text: "Organize every sequence per tool (Smartlead campaigns / DM tracker / helpdesk macros)", tag: "[AGENT]" },
          { text: "Stage the made-for-them-sample + prospect-list pipeline (Scout-Personalizer queue loaded, A-tier 24 first)", tag: "[AGENT]" },
          { text: "Produce the [HUMAN] HANDOFF CHECKLIST for the Jun-17 loaded launch", tag: "[AGENT]" },
          { text: "Record the VSLs (V1 sales-page + outreach cuts)", tag: "[HUMAN]", deliv: "d06" },
          { text: "Deploy the landing pages (free host, live URLs)", tag: "[HUMAN]", deliv: "d02" },
          { text: "Buy domains (brand + 2-3 cold-email lookalikes) + start the ~21-day warmup", tag: "[HUMAN]" },
          { text: "Load sequences into tools (Smartlead / DM tracker / helpdesk) + approve all copy", tag: "[HUMAN]" }
        ]
      }
    ]
  },
  ventures: {
    v1: {
      "id": "v1",
      "name": "Adwield",
      "tagline": "The AI-ads creative engine — more hits, more crits, every two weeks. Equip a weapon instead of hiring an agency: 4 angles, 24 AI UGC variations, proven on your own product first, free.",
      "accent": "v1",
      "scores": {
        "opportunity": 8,
        "pain": 9,
        "builderConfidence": 8,
        "executionDifficulty": 7
      },
      "hormozi": {
        "dream": 9,
        "likelihood": 6,
        "time": 8,
        "effort": 8,
        "value": 54
      },
      "honestTarget": "By Day 90 (Sat Sep 12): $6,000-9,000 MRR (realistic ~2-3 retainers at solo-founder capacity) + 3 documented founding-partner case studies + a replenishing lead pipeline (+10/wk, never starves) + Perceived Likelihood 6 to 8 measured via observable funnel deltas. $20K/mo is NOT the 90-day target — it is a ~Day 150-180 outcome that needs ASP lift plus a first Post/Editor VA. Near-term checkpoints: first cash ~Day 16-21 (Jun 30-Jul 5), $3-5K cash cleared ~Day 30-35 (Jul 14-19), 1-2 retainers ~Day 45 (Jul 29), 3 case studies ~Day 75-80 (Aug 28-Sep 2).",
      "positioning": "For growth-stage DTC functional-consumables brands ($20-100K/mo Meta + TikTok spend, founder is decision-maker) fighting the 7-week creative-fatigue clock: I find your next winning ad before your last one dies — 4 hypothesis angles into 24 AI UGC variations every 2 weeks, launched and tagged in your own account. Unlike AI tools that hand you a $110/mo license and zero hands, volume agencies that bill you to be slow and brand-blind, or sniper shops selling one perfect ad into a flooded auction — I'm newer than the 10-year agencies, so I prove it the only honest way: a free rendered ad of your own product before you pay a cent, and the risk stays on me. Volume is the method, the winning ad is the hero. Vertical specialist (functional consumables only) at the lean tier the big shops skip; capped at 5 brands so you're never the deprioritized account.",
      "method": {
        "name": "The 4x24 Framework",
        "desc": "4 hypothesis ANGLES x 6 VARIATIONS = 24 deliverables per 2-week cycle, launched live in the client's account, read at the 2-week mark, losers killed, winners doubled, next 4 angles loaded — so fresh creative is always in-auction before the 7-week fatigue wall. The 4 angles: PAS (problem-agitate-solve, highest-EV cold opener), Founder/Origin Authenticity (trust transfer), Mechanism/Ingredient Education (rational permission-to-buy), Social-Proof/Transformation (the universal closer/scale angle). Always ship all 4 every cycle — the AOV x avatar cheat-sheet decides spend weighting and which angle leads, never which to drop. Each angle fans into 6 variations by moving ONE lever at a time (hook / opening-3s visual / format / runtime / CTA) so the read is clean. Diagnostic gates: thumb-stop (kill <25%, scale >35%), hold-rate (kill <20%, scale >35%), link CTR (kill <0.8%, scale >1.5%), after a ~$20-30 / ~2,000-impression spend gate. The name is not the moat: the moat is WHO picks the angles (operator judgment), the all-in $200-500 production economics that make 24 affordable, the production-and-launch labor a lean 2-person team doesn't have hands for, and the compounding cross-cycle pattern library.",
        "source": "4x24-framework-spec.md"
      },
      "gate": {
        "modeA": "Pre-graduation (S0, the [HUMAN]-only skill gate): V1 owns the whole day so the one gate that unlocks all V1 revenue gets its full deep-work hours.",
        "modeB": "Post-graduation, post-first-cash: V1's budget settles to ~6-7 focused hrs/day. Delivery is FLOORED; sample-render and content are the FLEX buckets cut first on a heavy-delivery day.",
        "trigger": "V1 first cash banked (~Day 35-45) or the Day-45 backstop. Capacity guard: if V1-delivery load exceeds ~6 hrs/day for 3+ consecutive days, FREEZE new V1 selling (do not sign brand #3)."
      },
      "beachhead": "DTC functional-consumables brands only — mushroom coffee, adaptogen gummies, functional beverages, greens/superfood powders, nootropic stacks, mushroom chocolates — at $20-100K/mo Meta + TikTok spend where the founder is the decision-maker. Product-centric not person-centric, so the avatar holds the product and the uncanny-valley penalty is structurally low. Entry on Archetype A (Wounded Veteran) emotional wound, win in Archetype B (Volume-Player) capacity lane, convert Archetype C (Solo + Lean Team) as the dream client. The scarce asset is the 24 A-tier brands (of a 79-brand list) — never burn one on a sub-bar render.",
      "offerLadder": [
        { "rung": "0a", "name": "1 made-for-you sample (their own brand)", "price": "$0", "purpose": "Cold-outreach opener — the #1 reply-getter and the single highest-trust action in the business. Kills 'is the AI any good?' and 'does he even know my brand?' at once. Rule: never send a cold email to a priority prospect without their sample in it." },
        { "rung": "0b", "name": "Founding-partner pilot: 5 videos, instrumented for a before/after CTR + hold-rate delta", "price": "$0", "purpose": "Earns the account AND manufactures the first case studies. Capture the control baseline BEFORE the pilot ships or there is no case study. Framed as status not charity: a founding slot against the published 5-brand cap." },
        { "rung": "1", "name": "10-video pack (one-time)", "price": "$497", "purpose": "PUBLIC price, foot-in-door, LEAD WITH THIS. At <2.5% of one month's spend for a $20-100K/mo brand it is an impulse yes, not a deliberation. Deliberately underpriced trust-purchase that manufactures a paying relationship; the retainer is where the business lives." },
        { "rung": "2", "name": "Mid retainer (20 videos/mo + bi-weekly strategy call)", "price": "$1.5-2.5K/mo", "purpose": "Primary conversion target. Quoted live at the FOUNDING locked rate on the $20-100K/mo spend branch." },
        { "rung": "3", "name": "Standard retainer (+ reporting + live iteration loop)", "price": "$2.5-3.5K/mo", "purpose": "Core revenue. Start quoting standard not mid once 3 case studies land (the ASP lever)." },
        { "rung": "4", "name": "Premium (+ media buying)", "price": "$5K+/mo", "purpose": "Earned only after demonstrated creative wins, never sold cold. The cleanest path to high ASP per slot and the bridge toward $20K." },
        { "rung": "5", "name": "Skool community", "price": "$97/mo", "purpose": "Month-6+ backend — gated, dark until Gate-1 clears; standalone subscription is killed." }
      ],
      "funnel": [
        { "stage": "Deliverability (warmed inbox)", "assumption": "90-95% inbox", "planWith": "2-3wk warmup, SPF/DKIM/DMARC, plain-text, tracking off" },
        { "stage": "Reply rate (priority, sample-in-email)", "assumption": "8-15%", "planWith": "10% all-reply — sample-led + true hook beats generic 1-3%; no proof yet caps the ceiling. Re-baseline after first 200 sends." },
        { "stage": "Positive reply (genuinely interested)", "assumption": "~78% of replies", "planWith": "~7.5% of sends — the subset that is genuinely interested, not 'nice, not now'" },
        { "stage": "Positive reply -> call/pilot booked", "assumption": "30-40% of positive", "planWith": "35% — the sample converts curiosity, the call converts intent" },
        { "stage": "Call -> free pilot or $497 pack", "assumption": "40-55%", "planWith": "45% — free sample/pilot is low-friction; pack is an impulse-yes at <2.5% of monthly spend" },
        { "stage": "Pilot/pack -> retainer", "assumption": "25-40%", "planWith": "30% — offer doc's own assumption; floor until case studies exist, drifts to 40% after 3 deltas" },
        { "stage": "Rule of thumb", "assumption": "~200-220 priority sample-backed sends per signed retainer pre-proof", "planWith": "Compresses toward ~120-150 sends/retainer after 3 case studies land. Binding constraint = qualified unique brands + sample-production time, NOT email throughput (6 inboxes x ~35/day ~= 210/day, ~10x lead supply)." }
      ],
      "stages": [
        {
          "id": "S0",
          "name": "Graduate the Skill",
          "goal": "Clear the doc-30 Graduation Bar so renders are reliably good enough to send to a real founder. THE [HUMAN] gate, in progress now — a sub-bar render burns a scarce A-tier lead permanently (only 24 exist).",
          "entry": "Today (Day 0). Chaga is mid-ladder on the drills.",
          "exit": "S0 clears IFF the single cold, timed graduation render passes 8/8 first try AND a 10-consecutive-8/8 streak is logged in the practice log. Those two ARE the gate; hit-rate >=80%/25, cold->passing <20min on 3 cold products, and zero FTC fails are leading prerequisite drills that produce the streak.",
          "dayRange": "Day 0 -> ~Day 14 (best case Day 7; PLAN against Day 14)",
          "kpis": [
            { "metric": "Cold graduation render passes 8/8 first try", "target": "1, cold + timed <20 min", "measure": "practice log", "leading": false },
            { "metric": "Consecutive 8/8 streak", "target": "10 in a row", "measure": "practice log", "leading": false },
            { "metric": "Rubric pass-rate (hit-rate)", "target": ">=80% over last 25 renders", "measure": "practice log overall PASS/FAIL", "leading": true },
            { "metric": "Cold sample time", "target": "<20 min, 3 consecutive cold products", "measure": "stopwatch logged in seconds-to-produce", "leading": true },
            { "metric": "24/24 pack completed", "target": "1 logged with wall-clock time", "measure": "practice log + /03-Renders/", "leading": true },
            { "metric": "FTC point-8 fails", "target": "0 (non-negotiable)", "measure": "rubric check #8", "leading": true }
          ],
          "killScale": "SCALE: the instant the gate clears, STOP practicing and start selling (S1 DM ignition). KILL/FIX: if hit-rate is stuck <60% after ~40 renders, the bottleneck is a specific rubric point — read the 1P 2P 3F column, the most-failed check is the next deliberate-practice target (don't grind volume on a broken input). Never send a sub-bar render.",
          "dailyPlan": [
            "AM (~3 hr): run the next drill in the strict D1->D8 ladder (do NOT skip ahead). Log every render's 8-point Slop Rubric verdict before watching the next. Tool: Sora 2 + kie.ai; practice log columns render_id/brand/drill/rubric-8/secs/discard/fix.",
            "Drill ladder order: D1 clean product still (3 passes, >=2 brands) -> D2 consistent character holding product (2 chars, 2 brands) -> D3 single clean 15s talking spot, lipsync locks (x3) -> D4 same char/3 clips change only action+dialogue (2 brands) -> D5 full 6-cell angle set 6/6 (x2 sets) -> D6 clean 24/24 pack on DailyGreens24 (log wall-clock, own ~9.5-hr block) -> D7 speed run cold->passing 15s <20 min (x3, all 3 brands) -> D8 cold-brand drill, never-seen product, sub-20-min 8/8.",
            "Midday (~1 hr): review ONE infra item from the Week-1 critical path. DNS/config is DRAFTED by [AGENT+REVIEW]; your job is review + click-confirm, not building. Done = the day's one infra item tested green.",
            "Day 0 first infra actions: [AGENT+REVIEW] buy brand domain + 2-3 cold-email throwaway lookalike domains (Cloudflare/Namecheap) — the warmup long pole. Set up the practice log.",
            "Day 1: [AGENT+REVIEW] Google Workspace inboxes + SPF/DKIM/DMARC (verify >=9/10 mail-tester) -> connect Smartlead -> TURN WARMUP ON end-of-day (warmup Jun 15 -> email-ready ~Jul 6). Build/configure the agent rig (Scout-Personalizer, Dispatcher DM-triage skeleton, thin Pipeline-Keeper).",
            "Days 2-5: [AGENT+REVIEW] deploy landing page (free host); wire Stripe $497 link (test 4242) + Calendly + Formspree/Tally; begin enriching the 79-list (A-tier 24 first, never fabricate email) once Scout-Personalizer is verified; end-to-end test LP->Stripe->Calendly->form (resolve the 3 contact [FILL]s).",
            "Day 6: D6 gets its own ~9.5-hr full-day block (clean 24/24 pack on DailyGreens24) — log wall-clock, this becomes your real cycle-time number. Do NOT also schedule portfolio renders today.",
            "PM (~30 min): engage 5 named A-tier founders — leave ONE substantive comment (>=1 sentence, on-topic, NO pitch, NO link) on their most-recent post and follow them; stamp tracker note 'engaged + date'. Compute hit-rate (passing / total) and name tomorrow's deliberate-practice target from the most-failed rubric check.",
            "Day 10 GRADUATION DAY: pull a never-before-rendered product image from a real DTC brand NOT on the 79-lead list. Cold, timed <20 min, must pass 8/8 first try. NEVER use an A-tier prospect product for the graduation attempt. If it clears + the 10-streak is logged -> S0 DONE, selling starts."
          ]
        },
        {
          "id": "S1",
          "name": "Go-Live Infra + DM First-Cash",
          "goal": "Stand up the minimal money-collecting stack, start the immovable warmup clock (Day 0/1), and collect first cash via LinkedIn/X DMs to the top 10 (zero warmup) the moment S0 clears.",
          "entry": "Day 0 — infra build runs in PARALLEL with S0 (most needs no rendering skill).",
          "exit": "INFRA-GATE (controllable): end-to-end path tested with Stripe 4242 (LP->Stripe->Calendly->form, no EDIT_ME/[FILL] left) + top-10 A-tier made-for-them samples rendered & hosted with view-analytics + warmup ON since Day 0/1 (mail-tester >=9/10). PROOF-CHECKPOINT (tracked, non-blocking): first $497 pack(s) cleared in Stripe.",
          "dayRange": "Day 0 -> ~Day 21 (DMs ignite the day S0 clears, ~Day 14-16)",
          "kpis": [
            { "metric": "Go-live stack tested end-to-end", "target": "LP->Stripe->Calendly->form, no EDIT_ME/[FILL] left", "measure": "manual test w/ Stripe 4242", "leading": true },
            { "metric": "Warmup started", "target": "Day 0/1 (literal first infra action); mail-tester >=9/10", "measure": "Smartlead warmup ON + mxtoolbox", "leading": true },
            { "metric": "Top-10 A-tier samples rendered", "target": "10 (8 have scripts in doc 26)", "measure": "outreach tracker sample_rendered", "leading": true },
            { "metric": "Priority DMs sent (top 10)", "target": "10, sample-backed", "measure": "tracker sent", "leading": true },
            { "metric": "DM reply rate", "target": ">=25% (warm, hand-picked, sample-backed beats cold-email 10%)", "measure": "tracker replied / DMs landed", "leading": true },
            { "metric": "DM positive replies (of top 10)", "target": "2-3 of 10", "measure": "tracker replied=positive", "leading": true },
            { "metric": "On-track checkpoint (DM-ignition +~4 days)", "target": ">=2 of top-10 replied positively AND >=1 discovery call booked", "measure": "tracker", "leading": true },
            { "metric": "First cash", "target": ">=1 x $497 pack (~$497-1.5K), ~Day 16-21", "measure": "Stripe", "leading": false }
          ],
          "killScale": "SCALE: >=3 of 10 DMs reply positively -> widen DMs to A-tier 11-24 while email warms. KILL/FIX: 0 positive replies after all 10 top-10 DMs land AND 5+ business days elapsed -> the sample quality or hook is the problem (loop back to S0 judgment + hand-rebuild the hook against the 3-part bar), not volume. EARLY-WARN (DM-ignition +~4 days): if <2 positive replies or 0 calls booked, trigger the hook-rebuild loop NOW, before the first-cash deadline.",
          "dailyPlan": [
            "Day 11 (fresh-eyes block): render first batch of top-10 A-tier made-for-them samples (Alice, Brez, Clevr, Hiyo, Kiala, Kin, Magic Mind, Spacegoods have scripts) + host with analytics. Hand-clean {{hook}}/{{product}} per lead against the doc-14 bar (true / specific / says-the-quiet-part).",
            "Day 11 profiles live (checklist, decisions pre-made): set X + LinkedIn bio to doc-20 Option A; banner per checklist (NO follower count / fake logos); About filled from doc-20 origin pack; pin the origin manifesto post; queue doc-20 Week-1 X+LI posts in Typefully. Done = all 5 checked, honesty-lock passed.",
            "Days 12-13: finish top-10 samples + host. DM the top 10 on LinkedIn/X, sample-backed (doc-14 variants, Track-routed). Check reply inbox AM+PM; route every reply.",
            "Reply-routing rule: POSITIVE/'show me'/'when?' -> send Calendly link + stamp call_booked attempt; OBJECTION/'not now' -> log in note, queue the doc-18 objection-bank response; NO/unsubscribe -> mark replied=no, suppress. Done = inbox at zero unactioned AM and PM.",
            "Day 14: first DM replies -> book discovery calls (doc-18). Run the Day-10-equivalent on-track check; if red, trigger hook-rebuild now. Render samples for A-tier 11-18 as DMs land.",
            "Live-quote numbers (no mid-call lookup): $20-100K/mo spend branch -> retainer mid $1.5-2.5K or standard $2.5-3.5K at the FOUNDING locked rate, and offer the $0 instrumented 5-video pilot FIRST; state the real remaining founding-slot count (proof-only, no inflation). $5-20K/mo spend branch -> put the $497 pack in their hand.",
            "Front-load: aim to commit first founding pilot(s) in the ~Day 21-35 window -> capture control baseline FIRST (non-negotiable). Distinguish 'pilot committed' from 'cycle Day-0' — budget 3-7 founder-gated intake days before the 14-day clock starts.",
            "First cash likely begins landing ~Day 16-21 (~$497-1.5K). Cumulative cash target ~$2-3.5K by Day 21."
          ]
        },
        {
          "id": "S2",
          "name": "Email Engine Live",
          "goal": "With domains warmed, run priority sample-backed sends at volume across the full 79-list to feed calls beyond the DM top-10.",
          "entry": "Warmup complete (~Day 21, email-ready ~Jul 6) AND S0 cleared (samples sendable). Note: on the honest baseline email going live COINCIDES with the DM channel producing first cash — both channels light up together.",
          "exit": "INFRA-GATE (controllable): sustained ~150-250 priority sample-backed sends/wk; reply rate measured on >=200 real sends and re-baselined against the doc-25 funnel; lead list replenished +40 so it doesn't starve ~Day 45. PROOF-CHECKPOINT (tracked): >=1 retainer signed off the email channel.",
          "dayRange": "~Day 21 -> ~Day 45 (then continues as standing motion)",
          "kpis": [
            { "metric": "Priority sample-backed sends/wk", "target": "150-250", "measure": "Smartlead + tracker", "leading": true },
            { "metric": "All-reply rate (priority only)", "target": ">=10% of sends", "measure": "tracker replied (any)", "leading": true },
            { "metric": "Positive-reply rate (priority only)", "target": ">=7.5% of sends (~78% of replies)", "measure": "tracker replied=positive", "leading": true },
            { "metric": "Sample-link click rate", "target": ">=30% of opens", "measure": "host analytics", "leading": true },
            { "metric": "Positive-reply -> call booked", "target": ">=35%", "measure": "tracker call_booked", "leading": true },
            { "metric": "Lead replenishment", "target": "+40 qualified brands/mo (binding constraint)", "measure": "tracker new rows", "leading": true }
          ],
          "killScale": "SCALE: all-reply >=10% sustained over >=200 sends AND >=1 retainer signed -> add inboxes + replenish aggressively. DRIFT/INVESTIGATE: all-reply 5-9% sustained over >=200 sends (nearly doubles sends-per-retainer from ~210 to ~370+) -> hand-rebuild 10 hooks on the WORST-performing Track and re-baseline BEFORE adding any inboxes. KILL/FIX: all-reply <5% over 200 priority sends -> STOP scaling sends; hand-rebuild 20 hooks against the 3-part bar; re-test before resuming. Replies healthy but call-book <20% -> tighten Email-3 (the cycle / head-to-head ask), not the cold open.",
          "dailyPlan": [
            "Day 21: go email-live — load the 4-email cadence (Day 0/2/5/9), Track-routed (1 Wounded-Vet / 2 Volume-Lean, pre-assigned per lead in doc 22). Per-inbox ramp: Wk1 ~10-15/day -> Wk2 ~20 -> Wk3+ 30-40/day ceiling; scale by adding inboxes, never spiking. Tracking OFF; click-track {{sampleLink}} via host.",
            "Daily outreach block (~60 min): DM the day's priority leads + load/monitor the email cadence; check reply inbox AM+PM and route every reply per the S1 routing rule; inbox at zero unactioned.",
            "Weekly quota math (carry these): to clear $3-5K cash (Mix B = 4 packs + 1 retainer first-month ~= $4,988) need ~11 qualified calls <- ~31 positive replies <- ~40 total replies <- ~315 priority sample-backed sends (10% all-reply, ~78% positive). Per net-new retainer pre-proof: ~200-220 priority sends.",
            "Friday lead-gen block (2 hr): Scout-Personalizer [AGENT] enrich + [HUMAN] hook-judgment. Standing replenish +10/wk; surge to +40 in a single week if the unworked-qualified-brands list crosses below 30 (the one binding floor).",
            "Lead accept test at point of execution: run Scout-Personalizer over Meta Ad Library functional-consumables advertisers; accept a brand ONLY if it passes the 3-part ICP test (functional-consumables DTC, est. $20-100K/mo Meta+TikTok spend, reachable founder/marketing lead). Enrichment is [AGENT]; per-lead hand-cleaned hook + made-for-them render judgment stay [HUMAN]. Never fabricate email.",
            "Sample-render block (60-90 min batch, FLEX): render 4-6 made-for-them prospect samples (15s spec, templatized — reuse character family + fixed format, ~15-20 min each). First block cut on a heavy-delivery day.",
            "Send capacity is NOT the constraint (6 inboxes x ~35/day ~= 210/day ~= 10x lead supply). The constraints are unique qualified brands + sample-production time — so lead replenishment and templatized sample batching are the real levers."
          ]
        },
        {
          "id": "S3",
          "name": "Manufacture Proof",
          "goal": "Land founding-partner pilots, capture control baselines BEFORE the pilot ships, deliver cycles, and ship 3 documented creative-delta case studies — lifting Perceived Likelihood 6 to 8. The highest-ROI work in the business.",
          "entry": "First qualified $20-100K/mo fits from S1/S2 calls.",
          "exit": "3 documented founding-partner deltas (control hold-rate -> winner hold-rate, CPA flat-or-better, baseline + 1-line testimonial), each replacing a [CASE STUDY PLACEHOLDER] in the cold email / sell sheet / content (doc 29 Gate-1 component).",
          "dayRange": "~Day 21 -> ~Day 80 (baselines start landing ~Day 21; first delta ~Day 45; 3rd ~Day 75-80)",
          "kpis": [
            { "metric": "Free founding pilots committed", "target": "2-3 by ~Day 30", "measure": "tracker verdict=pilot", "leading": true },
            { "metric": "Baselines captured / pilots started", "target": "100% (every pilot)", "measure": "tracker baseline_captured (proof view)", "leading": true },
            { "metric": "Documented case-study deltas", "target": "1 by ~Day 45 · 3 by ~Day 75-80", "measure": "proof ledger", "leading": false },
            { "metric": "Perceived Likelihood (operationalized)", "target": "6->7 = positive-reply rate rises >=2pts after first case-study swap; 7->8 = pilot->retainer crosses 40%", "measure": "observable funnel deltas", "leading": false },
            { "metric": "Pilot -> retainer conversion", "target": ">=30% (drifts to 40% post-proof)", "measure": "tracker", "leading": true }
          ],
          "killScale": "SCALE: pilot->retainer >=30% on >=3 pilots -> prioritize landing pilots over chasing new replies. KILL/FIX: pilot->retainer <15% on >=4 pilots -> if BEFORE 3 case studies, expected (the cure is shipping case studies, not changing the pitch); if it persists AFTER 3 case studies, review offer/price. Pilot intake stalled >7 days (commit -> cycle Day-0) -> chase the 6-shot assets/claims or SWAP the pilot; don't let the case-study clock idle.",
          "dailyPlan": [
            "The non-negotiable: no baseline screenshot captured before the pilot = no case study = the pilot was wasted proof. Capture the control's hook/hold-rate FIRST, every time.",
            "Distinguish 'pilot committed' (founder said yes) from 'cycle Day-0' (baseline captured + 6-shot asset list + claims + control-baseline access all IN HAND). Budget 3-7 founder-gated intake days; the 14-day delta-read clock starts from cycle Day-0, NOT from commit.",
            "Front-load pilot commits to ~Day 21-35 so all three 14-day cycles finish with margin before Day 90. Pilots #2/#3 must COMMIT by ~Day 45 to make their Day-14 reads by ~Day 70.",
            "Client-delivery block (FLOORED >=2.5 hr protected): active pilot/retainer cycle work — angle lock -> 24 variations -> QC every clip on the Slop Rubric -> launch + tag in their account -> Day-14 read. Capture baseline FIRST on any new pilot.",
            "Run the 2-week iteration loop: D0 lock the 24-grid -> D1-3 produce (script -> render -> edit/caption -> compliance pass) -> D4 launch all 24 -> D5-7 learning phase (hands off) -> D8 first kills (thumb-stop/hold) -> D10 scale decision (CTR/CPA) -> D11-13 scale winners + draft next cycle from survivors -> D14 retro + log all 24 to results sheet.",
            "Capture the delta screenshot as the case study: 'control 0.9% -> winner 1.6% hold-rate +22%, CPA flat'. Contract the proof output via the pilot agreement (right to publish delta + 1-line testimonial). Start the public proof ledger with the first real entry; '2 founding slots left' becomes honest scarcity.",
            "Keep the retainer-without-pilot escape hatch live: a strong-enough sample can close a retainer DIRECTLY off the discovery call, skipping the pilot — the only path to $6-9K MRR by Day 90 if any pilot's intake stalls. Don't make every retainer wait on a completed pilot cycle."
          ]
        },
        {
          "id": "S4",
          "name": "Stack Retainers",
          "goal": "Convert proof into recurring revenue: $3-5K cash -> $6-9K MRR at the solo ceiling, mix lifted toward standard tier.",
          "entry": "First case study in hand (~Day 45) + pilots converting.",
          "exit": "LEADING SUB-GATE (the thing that predicts the $6-9K): pilot->retainer conversion >=30% measured on >=3 pilots. PROOF-CHECKPOINT (tracked, not blocking): $6-9K MRR (realistic ~2-3 retainers at solo-founder capacity), mix mid/standard + packs; outreach now leads with real proof.",
          "dayRange": "~Day 45 -> Day 90",
          "kpis": [
            { "metric": "Retainers signed", "target": "1-2 (~Day 45-60) -> 2-3 by Day 90 (solo-founder capacity ceiling)", "measure": "tracker verdict=retainer + Stripe", "leading": false },
            { "metric": "MRR", "target": "$3-5K (~Day 60) -> $6-9K (Day 90)", "measure": "Stripe / invoices", "leading": false },
            { "metric": "ASP per retainer", "target": "start quoting standard once 3 proofs land", "measure": "quote log", "leading": true },
            { "metric": "Production hrs/wk vs brands live", "target": "< ceiling (~2-3 brands at solo-founder capacity)", "measure": "time log", "leading": true }
          ],
          "killScale": "SCALE: 3 case studies documented -> flip outreach proof-first, raise ASP (quote standard not mid). KILL: production hrs exceed ceiling -> STOP SELLING, START HIRING (Post/Editor VA first). Capacity kill-line: a 24-pack ~= 9-9.5 hrs; 3 brands is sustainable solo, so the realistic ceiling is ~2-3 retainer brands. If V1-delivery load exceeds ~6 hrs/day for 3+ consecutive days, FREEZE new V1 selling (do not sign brand #3). Never sign a 4th brand until the Post/Editor VA is hired and trained — signing past capacity recreates the exact agency-betrayal scar the offer is built to avoid.",
          "dailyPlan": [
            "Run the steady-state weekly template (Day 22 onward): Mon-Fri each day = sample-render (FLEX) + outreach/route + held call slots + content (FLEX) + delivery (FLOORED >=2.5h). Sat = HARD REST (no client work, no calls, no sends). Sun = newsletter SEND (auto/queued) + weekly KPI scoreboard review.",
            "Booked-call slots (PROTECTED, 2x 30 min held): run the 15-min discovery script — spend-branch -> Track -> pain-dig -> pitch -> live quote -> close; log verdict. Expect the first 2-3 calls to be practice/disqualify-heavy (NEW skill).",
            "Quote standard not mid once 3 proofs land (the ASP lever). Do NOT discount the retainer to close early — it trains the wrong buyer and erodes the margin the business runs on. Never inflate the founding-slot count.",
            "Capacity guard each day: delivery is FLOORED >=2.5 hr; cut Block 1 (samples) then Block 4 (content) before ever touching delivery or calls, and never let the lead list starve.",
            "Capacity rule: on a heavy-delivery day, the block cut first is the sample-render/content block — NEVER the client-delivery block and NEVER a booked call.",
            "Friday: +10 new leads (surge +40 if unworked qualified-list <30) + engagement-bait 'comment PACK' post. Newsletter QUEUED + KPI packet [AGENT]-prepped by Review-Prepper so Sunday is review-only.",
            "If V1 production hrs alone exceed the ceiling: stop selling and trigger the VA hire (S5). Fund the Post/Editor VA (frees ~3 hrs/pack) from the first 2-3 retainers."
          ]
        },
        {
          "id": "S5",
          "name": "Bridge to $20K",
          "goal": "Lift ASP to standard/premium across ~5 brands + add the first Post/Editor VA (frees ~3 hrs/pack) -> path to $15-20K (~Day 150-180) and $20K/mo (~Day 180+). Preview only, NOT a 90-day commitment.",
          "entry": "Day-90 state achieved: 3 case studies, $6-9K MRR, pipeline replenishing, capacity at ceiling.",
          "exit": "Gate-1 (doc 29, ALL true): 3 case studies + pipeline reliability (usable-clip yield >= stated %, doc-28 validation closed) + founder-capacity free (DFY below cap OR QC delegated). DWY/community/course stay dark until then; standalone subscription is KILLED.",
          "dayRange": "Day 90+ (preview)",
          "kpis": [
            { "metric": "Post/Editor VA hired + trained", "target": "1, funded from first 2-3 retainers", "measure": "hire log / SOP 7.2", "leading": true },
            { "metric": "ASP lifted to standard/premium", "target": "across ~5 brands", "measure": "quote log / Stripe", "leading": true },
            { "metric": "MRR", "target": "$15-20K (~Day 150-180)", "measure": "Stripe / invoices", "leading": false },
            { "metric": "Gate-1 conditions met", "target": "3 (case studies + pipeline reliability + capacity free)", "measure": "Gate-1 checklist", "leading": false }
          ],
          "killScale": "SCALE: only past Gate-1 — premium ($5K+ media buying) earned only after creative wins. KILL/HOLD: if any Gate-1 condition is false, do NOT expand; DWY/community/course stay dark. Never sign past the solo-founder ceiling until the VA is trained.",
          "dailyPlan": [
            "First move: hire + train the Post/Editor VA, funded from the first 2-3 retainers (SOP 7.2 hire order: Post/Editor VA first).",
            "Lift ASP — don't add logos: 3 standard + 2 premium (~$19K across 5 brands) beats 8 mid-tier brands you can't service. Quote standard/premium once case studies justify it.",
            "Earn premium ($5K+ media buying) only after demonstrated creative wins; it can't be rushed.",
            "Hold Gate-1 before any expansion: DWY/community/course stay dark until 3 case studies + pipeline reliability + founder-capacity-free are all true.",
            "Treat the 5-brand cap as a feature (premium SLA, real scarcity), not a revenue cage. Re-set the $20K date to Day 150-180."
          ]
        }
      ],
      "agents": [
        {
          "name": "Scout-Personalizer",
          "owns": "Per lead-list row -> verified intent-qualification + send-ready opener (new brand / weekly +40 top-up). Pulls live signals via gooseworks (Meta Ad Library, IG, LinkedIn). Outputs a CP record: {{hook}}/{{product}}/Track/sample-concept + email_status enrich->verified. Never fabricates email.",
          "humanTouch": "Chaga reads the opener + confirms the decision-maker (CEO/founder/Head of Growth, still at the company); per-lead hand-cleaned hook + made-for-them render judgment stay [HUMAN].",
          "activeFrom": "NOW (Day 1-2, no-skill, parallel to AM drills) — S1-S2 enrich + replenish"
        },
        {
          "name": "Dispatcher",
          "owns": "(a) Sequencer: load verified email + {{sampleLink}} into the 4-email cadence, route by Track, respect caps; (b) Reply-triage: classify every reply + draft the next action; creates Calendly hold.",
          "humanTouch": "Every reply to a real founder is approved before send (one bad DM burns a scarce lead); may auto-send the Calendly link only on an unambiguous 'when?'. The human decision rule (route POSITIVE/OBJECTION/NO) stays yours.",
          "activeFrom": "NOW (DM-triage skeleton); email side at ~Day 21 — S1 DM, S2 email"
        },
        {
          "name": "Calendar-Filler",
          "owns": "5-pillar / G-A-P skeleton -> drafted posts + newsletter + Friday PACK bait (weekly + monthly refill). Outputs ContP items (Idea -> Writing -> Ready, never auto-Published).",
          "humanTouch": "Approves before publish; leaves every [CASE STUDY PLACEHOLDER] literally in place until a real founding-partner delta exists. Voice stays [HUMAN].",
          "activeFrom": "AFTER FIRST CASH — S3-S4 content scale"
        },
        {
          "name": "Meta-Scout",
          "owns": "Watch the functional-consumables ad landscape for newly-winning renderable formats (speed-to-meta edge). Outputs a weekly 'new winning format' brief -> knowledge vault + drafted teardowns.",
          "humanTouch": "Chaga judges real-signal vs noise + rig-feasibility.",
          "activeFrom": "PHASE 2 (post-Gate-1); read-only scaffold early — S5+"
        },
        {
          "name": "Pipeline-Keeper",
          "owns": "Keep the CRM current (event-driven: send/reply/call/Stripe-clear/baseline -> stamp field, advance stage). Maintains the Proof view (baseline_captured per pilot); flags 0-action projects.",
          "humanTouch": "Mostly autonomous; $ cash + verdict are human-confirmed.",
          "activeFrom": "NOW (thin) — S1 onward; deepen with webhooks after first cash"
        },
        {
          "name": "Review-Prepper",
          "owns": "Assemble the weekly-review packet the evening before review: cap check, funnel scoreboard, Grad-Bar streak, stall flags, proposed 1-3 priorities. Drafts the Friday newsletter for Sunday auto-send.",
          "humanTouch": "The review IS the human work; the agent only prepares the table.",
          "activeFrom": "AFTER FIRST CASH — S3-S4"
        }
      ],
      "budget": [
        { "item": "Domains (brand + 2-3 cold-email lookalikes)", "cost": "~$33 one-time" },
        { "item": "Google Workspace", "cost": "~$14-29/mo" },
        { "item": "Smartlead (cold-email + warmup)", "cost": "~$39/mo" },
        { "item": "Enrichment / lead replenishment (recurring, or gooseworks credits)", "cost": "~$39-49/mo" },
        { "item": "Sora 2 + kie.ai render credits (usage-based, ~$0.15 per 10s clip)", "cost": "~$10-40/mo" },
        { "item": "ChatGPT Plus (Sora-2 app access for the consistent-character MINT step)", "cost": "~$20/mo" },
        { "item": "CapCut (editing) — defer paid Captions to Phase 2", "cost": "$0 (free)" },
        { "item": "Element-9 self-funded micro ad test (optional, one real hold-rate number)", "cost": "~$50-100 one-time" },
        { "item": "Honest month-1 total (well under the $500-750 ceiling)", "cost": "~$155-230" }
      ],
      "risks": [
        "Warmup time delays first revenue (HIGH, timing-fatal): inbox warmup is a fixed ~21-day clock that does not compress. Mitigation: start warmup Day 0/1 as the literal first action; bridge with LinkedIn/X DMs (zero warmup) for the first $3-5K; re-label first cash honestly to ~Day 16-21.",
        "The proof gap throttles conversion (HIGH, the core constraint): Perceived Likelihood sits at 6/10 and is the only growth lever for 90 days; zero case studies at launch. Pilots may convert <30% until proof exists, inflating sends-per-retainer to 300+. Mitigation: race to 3 documented founding-partner deltas (capture the control baseline BEFORE every pilot or there is no case study) — the highest-ROI work in the business.",
        "Solo-founder capacity ceiling caps revenue below $20K (CERTAIN at scale): $20K/mo needs 5+ retainer-equivalents; the solo ceiling is ~2-3 brands. You cannot solo your way to $20K. Mitigation: lift ASP not logos; hire the Post/Editor VA first (S5); reset the $20K date to Day 150-180; treat the 5-brand cap as a feature. FREEZE new selling if V1-delivery load >~6 hrs/day for 3+ days.",
        "Lead-list starvation (MEDIUM-HIGH, silent killer): 79 brands x 4 emails ~= 316 touches yields maybe 1-2 retainers; the funnel runs dry ~Day 45 without replenishment. Mitigation: standing weekly lead-gen (+10/wk, surge +40 if the unworked list crosses below 30); protect the scarce A-tier 24; budget ~15-25 hrs/mo for enrichment + hooks + sample renders.",
        "Sample-production time competes with client delivery (MEDIUM, compounding): every priority send needs a rendered sample first (~15-30 min), directly competing with the ~9.5 hrs/pack of paid delivery. Mitigation: templatize sample production (reuse character family + fixed 15s spec, ~15-20 min); batch weekly; this is the second-strongest argument for the VA hire.",
        "Guarantee exposure under a thin pipeline (LOW-MEDIUM, manageable): a free re-do cycle is ~9.5 hrs of unpaid labor. Mitigation: the guarantee is labor-currency not cash (a $500-budget founder can always honor it); the metric is creative-controllable (hold-rate, not whole-account ROAS); the 5-brand cap bounds worst-case exposure.",
        "Platform / policy risk (IB net-new, intensity 9/10 — the highest pain): swapping a human UGC creator for an AI avatar on the same script/targeting triggers Meta 'misleading or manipulated media' flags and TikTok Spark Ad shutdowns; enforcement is inconsistent and unexplained; a disabled BM costs a high-spend brand six figures overnight, and a labeling/ban policy change could close the arbitrage window. Mitigation: productize 'Policy-Safe Delivery' (AI-voice-over-real-footage option, transparent labeling, disapproval-rate baseline + alerting, disclaimer A/B test); lead compliance-first as the TRUST wedge; monitor buyer-community policy chatter as the leading indicator.",
        "High-trust vertical performance risk (IB net-new): functional consumables are supplement-adjacent, where PURE synthetic testimonials underperform (skincare AI testimonial dropped ROAS 3.2->1.1; CTR 1.8%->0.7%). Mitigation: bias the 4x24 toward HYBRID (AI voice/edit + real footage, or AI for hooks/variants/B-roll) for client work; reserve fully-synthetic talking-heads for TOFU/explainer slots; route around the 'drink-and-react' consumption shot.",
        "Platform-native fast-follow (IB net-new): Meta Advantage+ Creative and TikTok Smart Performance auto-generate creative inside ad manager; if they ship 'good enough' one-click synthetic UGC, basic script->avatar services get commoditized (arbitrage window ~12-24 months). Mitigation: own creative STRATEGY (which angle / which vertical framework / closed-loop testing + compliance-trust brand), not generation — the cross-cycle pattern library is the moat."
      ]
    }
  },
  cadence: {
    phases: [
      {
        "name": "P0 — Skill-Gate Starve",
        "window": "Day 0–14 (Sun Jun 14 → Sun Jun 28)",
        "trigger": "Today",
        "v1Share": "~85% (≈4.5–6 hrs incl. protected AM drills)"
      },
      {
        "name": "P1 — Ignite V1 Cash",
        "window": "~Day 14–35 (Sun Jun 28 → ~Sun Jul 19)",
        "trigger": "S0 graduation clears",
        "v1Share": "~80% (≈5.5–6.5 hrs: renders + DMs + first calls + first delivery)"
      },
      {
        "name": "P2 — Cash Lands, Capacity Opens",
        "window": "~Day 35–60 (~Sun Jul 19 → Thu Aug 13)",
        "trigger": "V1 first cash banked ($3–5K) OR Day-45 backstop (Wed Jul 29) with ≥3 free hrs/day",
        "v1Share": "~65% (≈5 hrs)"
      },
      {
        "name": "P3 — Retainers Compounding",
        "window": "~Day 60–90 (Thu Aug 13 → Sat Sep 12)",
        "trigger": "V1 at ~$6K MRR / retainers stacking",
        "v1Share": "~55–60% (≈4.5–5 hrs)"
      }
    ],
    dailyTemplates: [
      {
        "name": "Variant A — Skill-Phase Day",
        "whenPhase": "P0 (and any day still drilling)",
        "total": "≈4.5–5 hrs (deliberately under ceiling — the gate needs a fresh brain, not a maxed one; the slack is recovery that protects render quality)",
        "blocks": [
          {
            "block": "AM ritual",
            "time": "10 min",
            "engine": "SHARED",
            "what": "Overnight agent review; name today's drill",
            "tag": "[HUMAN]"
          },
          {
            "block": "AM — DRILLS (PROTECTED, do not move)",
            "time": "~3 hr",
            "engine": "V1",
            "what": "The next drill in the D1→D8 ladder (no skipping). Log every render's 8-pt rubric verdict before watching the next.",
            "tag": "[HUMAN]"
          },
          {
            "block": "Midday — infra (review-only)",
            "time": "~1 hr",
            "engine": "V1",
            "what": "Review/confirm ONE Week-1 critical-path infra item; agent drafted the DNS/config, you click-confirm",
            "tag": "[AGENT+REVIEW]"
          },
          {
            "block": "PM — DM network warm + skill admin",
            "time": "~30 min",
            "engine": "V1",
            "what": "Comment+follow 5 named A-tier founders; compute hit-rate; name tomorrow's deliberate-practice target",
            "tag": "[HUMAN]"
          },
          {
            "block": "PM close",
            "time": "10 min",
            "engine": "SHARED",
            "what": "Stamp practice log + V1 tracker; queue tomorrow's drill",
            "tag": "[HUMAN]"
          }
        ]
      },
      {
        "name": "Variant B — Outreach-Phase Day",
        "whenPhase": "P1/P2 — selling & delivering V1",
        "total": "≈6–7 hrs (V1-only)",
        "blocks": [
          {
            "block": "AM ritual",
            "time": "10 min",
            "engine": "SHARED",
            "what": "Overnight review; name today's #1 V1 action",
            "tag": "[HUMAN]"
          },
          {
            "block": "1. SAMPLE-RENDER (FLEX — first cut)",
            "time": "60–90 min",
            "engine": "V1",
            "what": "Batch 4–6 made-for-them prospect samples (15s, templatized). Protect A-tier: re-render until it clears the bar.",
            "tag": "[HUMAN]"
          },
          {
            "block": "2. OUTREACH",
            "time": "60 min",
            "engine": "V1",
            "what": "DM/send the day's priority leads (sample-backed); check + route reply inbox AM (rule in §2B of doc 37). Inbox to zero unactioned.",
            "tag": "[AGENT+REVIEW]"
          },
          {
            "block": "3. BOOKED-CALL slots (PROTECTED)",
            "time": "2× 30 min held",
            "engine": "V1",
            "what": "Run the 15-min discovery script: spend-branch → Track → pain-dig → pitch → live quote → close. Log verdict.",
            "tag": "[HUMAN]"
          },
          {
            "block": "4. CONTENT (FLEX — second cut)",
            "time": "60 min",
            "engine": "SHARED",
            "what": "Doc-20 engine: pull idea → long → X → LI → queue → reply to 5–10 ICP posts. 3×/wk until first cash, daily after.",
            "tag": "[AGENT+REVIEW]"
          },
          {
            "block": "5. CLIENT-DELIVERY (FLOORED ≥2.5 hr — never cut)",
            "time": "≥2.5 hr",
            "engine": "V1",
            "what": "Active pilot/retainer cycle: angle lock → 24 variations → QC every clip → launch → Day-14 read. Baseline FIRST on any new pilot.",
            "tag": "[HUMAN]"
          },
          {
            "block": "PM ritual",
            "time": "20 min",
            "engine": "SHARED",
            "what": "Stamp trackers; queue tomorrow",
            "tag": "[HUMAN]"
          }
        ]
      },
      {
        "name": "Variant C — Delivery-Phase Day",
        "whenPhase": "P3 — full delivery obligations",
        "total": "≈6–7.5 hrs (the ceiling-pressing day). If load exceeds ~6 hrs/day for 3+ consecutive days, FREEZE new V1 selling until it clears.",
        "blocks": [
          {
            "block": "AM ritual",
            "time": "~45 min",
            "engine": "SHARED",
            "what": "Overnight review; name today's plan",
            "tag": "[HUMAN]"
          },
          {
            "block": "1. CLIENT-DELIVERY (FLOORED ≥2.5 hr — never cut)",
            "time": "≥2.5 hr",
            "engine": "V1",
            "what": "Cycle work across live brands; QC every clip; capacity-alarm if >2 brands (see §6 kill-line)",
            "tag": "[HUMAN]"
          },
          {
            "block": "2. BOOKED-CALL slots (PROTECTED)",
            "time": "up to 2× 30 min",
            "engine": "V1",
            "what": "Discovery / pilot→retainer conversion calls — the highest-ROI V1 phase",
            "tag": "[HUMAN]"
          },
          {
            "block": "3. OUTREACH (lean)",
            "time": "30–45 min",
            "engine": "V1",
            "what": "Maintain sends + route replies; lead list never starves (+10/wk floor)",
            "tag": "[AGENT+REVIEW]"
          },
          {
            "block": "4. SAMPLE-RENDER + CONTENT (FLEX)",
            "time": "0–60 min",
            "engine": "SHARED",
            "what": "Whatever survives after the above; first to be cut entirely on a hot day",
            "tag": "[AGENT+REVIEW]"
          },
          {
            "block": "PM close",
            "time": "~45 min",
            "engine": "SHARED",
            "what": "Stamp trackers; queue tomorrow",
            "tag": "[HUMAN]"
          }
        ]
      }
    ],
    weekly: [
      {
        "day": "Mon",
        "v1": "Outreach + 1–2 held calls; delivery cycle",
        "shared": "Growth post (X+LI)"
      },
      {
        "day": "Tue",
        "v1": "Samples + sends + calls; delivery",
        "shared": "Authority teardown post"
      },
      {
        "day": "Wed",
        "v1": "Samples + sends + calls; delivery",
        "shared": "Capture session (20 min, refill Idea Bank ≥10) + creative teardown"
      },
      {
        "day": "Thu",
        "v1": "Samples + sends + calls; delivery",
        "shared": "Authority tutorial post"
      },
      {
        "day": "Fri",
        "v1": "Samples + sends; +10 new leads (surge +40 if unworked <30); Day-14 reads",
        "shared": "V1 lead-gen block (2 hr) + Newsletter QUEUED + KPI packet [A]-prepped (Review-Prepper)"
      },
      {
        "day": "Sat",
        "v1": "—",
        "shared": "HARD REST — no client work, no calls, no sends"
      },
      {
        "day": "Sun",
        "v1": "Light/optional; queue next week",
        "shared": "Newsletter SEND (auto/queued) + weekly KPI scoreboard review (§5)"
      }
    ],
    triage: [
      {
        "rank": 1,
        "task": "Any booked V1 call (discovery / pilot→retainer)",
        "engine": "V1",
        "why": "A no-show burns a scarce A-tier lead and the closest cash; calls don't reschedule cheaply",
        "floor": "always #1 if one is booked"
      },
      {
        "rank": 2,
        "task": "V1 client-delivery on a live cycle (QC + ship today's clips)",
        "engine": "V1",
        "why": "Paid, contractually-guaranteed work; the reputation the whole offer protects",
        "floor": "the FLOOR — never cut"
      },
      {
        "rank": 3,
        "task": "The UGC drill (only while in P0 — the gate)",
        "engine": "V1",
        "why": "Until it clears, nothing else produces V1 cash; it IS the bottleneck",
        "floor": "protected in P0; n/a after graduation"
      },
      {
        "rank": 4,
        "task": "V1 outreach + reply-routing (DMs/sends, inbox to zero)",
        "engine": "V1",
        "why": "Feeds calls #1; replies left cold go stale fast",
        "floor": "do at least the reply-routing"
      },
      {
        "rank": 5,
        "task": "V1 sample-render batch (FLEX)",
        "engine": "V1",
        "why": "Fuels future outreach but not today's cash; templatized, easily batched tomorrow",
        "floor": "first thing cut"
      },
      {
        "rank": 6,
        "task": "Content + ICP engagement (FLEX)",
        "engine": "SHARED",
        "why": "Compounds slowly; an agent can draft it; a skipped day is survivable",
        "floor": "second thing cut"
      }
    ],
    timeline: [
      {
        "day": "Day 0",
        "date": "Wed Jun 17",
        "v1": "Buy domains; set up practice log; continue drill ladder; warmup long-pole prep begins"
      },
      {
        "day": "Day 7",
        "date": "Wed Jun 24",
        "v1": "Drills D1–D6 done; D6 24-pack wall-clock logged; portfolio render starts; agent rig (Scout/Dispatcher/Pipeline) live"
      },
      {
        "day": "Day 14",
        "date": "Wed Jul 1",
        "v1": "⭐ GRADUATION (honest baseline) — S0 clears; switch to selling. Top-10 A-tier samples render; DM ignition"
      },
      {
        "day": "Day 30",
        "date": "Fri Jul 17",
        "v1": "First $497 packs landing; first pilots committing → baselines captured FIRST; first retainer quoted live"
      },
      {
        "day": "Day 35",
        "date": "Wed Jul 22 (illustrative)",
        "v1": "★ V1 FIRST CASH BANKED ($3–5K) — THE RATIO-FLIP."
      },
      {
        "day": "Day 45",
        "date": "Sat Aug 1",
        "v1": "1–2 retainers landing; first case-study delta documented; S2 email engine at volume"
      },
      {
        "day": "Day 60",
        "date": "Sun Aug 16",
        "v1": "~$3–5K MRR; 2nd case study forming; pilots converting; capacity guard watch begins"
      },
      {
        "day": "Day 75",
        "date": "Mon Aug 31",
        "v1": "3rd case study landing; outreach flips proof-first; ASP quoted at standard"
      },
      {
        "day": "Day 90",
        "date": "Tue Sep 15",
        "v1": "$6–9K MRR (realistic ~2 brands), 3 case studies, replenishing pipeline, PL 6→8"
      },
      {
        "day": "Day 90+",
        "date": "preview",
        "v1": "S5: lift ASP + hire first Post/Editor VA → path to $15–20K (~Day 150–180)"
      }
    ],
    splitNote: "Adwield is the sole active venture; all focused hours go to it."
  },
  kpis: [
    {
      "n": 1,
      "engine": "V1",
      "indicator": "UGC drill hit-rate (while in P0)",
      "band": "≥80% over last 25; 10-streak building",
      "redFlag": "<60% after ~40 → fix the most-failed rubric point, not volume"
    },
    {
      "n": 2,
      "engine": "V1",
      "indicator": "Priority sample-backed touches out / wk (DM pre-warmup, then email)",
      "band": "150–250/wk post-warmup; 10 priority DMs in ignition week",
      "redFlag": "sends drop → lead list starving (see #4)"
    },
    {
      "n": 3,
      "engine": "V1",
      "indicator": "All-reply rate on ≥200 sends",
      "band": "≥10%",
      "redFlag": "5–9% → hand-rebuild 10 hooks on worst Track; <5% → rebuild 20, stop scaling"
    },
    {
      "n": 4,
      "engine": "V1",
      "indicator": "Unworked qualified-lead count",
      "band": "never <30; replenish +10/wk",
      "redFlag": "<30 → surge +40 THIS week (silent killer)"
    },
    {
      "n": 5,
      "engine": "V1",
      "indicator": "Discovery calls booked / wk",
      "band": "≥2–3 once selling",
      "redFlag": "0 booked with replies coming → tighten the call-booking ask"
    },
    {
      "n": 6,
      "engine": "V1",
      "indicator": "Pilots committed → baselines captured",
      "band": "100% of pilots baselined BEFORE ship",
      "redFlag": "a pilot shipped with no baseline = wasted proof"
    },
    {
      "n": 7,
      "engine": "V1",
      "indicator": "Production hrs/wk vs brands live",
      "band": "< solo-founder ceiling (~2-3 brands)",
      "redFlag": "over ceiling → STOP selling, trigger VA hire"
    },
    {
      "n": 13,
      "engine": "V1",
      "indicator": "Founder focused-hrs/day (7-day avg)",
      "band": "≤8; ≤6 of it \"live-obligation\" (calls/delivery)",
      "redFlag": ">6 live-obligation for 3+ days → FREEZE new V1 selling"
    }
  ],
  frameworks: [
    {
      "name": "Hormozi Value Equation",
      "category": "Offer & Value",
      "summary": "Value = (Dream Outcome x Perceived Likelihood) / (Time Delay x Effort & Sacrifice) - the master scorecard for any offer.",
      "detail": "THE 4 LEVERS (raise the top two, shrink the bottom two):\n1. DREAM OUTCOME (numerator) - how badly they want the result. Maximize by tying the offer to a top-3 existential pain.\n2. PERCEIVED LIKELIHOOD (numerator) - do they believe YOU specifically can deliver it. Raised by proof, risk reversal, specificity, track record.\n3. TIME DELAY (denominator, inverted) - how fast they see a result. Shrink it; show wins on a schedule.\n4. EFFORT & SACRIFICE (denominator, inverted) - how much work/change it costs them. Shrink it, but never lie that it's 'effortless' - that signals you've never been the client.\n\nKEY READ: find your WEAKEST lever and pour 100% of effort there - it throttles the whole equation. A 9x6 numerator (54) is capped by Likelihood, not Dream Outcome.\n\nV1 (AI Ads) SCORE: Dream 9 (win the auction back - capped at 9 honestly because we deliver creative, not the whole account) / Likelihood 6 (the SOLE weak lever - zero case studies at launch, unknown solo operator; raising it 6->8 takes the numerator 54->72, the largest available gain at zero cash) / Time 8 (sample in days, win-signal every 2 weeks) / Effort 8 (low client lift but NOT near-zero: ~2-3 hr intake once + ~30-45 min/cycle approvals). Denominator is essentially solved; 100% of the next 90 days' value gain comes from Likelihood, fixed by manufactured proof, not by talking louder.\n\nWHAT NOT TO DO: don't inflate Dream Outcome by over-claiming whole-account ROAS (breaks guarantee integrity); don't raise price to 'signal quality' (adds friction); don't call the work effortless.",
      "source": "12-offer-locked.md (Element 7) + 25-path-to-20k-model.md"
    },
    {
      "name": "The Value Ladder",
      "category": "Offer & Value",
      "summary": "A sequenced rung-by-rung path from a free trust-purchase up to high-ticket, where each rung earns the right to sell the next.",
      "detail": "CONCEPT: never ask a cold stranger for the big yes. Ladder them up - a free/cheap entry manufactures a paying relationship, proof accrues, then ascend. Each rung has a distinct JOB (reply-getter vs trust-purchase vs core revenue), and pricing reflects the job, not the cost.\n\nV1 (AI Ads) LADDER:\n- Rung 0a: 1 made-for-them sample (their brand) - $0 - the cold-outreach reply-getter.\n- Rung 0b: Founding-partner pilot, 5 videos instrumented for a before/after delta - $0 - earns the account AND manufactures the first case studies.\n- Rung 1: 10-video pack - $497 (PUBLIC price, lead with this) - deliberately under-priced trust-purchase, ~$50/video; its job is to buy a paying relationship cheaply, not to be the margin.\n- Rung 2: Mid retainer (20 videos/mo + bi-weekly call) - $1.5-2.5K/mo - primary conversion target.\n- Rung 3: Standard retainer (+ reporting + live iteration) - $2.5-3.5K/mo - core revenue, where the business lives.\n- Rung 4: Premium (+ media buying) - $5K+/mo - EARNED only after creative wins, never sold cold.\n- Rung 5: Skool community - $97/mo - month-6+ backend.\nMOTION: $0 sample -> $0 pilot -> $497 pack -> 30-40% convert to retainer. The pack is cash (funds runway), the retainer is MRR (where $20K is solved).\nPRICING RULE: never put '$200-500/video value' and '$497 for 10' on the same surface without the trust-purchase framing, or it reads as incoherent. Never discount the retainer to close early - it trains the wrong buyer.",
      "source": "12-offer-locked.md (Element 5/6)"
    },
    {
      "name": "ACP - Audience-Centric Positioning",
      "category": "Positioning",
      "summary": "Build the message around the audience's exact words, archetypes, and proof order rather than around your features.",
      "detail": "THE POSITIONING FORMULA (fill every slot in the buyer's language): FOR [specific who] WHO [the wound they feel] UNLIKE [the alternatives and why each fails] I [the mechanism, winner-framed] BECAUSE [the proof/why-you].\n\nV1 EXAMPLE: For DTC functional-consumables founders at $20-100K/mo spend who watch winning creative tank at the 7-week fatigue wall and got burned by a slow agency, unlike AI tools (a license with no hands), volume agencies (bill you to be slow and brand-blind), or sniper shops (one perfect ad into a flooded auction), I run 4 angles into 24 UGC variations every 2 weeks launched and tagged in your account, because I'm newer than the 10-year agencies so I prove it on your product first and the risk stays on me.\n\nTHREE LAYERS:\n- PLATFORM/AUDIENCE: pick one vertical and one tier the big shops skip ('the mushroom-coffee guy' beats 'an AI ads guy'). Route by archetype: emotional entry = Wounded Veteran (A); the lane you win in = Volume-Player (B); dream client = Solo/Lean Team (C). Never hand a winning skeptic (B) Camp A's grief.\n- CONTENT: lead with the bridge insight both camps already believe (7-week fatigue), demote volume to METHOD ('how the winner gets found faster' - leading with volume pings the slop alarm).\n- FUNNEL / MESSAGE HIERARCHY (say it in THIS order): 1) Show don't tell - a made-for-them sample for priority prospects (precedes all copy). 2) The bridge insight. 3) The mechanism (4x24, winner-framed). 4) Proof-only credibility + de-risk guarantee.\nVOICE: specificity is the brand - always concrete numbers ($20-100K, 24 variations, 7-week, 5-brand cap). $ and % on every claim. Plain declarative sentences. Earned empathy never pity. No emojis, no hype words (revolutionary, game-changing, synergy). Name the limits before they do.\nRULE: never lead with price or the word 'AI'. Never claim an ad track record you don't have.",
      "source": "13-positioning-acp.md"
    },
    {
      "name": "Founder Archetype: The Architect (Operator wing)",
      "category": "Founder",
      "summary": "Chaga builds machines and staffs them one level above the daily operation - the watch-out is building a job instead of a machine.",
      "detail": "PRIMARY: The Architect. SECONDARY: The Operator. Self-described as 'an engineer of the inner workings of a business' - a philosophy, not a brand. Has built $2M/yr once and helped scale $2M/yr again. Thinks in 5-year arcs while executing in 90-day sprints.\n\nDIMENSIONS: Builder 82 (Systems-Led) / Risk 62 (Calculated Bet) / Energy 78 (Marathon) / Leverage 74 (Capital + Network) / Revenue 85 (Recurring Rev). Wing position 65 - under stress shifts to 'The Launcher' (rapid-fire shipping, skips system-building); when thriving becomes 'The Alchemist' (turns churn/leading-indicator data into gold, compounds small ops wins).\n\nSTRENGTHS: systems thinking, lean-team design, compounding infrastructure, hiring for specific leverage points (churn, GTM), automating to protect margin. Best vehicles = recurring revenue (SaaS, productized services, subscription communities) where every ops improvement permanently raises the floor.\n\nBUILDS: lean SaaS/community with high revenue-per-employee; service businesses productized into recurring machines; portfolio plays (build, systemize, sell, repeat); businesses designed from day one to run without the founder in daily ops.\nAVOIDS: pure creator-led businesses where the face IS the brand and can't be delegated; one-time transaction models with no compounding floor.\n\nBLIND SPOTS / WATCH-OUTS:\n- THE BIG ONE - 'Don't build a job, build a machine.' Architects under pressure default to doing everything themselves to hit revenue fast; if you're still running delivery at month 3 you've built a prison. Design the ops layer AND who fills it before you start selling.\n- Validation reflex is healthy but can over-optimize the model before the market has spoken - honor the productization instinct EARLIER (Scenario 4 tension: goes high-touch/manual when cash-tight, but instinct is toward systems).\n- Avoids equity partnerships from past pain (wise), but the right operator-level partner with clear day-one roles could 2x the ceiling.\n\nHOW THIS SHOWS UP IN THE PLAN: Adwield is explicitly engineered to run on agents + a future hire (lift ASP and hire the Post/Editor VA, don't add logos). The business is the 'builds and sells assets' identity, not a job.",
      "source": "IdeaBrowser founder profile (archetype + playbook watch_out)"
    },
    {
      "name": "Proof-Only Credibility System",
      "category": "Positioning",
      "summary": "When you have zero track record, earn trust by demonstration on the prospect's own product - never fabricate, never headline an unrelated business.",
      "detail": "THE ONE RULE: Show, don't tell. Prove, don't claim. Every urge to ASSERT competence ('I understand ad psychology') gets converted into a DEMONSTRATION they can watch or read. A claim from an unknown is worth zero; a 15-second ad of their own product that doesn't look like slop is worth a reply. Newness isn't the weakness to hide - it's the REASON the free sample and the guarantee exist.\n\nTHE TRUST LADDER (ranked by what actually moves a skeptical buyer; build top-down):\n1. The made-for-them sample - one rendered ad of THEIR product before payment. Kills 'is the AI good?' and 'does he know my brand?' at once. It IS the credibility. (~$60/mo tool + 15 min/lead; live day one.)\n2. Hard risk reversal (the guarantee) - risk reversal literally IS perceived likelihood. Currency is labor, so a $500-budget founder can honor it. ($0; immediate.)\n3. Self-made portfolio - rendered samples (prove output) + ad teardowns (prove JUDGMENT - the exact thing a case study would otherwise prove). (1-2 weeks.)\n4. Real data from your own small test - one ad you made AND ran with $50-150 of your own money = a real hold-rate number with your name on it. (~1 week.)\n5. Founding-partner pilots - free instrumented pilots that manufacture your first 3 real case studies. The prize; takes 30-60 days. This is what moves Likelihood 6->8.\n6. Build-in-public track record - a visible 90-day trail that kills the solo counterparty doubt ('will he be here next month?'). Compounds.\n7. Operator-character note (the home-gym business) - used AT MOST ONCE, lightly, as character ('I'm a real operator, not a middleman'), NEVER as ad-proof. Ranked last on purpose.\n\nHARD RULES: zero fabrication ever - no invented metrics, fake logos, 'as seen in', borrowed follower counts. The empty proof inventory stays clean and honest, and that cleanliness is itself a trust signal in a niche flooded with fakery. Never claim it was online/e-commerce/DTC/own-paid-ads. Confident, never apologetic.",
      "source": "27-credibility-and-trust.md"
    },
    {
      "name": "The Two-Clock Model",
      "category": "Execution",
      "summary": "Two clocks run at once - the skill clock you can compress with drilling, and the ~21-day warmup clock you cannot - so DMs are first cash.",
      "detail": "THE STRUCTURAL FACT: the business runs on two clocks that move at different, partly fixed speeds.\n\nCLOCK 1 - THE SKILL CLOCK (compressible): your production skill is the rate-limiter, and deliberate practice compresses it. Drill the Slop Rubric pass-rate up until you clear the Graduation Bar; that's the gate to the first $3-5K. You control this clock - the harder you drill, the sooner it opens.\n\nCLOCK 2 - THE WARMUP CLOCK (~21 days, NOT compressible): cold-email inbox warmup is a hard ~2-3 week lead time before any real send. You cannot rush it. So the first action on Day 0 - before portfolio, before leads - is START WARMUP, because it's the longest-lead-time item.\n\nTHE COLLISION & THE FIX: the '3-week cash sprint' assumed cash by Day 21, but if warmup starts Day 0, priority email sends can't go out at volume until ~Day 14-21, pushing first cash to ~Day 30-40, not Day 21. Re-label honestly: first cash ~Day 30.\nBRIDGE WITH NON-WARMUP CHANNELS: DMs (LinkedIn/X) and warm intros need NO inbox warmup. Run them in weeks 1-3 to produce the first pilots while email warms. DMs from an aged personal account = the first cash path while the email clock ticks.\n\nFUNNEL MATH that hangs off this: ~200-220 priority, sample-backed sends -> ~1 signed retainer pre-proof (compresses to ~120-150 once 3 case studies land). The binding constraint is qualified unique brands + sample-production time, NOT email throughput (inbox capacity is ~10x lead supply).\n\nWHY $20K IS A DAY-150-180 NUMBER: two ceilings fight - a revenue ceiling wanting more clients vs a solo capacity ceiling of 3-4 brands. Honest 90-day target = $6-9K MRR + 3 case studies + a replenishing pipeline; $20K needs high ASP across ~5 brands PLUS a first production hire.",
      "source": "25-path-to-20k-model.md"
    },
    {
      "name": "The 4x24 Framework (V1 method)",
      "category": "Execution",
      "summary": "Every 2-week cycle ships 4 hypothesis angles x 6 variations = 24 ads, launched live, losers killed, winners doubled, before the 7-week fatigue wall.",
      "detail": "THE INSIGHT: measured creative fatigue sets in around WEEK 7, yet brands run 26-week campaigns into audiences disengaged at week 7. A fresh 24-creative batch every 2 weeks means the account is NEVER running fatigued creative - a winner is always being found before the last one dies. Volume is the METHOD (how the winner is found faster), never the hero.\n\nTHE 4 HYPOTHESIS ANGLES (test all 4 EVERY cycle - dropping one blinds the test):\n1. PAS (Problem-Agitate-Solve) - lead with the visceral symptom; best for low-mid AOV + acute single-symptom avatar; highest-EV opener for a cold account.\n2. Founder/Origin - trust transfers person-to-product; best for mid-high AOV + skeptical/been-burned avatar; builds brand equity.\n3. Mechanism/Ingredient - why it works at the ingredient level; scales with AOV + research-y optimizer avatar; must be wrapped in a curiosity hook or it dies.\n4. Social-Proof/Transformation - show the after; the universal closer + best retargeting + best scale-up angle.\n\nTHE VARIATION MATRIX (4 angles -> 24): each angle becomes 6 variations by moving ONE primary lever per variation so the read is clean. Levers: A) Hook line, B) Opening-3s visual, C) Format (TH/VO/LF/SS/GS), D) Runtime (15s/30s), E) CTA style (SHOP/SOFT/OFFER/URG). The 6-cell grid = 4 format-sweep cells + 2 hook/CTA-sweep cells. 6 keeps each micro-test statistically legible at a real 2-week ingestibles budget.\n\nTHE 2-WEEK LOOP: D0 lock the grid -> D1-3 produce + compliance pass -> D4 launch all 24 -> D5-7 learning phase, hands off -> D8 first read + kills (thumb-stop/hold) -> D10 scale decision (CTR/CPA) -> D11-13 scale winners, draft next cycle from survivors -> D14 retro + log. Expect ~2-5 scalers out of 24.\nKILL/SCALE gates (after clearing a ~$20-30 / ~2,000-impression spend gate): thumb-stop <25% = hook failed; hold <20% = format wrong; CTR <0.8% = CTA mismatch. Scale in <=20-30% daily steps.\n\nTHE MOAT: not the name ('test 4 angles, iterate' is what good operators do). The moat is WHO picks the angles (operator judgment), the $200-500 all-in economics that make 24 affordable, the production-and-launch labor a 2-person team lacks, and the cross-cycle results sheet (BRAND_ANGLE_HOOK_FORMAT_LEN_vNN) that compounds into a defensible pattern library.",
      "source": "4x24-framework-spec.md + 12-offer-locked.md (Element 5)"
    },
    {
      "name": "The Slop Rubric + Graduation Bar",
      "category": "Execution",
      "summary": "An 8-point all-or-nothing QC card scored on every render, plus a hard gate (10 straight 8/8) that says you may now charge real money.",
      "detail": "THE SLOP RUBRIC - 8 binary checks, scored on EVERY render before you watch the next one (unscored practice is just scrolling). A render PASSES only if all 8 pass; one FAIL = the whole render fails (a single melted hand tanks the trust). Log results as '1P 2P 3F ...' so the check that fails most becomes your next deliberate-practice target.\n1. Character consistency (same person across the set) - the #1 'this is AI' tell; fix by TAGGING the published reference, not re-describing.\n2. Product/label fidelity (wordmark + every line legible, no warped/recolored type) - re-embed the product at generation time.\n3. Hands & face artifacts (5 fingers, natural gaze, no waxy skin) - re-roll the seed, simplify the hand action.\n4. Lighting/realism (phone-shot real moment, not CGI sheen) - add handheld/natural-light negatives.\n5. Hook in first 3s, works on MUTE (first frame IS the hook).\n6. Lipsync locks, especially on the hook line - #1 cause of failure is a script too long for the runtime; trim, never speed the render.\n7. Pacing matches runtime (not crammed/robotic) - trim the script, don't compress the voice.\n8. FTC-safe claim (honest experiential framing; no disease/cure/'clinically proven', no fabricated authority) - the boundary that separates you from the slop you sell against; NON-NEGOTIABLE.\n\nDISCARD DISCIPLINE: any FAIL on 1, 2, 3, or 6 = discard immediately (generation-level failure, don't polish). 3-strike rule: same point fails 3x in a row = the PROMPT is broken, not the seed - rewrite it. A bad render found later costs 3x; killing it now IS the fast path.\n\nTHE GRADUATION BAR (all 5 must be true, evidence in the practice log - this is the gate to the first $3-5K):\n1. 10 consecutive renders at full 8/8 (10 not 5, because a paid cycle is 24 and you can't surface a melted hand to a paying brand).\n2. The made-for-them speed bar: a never-seen product image -> rubric-passing 15s sample in UNDER 20 MIN, on 3 consecutive cold products (this IS the cold-email/sample motion; if you can't hit it the funnel starves).\n3. One complete 24/24-passing pack exists, wall-clock time logged (your real cycle-time for pricing/capacity).\n4. Hit-rate >=80% across the most recent 25 renders (baseline reliability, not a lucky streak).\n5. Self-judgment calibrated (you 'feel' the slop before re-watching) + zero FTC failures.\nDRILL LADDER: 8 drills D1->D8, easiest to hardest, each adds one new skill with a binary pass bar and a streak-to-advance, practiced ONLY on the 3 fictional sample brands (real prospects only ever see graduated work).",
      "source": "30-get-good-fast-practice-plan.md"
    },
    {
      "name": "IdeaBrowser Scoring System",
      "category": "Scoring",
      "summary": "Four /10 dials read as a SET. The native IdeaBrowser model is Opportunity, Pain, Builder Confidence (Fit), and Timing (all higher-is-better). This dashboard re-frames the 4th dial as Execution Difficulty (lower-is-better) so a high score flags a slog, not a tailwind.",
      "detail": "SOURCE NOTE (read first): the native IdeaBrowser model's four dials are OPPORTUNITY, PAIN, BUILDER CONFIDENCE, and TIMING - all higher-is-better. This dashboard keeps the first three as-is but deliberately INVERTS and re-labels the 4th dial as EXECUTION DIFFICULTY (lower-is-better), because Chaga's own red-flags (technical complexity, regulatory risk, high competition, long sales cycles) are easier to steer by as a COST to minimize than as a 'timing' tailwind to maximize. So the number you see on the V1 card under Execution Difficulty is this dashboard's re-framing, not a raw IB Timing readout - read it as 'how hard/risky is this to ship', where LOWER is the good direction.\n\nHOW TO READ THE FOUR DIALS (they are not interchangeable - read them as a set):\n\n1. OPPORTUNITY (higher is better) - the size and timing of the prize: market size, momentum/trend tailwind, willingness-to-pay, headroom. A high score means the money is genuinely there to be made if you execute. Answers 'is this worth doing at all?'\n\n2. PAIN (higher is better) - how acute and urgent the problem is for the buyer. High pain = people are already bleeding and actively seeking a fix, so the sale is 'painkiller, not vitamin'. This is the single best predictor of whether cold outreach converts. (V1's whole wedge rests on a 9/10 pain - the 7-week fatigue.)\n\n3. BUILDER CONFIDENCE / FIT (higher is better) - how well the idea matches THIS founder's specific skills, assets, budget, and archetype. A great market with low fit is somebody else's idea. For Chaga, fit is highest on recurring-revenue, systematizable, productized-service plays (Architect) and lowest on creator-led, face-is-the-brand models. (Capped at 8 per the source pile - founder-assigned confidence, research still pending on V1.)\n\n4. EXECUTION DIFFICULTY (LOWER is better - it's a cost, not a prize; this is the inverted re-frame of the native IB Timing dial) - how hard/risky/slow it is to actually ship: technical complexity, regulatory risk, integration burden, sales-cycle length, capital needed. Chaga's red flags map straight onto this dial, so an idea that scores high here is fighting his archetype.\n\nHOW TO COMBINE THEM: you want HIGH Opportunity + HIGH Pain + HIGH Fit + LOW Difficulty. A high Opportunity with low Pain = a market nobody's desperate to buy from. High Pain + high Difficulty = real but a slog. The four together answer 'is this the right idea, for the right person, at the right time, at a cost I can pay?' - not just 'is this a good idea in the abstract.' Use the dials to KILL fast (the 90-day clock is tight) and to pick the right horse before the clock starts, not to rank ideas by a single blended number.",
      "source": "IdeaBrowser scoring model (native 4th dial = Timing; re-framed here as Execution Difficulty) + founder profile red flags"
    },
    {
      "name": "Funnel Math (rule-of-thumb)",
      "category": "Execution",
      "summary": "About 200 priority, sample-backed sends convert to ~1 signed retainer before proof exists - and the conversion bands tell you where the funnel breaks.",
      "detail": "THE CHAIN, solved backward for ONE net-new retainer (plan-with figures; these are ASSUMPTIONS to falsify against real data, not promises):\n1 retainer / 0.30 (pilot or pack -> retainer) = 3.3 pilots/packs / 0.45 (call -> pilot/pack) = 7.4 qualified calls / 0.35 (positive reply -> call) = ~21 positive replies / 0.10 (send -> reply) = ~210 priority sends.\n\nRULE OF THUMB TO CARRY: ~200-220 priority, sample-backed sends -> ~1 signed retainer at launch (no case studies). After 3 case studies land, this COMPRESSES toward ~120-150 sends/retainer.\n\nTHE CONVERSION BANDS (and why each is conservative-honest):\n- Reply rate 8-15%, plan 10% - sample-led + a true hand-written hook beats generic cold email's 1-3%; but zero proof caps the ceiling. Generic/non-priority sends would be 2-4% (NOT this motion).\n- Positive reply -> call 30-40%, plan 35% - many replies are 'nice, not now'; the sample converts curiosity, the call converts intent.\n- Call -> free pilot or $497 pack 40-55%, plan 45% - low-friction; the pack is an impulse-yes at <2.5% of monthly spend.\n- Pilot/pack -> retainer 25-40%, plan 30% - the floor until case studies exist; drifts to the 40% ceiling after.\nRE-BASELINE after the first 200 sends - do not trust the table over real data.\n\nKILL/FIX READS (which band failing means what):\n- Reply <5% over 200 sends = the HOOK or SAMPLE quality is the problem, not volume - stop scaling, hand-rebuild 20 hooks, re-test. Never pour volume on a broken message.\n- Replies healthy but call-book <20% = the reply->call CTA or offer framing is off - tighten the cycle/head-to-head ask, not the cold open.\n- Calls healthy but pilot->retainer <15% on >=4 pilots = the PROOF GAP is binding - the cure is shipping case studies, not changing the pitch (this is expected pre-Day-60).\n\nTHE BINDING CONSTRAINT: qualified UNIQUE brands + sample-production time, NOT email throughput (inbox capacity ~210/day is ~10x lead supply). The lead list must be replenished +40-50 qualified brands/month or the funnel starves by ~Day 45.",
      "source": "25-path-to-20k-model.md (sec 2 + 4)"
    },
    {
      "name": "The Capacity Ceiling principle",
      "category": "Operating",
      "summary": "A solo operator can run only 3-4 brands at quality - so lift average price per client, not logo count, and hire only to raise the ceiling.",
      "detail": "THE STRUCTURAL FACT: the business has two ceilings that fight each other - a revenue ceiling that wants more clients ($20K/mo) and a capacity ceiling that caps clients at 3-4 before quality slips. They collide: you cannot solo your way to $20K. A steady-state 24-pack is ~9-9.5 hrs; at 3 brands that's ~28 hrs/2wk of pure production (sustainable solo), at 4 brands ~38 hrs/2wk production alone (quality slips). The published hard cap is 5 brands.\n\nTHE THREE MOVES (in priority order):\n1. LIFT ASP, DON'T ADD LOGOS - 3 standard + 2 premium ($19K across 5 brands) beats 8 mid-tier brands you can't service. Quote standard/premium once case studies justify it; NEVER discount the retainer to close early (it trains the wrong buyer and erodes the margin the business runs on).\n2. HIRE TO LIFT THE CEILING - the Post/Editor VA is the first hire (frees ~3 hrs/pack, the single highest-leverage move). Fund it from the first 2-3 retainers (~Day 60-90). Hard rule: do NOT sign brand #4 to a retainer until that VA is hired and trained.\n3. RESET THE DATE & TREAT THE CAP AS A FEATURE - $20K is a ~Day 150-180 number (4-5 retainers, ASP lifted, +1 VA), not a 90-day one. The honest 90-day target is $6-9K MRR. The 5-brand cap is a feature (premium SLA, real scarcity), not a revenue cage.\n\nTHE SCAR IT PROTECTS: signing past capacity to chase revenue RECREATES the deprioritized-account betrayal the whole offer is built to never become. The cap is also the answer to the agency-betrayal scar ('you can't be the deprioritized account on a list of 5 with a published ceiling').\nGENERAL ARCHETYPE TIE-IN: this is the Architect's 'build a machine, not a job' made operational - the constraint is the founder's hours, so design the ops layer + who fills it before scaling, and offload everything offloadable to agents/VAs.",
      "source": "25-path-to-20k-model.md (sec 0/1/3 + Risk 3)"
    },
    {
      "name": "The Guarantee as Risk Reversal",
      "category": "Offer & Value",
      "summary": "Load the downside onto yourself on a metric you actually control, in labor currency, so a cash-tight founder can always honor it.",
      "detail": "THE PRINCIPLE: risk reversal literally IS perceived likelihood. A stranger who puts the downside on himself reads as credible. The art is choosing WHAT to guarantee and in WHAT currency so it's both believable to the buyer and survivable for you.\n\nV1 LOCKED GUARANTEE: 'Within 30 days my creative beats your current best ad on hook-rate/hold-rate AND your CPA holds flat or better - measured against your own control, in your own account, with the head-to-head data on the table. If it doesn't, your next 24-variation cycle is free. Month-to-month, cancel anytime, keep every video either way.'\n\nWHY EACH CLAUSE IS BUILT THE WAY IT IS:\n- METRIC YOU CONTROL: hook-rate/hold-rate is creative-controllable (you actually own it) AND correlates downstream - unlike whole-account ROAS (outside your control) or raw CTR (gameable by clickbait, the vanity trap).\n- 'CPA HOLDS FLAT' ties the promise to the metric the buyer actually fears, neutralizing 'high-CTR creative that bled cash'.\n- DATA ON THE TABLE converts 'easy metric' suspicion into trust.\n- LABOR CURRENCY (next cycle free), NOT cash: a money-back/ROAS-refund guarantee introduces downside a $500-budget solo can't absorb and would make him sell less hard. Labor is the right currency - he can always honor it and it costs no cash. (But factor it into CAPACITY: a guaranteed re-do is ~9.5 unpaid hrs = effectively a 4th half-brand.)\n- MONTH-TO-MONTH + CANCEL-ANYTIME + KEEP-THE-VIDEOS kills the counterparty doubt ('will this guy be here next month?') that caps a solo's Likelihood at 6.\n\nWHAT NOT TO DO: no cash-refund guarantee (labor currency only); don't guarantee a metric you don't control; don't pick a metric because it's easy to win.",
      "source": "12-offer-locked.md (The Guarantee) + 27-credibility-and-trust.md"
    },
    {
      "name": "Leading Indicators over Vanity Metrics",
      "category": "Operating",
      "summary": "Steer daily by the upstream numbers that predict the win, not the lagging vanity metrics that only confirm it after the fact.",
      "detail": "THE PRINCIPLE: a leading indicator MOVES BEFORE the outcome and is something you can act on this week; a lagging/vanity metric only tells you what already happened. Pick a small set of leading indicators, watch them weekly, and let them drive kill/scale decisions - revenue alone is too slow and too lagging to steer by.\n\nV1 LEADING INDICATORS (and the vanity trap each replaces):\n- Priority sample-backed sends/week (band 150-250) - the true throughput input; replaces 'emails sent' (counts non-priority filler).\n- Reply rate, priority only (>=8%) - earliest signal the hook+sample land; replaces 'open rate' (tracking is OFF by design; opens are noise).\n- Sample-link click rate (>=30% of opens) - did the sample get watched, the credibility moment; replaces 'impressions'.\n- Positive-reply -> call booked (>=30%) - intent not curiosity; replaces 'total replies'.\n- Baselines captured / pilots started (100%) - manufactures the proof asset; replaces 'videos made'.\n- Documented case-study deltas (3 by Day 60) - the ONE lever moving Likelihood 6->8; replaces 'testimonials without numbers'.\n- Lead-list replenishment rate (>=40/mo) - the binding constraint; replaces 'size of total list'.\n- Production hrs/week vs brands live - early warning on the capacity ceiling; replaces 'revenue alone'.\n\nTHE META-METRIC (read first): FOUNDER HOURS per day - it must stay under a sustainable ~8 focused hrs/day. It's the single number that decides feasibility of the whole operation; every other indicator is downstream of not blowing this one.\nWHY IT MATTERS: vanity metrics feel like progress but don't predict cash. Steering by leading indicators is how the Architect 'turns data into gold' (the thriving Alchemist mode) instead of shipping blind under pressure (the stressed Launcher mode).",
      "source": "25-path-to-20k-model.md (sec 4)"
    }
  ]
};
