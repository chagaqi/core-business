import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PaperStrata } from "@/components/marketing/paper/PaperStrata";
import { PaperEdge } from "@/components/marketing/paper/PaperEdge";
import { EmailCapture } from "@/components/vsl/EmailCapture";

/**
 * /templates — the ungated Fulfillment Update Template Library. Two jobs at once
 * (GTM plan sec 9.2): it's the flagship SEO pillar for "kickstarter fulfillment
 * delay update template" and its satellites (the head terms are dead; the
 * already-late-campaign wedge is open), AND it's the public destination the X
 * pinned post + bio link to. Full value, no gate — the whole point is that it
 * ranks and gets read. The email capture (existing /api/playbook-lead funnel,
 * source="/templates") is the second delivery block for the formatted pack +
 * nurture, never a wall in front of the value.
 *
 * Proof-only: every template models the product's own doctrine — ETA as a band
 * never a hard date, never a fabricated tracking number, acknowledge the wait
 * first, the day-20 answer isn't the day-80 answer. Public page, no auth.
 */
export const metadata: Metadata = {
  title: "Fulfillment Update Templates for Preorder & Crowdfunding Delays — Tideover",
  description:
    "17 paste-ready templates for updating backers through a 60–120 day wait: delay announcements, missed-date notices, refund and chargeback replies, proof-of-life updates. Free, from an operator who ran the inbox.",
  alternates: { canonical: "/templates" },
};

const TEMPLATE_CTA_POINTS: readonly string[] = [
  "17 paste-ready templates, free",
  "No hard dates, no fake tracking numbers",
  "Or a free 15-min teardown on your real tickets",
];

type Template = { n: number; title: string; core?: boolean; situation: string; body: string; why: string };
type Group = { key: string; heading: string; blurb: string; templates: Template[] };

const GROUPS: readonly Group[] = [
  {
    key: "timing",
    heading: "As the wait lengthens",
    blurb: "The wording that calms someone at day 20 reads as a brush-off at day 80. These four track the same order as the wait stretches.",
    templates: [
      {
        n: 1,
        title: "Early check-in (roughly day 5–15)",
        core: true,
        situation: "The backer is curious, not worried yet. You're setting the relationship: I come to you before you have to come to me.",
        body: `Hi [firstName] — thanks for backing [product]. Totally fair to want to know where things stand this early.

Right now [what's actually happening, e.g. "components are being sourced"]. The current window for delivery is [ETA band, e.g. "around 10–12 weeks out"], and I'll message you the moment that moves.

Nothing you need to do. I've got it from here.`,
        why: "Early on, a specific stage is doing the reassurance, not an adjective. Give them a real thing and a real band, and the promise to come to them first.",
      },
      {
        n: 2,
        title: "The one-month update (roughly day 30)",
        situation: "Month one is where the first doubt shows up. Prove you're tracking their specific order, not sending a blast.",
        body: `Hi [firstName] — a month in, and I want you to have a real update, not a form reply.

Where it actually is: [current stage]. Current window is [ETA band]. If anything changes, you'll hear it from me first, not from a shipping notification that never comes.

Appreciate you sticking with it.`,
        why: `"You'll hear it from me first" is a promise you can actually keep. Making it, and keeping it, is what dries up the twice-a-day check-ins.`,
      },
      {
        n: 3,
        title: "The two-month check-in (roughly day 60)",
        situation: "Patience is a resource you're spending down. Hand some control back.",
        body: `Totally fair to feel the wait at the two-month mark, [firstName]. You've been patient and I don't take it for granted.

Here's where things stand: [current stage]. Window from here is [ETA band]. The moment there's tracking to send, it's yours.

One thing I can do now: flag your order for priority dispatch when the batch lands, so you're in the first wave out. Want me to?`,
        why: "The priority-dispatch offer costs almost nothing and gives them a small yes. A backer who's been given a small yes is far less likely to open a dispute.",
      },
      {
        n: 4,
        title: "The long wait, straight (roughly day 89 and past)",
        core: true,
        situation: "This is the email that decides whether you get a chargeback. Drop the reassurance voice and be a person who's accountable.",
        body: `[firstName] — you've waited longer than anyone should have to for this, and I'm not going to hand you a canned line.

Where it actually stands: [current stage, or "I'm getting the current status from the factory and will have it to you by [day]" if you genuinely don't know]. As straight as I can put the timing: [ETA band].

I'm not going to invent a tracking number I don't have. I'd rather sort this out with you directly than have it go to your card issuer. I'm on it personally, and you can reply straight to me.`,
        why: "Offering the direct line before they think of their bank is the whole play. Note what it never does: promise a date, or claim a status you can't confirm.",
      },
    ],
  },
  {
    key: "events",
    heading: "When something changes",
    blurb: "A slip, a missed date, a quiet stretch. The move is always to break the silence yourself, before they fill it with the worst assumption.",
    templates: [
      {
        n: 5,
        title: "Delay announcement (proactive, before a date slips)",
        core: true,
        situation: "Announcing a slip before the date passes is the single highest-trust move in fulfillment, and almost nobody does it.",
        body: `Hi [firstName] — straight up: [product] is running behind the window I gave you. I'd rather tell you now than let the old date pass in silence.

What happened: [one honest sentence, e.g. "the factory's QC caught a defect in the first run and we're re-doing it rather than ship you a unit that fails"]. What it means for you: the new window is [ETA band].

I know a delay isn't what you wanted to read. If you'd rather not wait, reply and we'll talk through your options. Otherwise I'll have the next update to you by [day, an update date, not a delivery date].`,
        why: "The reason is one honest sentence, and QC-caught-a-defect makes you look better, not worse. Always pair bad news with a next-update date you control.",
      },
      {
        n: 6,
        title: "Missed estimated delivery date",
        situation: "You've already missed once, so your credibility on dates is spent. Stop trading in dates. Start trading in update-commitments.",
        body: `[firstName] — the delivery estimate I gave you was [timeframe], and that's passed. That's on me to address, not on you to chase.

Current status: [stage]. Honest revised window: [ETA band]. I'm not going to give you another date I'm not sure of, so I'll come back to you [day] with the next real update regardless of whether it's moved.`,
        why: `"Regardless of whether it's moved" removes their reason to sit and refresh their inbox.`,
      },
      {
        n: 7,
        title: "Proof-of-life update (keep a quiet backer warm)",
        situation: "The wound in a long wait is silence, not the wait. Send these unprompted.",
        body: `Hi [firstName] — no action needed, just proof it's real and moving.

[One concrete thing, e.g. "the first production photos came in this week" or "your batch cleared customs Tuesday"]. Still on track for the [ETA band] window.

More when there's more. Thanks for the patience.`,
        why: "A ten-second update with one concrete detail resets the anxiety clock. It's the cheapest chargeback insurance you have.",
      },
      {
        n: 8,
        title: "Gone-quiet re-engagement",
        situation: "A backer stopped replying, or you went dark. Silence gets filled with 'I've been scammed.' Break it yourself, and name it.",
        body: `[firstName] — it's been a while since I've had something worth sending, and I don't want the quiet to read as gone.

Where [product] actually is: [stage]. Window from here: [ETA band]. Still very much happening, still yours, and I'll be back with the next update by [day].

If anything's changed on your end, just reply.`,
        why: "Naming the silence defuses the worst assumption before it hardens into a dispute or a public post.",
      },
    ],
  },
  {
    key: "severity",
    heading: "When they're upset",
    blurb: "A refund ask, a chargeback threat, an angry comment. Each is a test of whether you're a person or a wall.",
    templates: [
      {
        n: 9,
        title: "Refund request",
        core: true,
        situation: "If you refund, do it fast and clean. If you can't, never hide behind the policy: state it plainly, then offer the real thing you can do.",
        body: `Hi [firstName] — I hear you, and asking for a refund after this wait is completely reasonable.

[If you offer refunds: "I can process that. Give me [timeframe] and it's back on your original payment method, no hassle."]

[If you don't, and said so upfront: "Here's where I'm at, straight: [product] is [stage] and the window from here is [ETA band]. Our terms are no refunds once production's committed, which I know isn't what you want to hear. What I can do is [real alternative, e.g. priority dispatch / a goodwill add-on / hold it for a friend]. If the wait's the problem, tell me and I'll do what I actually can."]

Either way, you'll get a real answer from me, not a runaround.`,
        why: "The backer who gets a straight no plus a genuine alternative disputes far less than the one who gets a warm non-answer.",
      },
      {
        n: 10,
        title: "Chargeback threat (the 11pm email)",
        core: true,
        situation: "A chargeback threat is usually a plea for a human, not a decision. Beat the bank to it by being faster and more personal than a dispute.",
        body: `[firstName] — I get it, and before you go to your card issuer, give me one shot to sort this directly, because I can actually move faster than a dispute can.

Where your order really is: [stage]. Straightest timing I have: [ETA band]. If that's not good enough, tell me what would make this right and I'll tell you honestly whether I can do it.

Reply straight to me. I'm a person, not a ticket queue, and I'd rather fix this than fight it.`,
        why: "Never argue the wait. Ask what would make it right — half the time the answer is smaller than you feared.",
      },
      {
        n: 11,
        title: "Angry public comment or DM",
        situation: "In public you acknowledge and move it private in two sentences. The goal isn't to win the thread. It's to be visibly reasonable to the people watching.",
        body: `[firstName] — you're right to be frustrated, and I'm not going to get defensive about it in the comments.

I just sent you a DM with exactly where your order stands and what I can do about it. Let's sort it there. Whatever's fair, I want to get you to it.`,
        why: "No explaining, no excuses where other backers are reading. Do the real work in the DM.",
      },
      {
        n: 12,
        title: `"Is this a scam?" (trust has collapsed)`,
        situation: "You can't argue someone out of 'this is a scam.' You can only show a real photo of a real thing and a real person's name.",
        body: `[firstName] — fair question, and I'd rather answer it than be offended by it.

I'm [name], I ran [real credibility, e.g. "fulfillment for a physical-goods brand for years before this"], and [product] is real and [stage]. Here's a photo of where it actually is: [attach]. Window from here is [ETA band].

I know words are cheap this far in. Reply and I'll get you whatever proof you need.`,
        why: "Offense reads as guilt. Proof and a name read as a founder who's still here.",
      },
    ],
  },
  {
    key: "special",
    heading: "Special situations",
    blurb: "The tickets that aren't about the wait at all. Match the energy of the actual request.",
    templates: [
      {
        n: 13,
        title: "Address or detail change (a calm, logistical ask)",
        core: true,
        situation: "The one most people get wrong: an address change is a happy ticket. Answering it with wait-anxiety language is bizarre and alarming.",
        body: `Hi [firstName] — got it, I've updated your shipping address to [new address]. It'll go out to the new one.

No impact on your timing. Current window is still [ETA band]. Anything else, just say.`,
        why: "A logistical question gets a logistical answer. Match the energy of what they actually asked.",
      },
      {
        n: 14,
        title: "Partial or split shipment",
        situation: "Splits confuse people and confusion breeds tickets. Name both parts, both reasons, both windows, in one message.",
        body: `Hi [firstName] — heads up, your order's shipping in two parts. [Item A] goes out now, [item B] follows once [reason, e.g. "the second colorway clears production"] in roughly [ETA band].

You'll get tracking for the first part [when]. I'll flag the second the moment it moves.`,
        why: "One clear message stops them wondering why half their order arrived.",
      },
      {
        n: 15,
        title: "Backer wants to cancel (changed their mind, not angry)",
        situation: "A calm cancel is not a dispute. Make it easy, thank them, leave the door open.",
        body: `Hi [firstName] — no problem at all, and no hard feelings. [If you can cancel: "I've cancelled it and [refund detail]." If it's too far in: "It's already [stage], so I can't pull it back, but here's what I can do: [real option]."]

Thanks for giving it a shot. If your timing changes down the line, you know where to find me.`,
        why: "Fighting a friendly cancel is how you turn it into an angry one.",
      },
      {
        n: 16,
        title: `"Where's my tracking?" (and there isn't one yet)`,
        situation: "People ask for tracking because they want proof of motion. Give them the real proof, the current stage, instead of a fake number.",
        body: `Hi [firstName] — no tracking number yet, and I won't send you a fake one to buy time.

The reason there's no tracking is that it hasn't shipped, and it hasn't shipped because [stage]. The moment a real number exists, it lands in your inbox automatically. Current window: [ETA band].`,
        why: `A fake "label created" page that never updates makes it worse. The honest version wins.`,
      },
      {
        n: 17,
        title: "Post-delivery, close the loop",
        situation: "The wait ends but the relationship doesn't have to. This is where a delayed order turns into a repeat customer.",
        body: `[firstName] — it's there. Thank you for the patience that got it to you, genuinely. That wait was longer than I wanted for you.

If anything's not right with it, reply and I'll make it right. And if it is right, I'd love to know what you think of it.

[Optional goodwill: "There's a [small perk, e.g. discount code / digital extra] on your account as a thank-you for waiting."]`,
        why: "The backer who waited 100 days and got a human thank-you at the end is your next campaign's first backer.",
      },
    ],
  },
];

const RULES: readonly { t: string; d: string }[] = [
  { t: "Acknowledge the wait before you explain it.", d: "The backer already knows it's late. Leading with the reason reads as a defense. Leading with 'I see it' reads as a person." },
  { t: "Give an ETA as a band, never a hard date.", d: "'The next few weeks' survives a slip. 'March 14th' becomes the screenshot in a chargeback." },
  { t: "Never claim what you can't prove.", d: "No tracking number until one exists. No 'on schedule' when you don't control the schedule. One invented fact, caught once, and every future update reads as spin." },
  { t: "The day-20 answer isn't the day-80 answer.", d: "The wording that calms someone early reads as a brush-off late. Early: reassure. Late: level with them." },
];

export default function TemplatesPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero — the promise + the credibility, before the templates. */}
        <section className="section relative overflow-hidden !pb-10">
          <PaperStrata />
          <div className="wrap relative z-10 max-w-[820px]">
            <span className="kicker mb-3.5">Free template library</span>
            <h1 className="mb-5 text-balance">Fulfillment update templates for the wait between funded and delivered.</h1>
            <p className="m-0 max-w-[680px] text-[17px] leading-relaxed text-slate">
              17 paste-ready messages for the 60&ndash;120 days a backer waits. Written by someone who ran fulfillment
              and the where&rsquo;s-my-order inbox for a physical-goods brand through two years of it. No hard dates, no
              invented tracking numbers, nothing you can&rsquo;t stand behind when it slips.
            </p>
          </div>
        </section>

        {/* The four rules — the doctrine that runs through every template. */}
        <section className="pb-14">
          <div className="wrap max-w-[860px]">
            <Reveal index={0}>
              <div className="mb-7">
                <span className="kicker mb-3.5">The four rules</span>
                <h2 className="m-0">Throw out the wording, keep these.</h2>
              </div>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2">
              {RULES.map((r, i) => (
                <Reveal key={r.t} index={i}>
                  <div className="panel h-full p-6">
                    <h3 className="mb-2 font-serif text-[17px] font-semibold text-teal">{r.t}</h3>
                    <p className="m-0 text-[14.5px] leading-relaxed text-slate">{r.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* The library — every template, ungated. This is the SEO body. */}
        {GROUPS.map((group) => (
          <section key={group.key} className="section scroll-mt-20 !pt-4 !pb-8">
            <div className="wrap max-w-[860px]">
              <Reveal index={0}>
                <div className="mb-7">
                  <h2 className="mb-3 font-serif text-[26px] font-semibold text-ink">{group.heading}</h2>
                  <p className="m-0 max-w-[680px] text-[15.5px] leading-relaxed text-slate">{group.blurb}</p>
                </div>
              </Reveal>
              <div className="flex flex-col gap-6">
                {group.templates.map((tpl) => (
                  <Reveal key={tpl.n} index={0}>
                    <article className="panel p-7">
                      <div className="mb-3 flex items-baseline gap-3">
                        <span className="flex-none font-serif text-[15px] font-semibold text-terracotta">
                          {String(tpl.n).padStart(2, "0")}
                        </span>
                        <h3 className="m-0 font-serif text-[19px] font-semibold text-teal">
                          {tpl.title}
                          {tpl.core ? (
                            <span className="ml-2 align-middle text-[12px] font-medium uppercase tracking-wide text-terracotta">
                              core pack
                            </span>
                          ) : null}
                        </h3>
                      </div>
                      <p className="mb-4 text-[14.5px] italic leading-relaxed text-slate">{tpl.situation}</p>
                      <pre className="mb-4 whitespace-pre-wrap rounded-[10px] border border-border bg-paper px-5 py-4 font-sans text-[14.5px] leading-[1.7] text-ink">
                        {tpl.body}
                      </pre>
                      <p className="m-0 text-[14px] leading-relaxed text-slate">
                        <span className="font-semibold text-ink">Why: </span>
                        {tpl.why}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ))}

        <PaperEdge variant="wave" color="teal" />

        {/* Dark block — what does this for you (the product), + the capture. */}
        <section className="section section-dark scroll-mt-20">
          <div className="wrap max-w-[820px]">
            <Reveal index={0}>
              <span className="kicker mb-3.5">Do it once, or run it forever</span>
              <h2 className="mb-4">This pack, running itself, on every ticket.</h2>
              <p className="mb-8 max-w-[680px] text-[16px] leading-relaxed opacity-90">
                Reading where each backer is in the wait, and how upset they are, and answering that instead of a
                generic script, is a second job across a few hundred backers. Across a few thousand it&rsquo;s
                impossible. That&rsquo;s the gap Tideover closes: it reads each order&rsquo;s real stage and the
                customer&rsquo;s tone, drafts the right message from this exact playbook, flags who&rsquo;s about to
                bail so you answer them first, and never lets a hard date or a fake tracking number reach a customer.
                You approve and send.
              </p>
            </Reveal>
            <Reveal index={1}>
              <EmailCapture
                heading="Want the formatted pack + the day-by-day map?"
                blurb="Everything here, formatted to keep, plus the day-7 / 30 / 60 / 89 outreach schedule. Drop your email and we'll send it over. A real person sends these, so give it a little time."
                cta="Send me the pack"
              />
            </Reveal>
          </div>
        </section>

        <PaperEdge variant="wave" color="teal" />
        <FinalCTA points={TEMPLATE_CTA_POINTS} />
      </main>
      <Footer />
    </>
  );
}
