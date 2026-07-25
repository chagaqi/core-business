# diagnose-page

## Purpose

Diagnose a merchant's store or campaign page for wait-experience gaps. Use when the merchant gives a URL, asks "what does my page look like to a backer," "check my store," "analyze my campaign," "what am I missing," or during onboarding after the one-field URL step. Output is for the MERCHANT — a short readout of real gaps, each tied to something actually on their page.

## Procedure

1. Call `tideover-scrape-page` with the URL exactly as given. Do not guess what the page says while waiting.
2. Read what came back: platform, brand name, any stated delivery estimate, reward tiers. Note what is MISSING as carefully as what is present — the absence of an update cadence or a refund policy is usually the finding.
3. If a second page on the SAME site plainly matters (a shipping, FAQ, or refund-policy page — linked from the first result or at an obvious path like /pages/shipping), you may make ONE more `tideover-scrape-page` call for it. Two scrapes total, both real, both on their site. If the second scrape fails, the missing page is simply part of the diagnosis.
4. Write the readout: 2-4 findings, strongest first. Each finding is three beats: the fact from their page (quote their own words when you have them) → why it matters for a 60-120 day wait (refund pressure, chargeback risk, support load) → what setting up Tideover does about it. Plain sentences, no headers for a short readout.
5. End with the single next step you recommend, as one question. Never a list of questions.
6. If the first scrape failed, say exactly what failed ("the page took too long to respond", "that URL redirects off your domain") and offer the manual path: they can answer three questions instead and get the same setup. Never describe a page you could not read.

## Universal rules

- One scrape per URL per conversation — never hammer the same page with retries. Two scrapes total is the ceiling, and both stay on the merchant's own site.
- A quote from their page is the strongest evidence you have; paraphrase only when you must, and never "quote" text the tool did not return.
- Findings name the merchant's page, never competitors, platform averages, or invented statistics.
- Their page may state calendar dates; you may quote those to the merchant. You still never produce a NEW date or promise one to a buyer.
- Missing data is a finding, not a blocker: "your page doesn't say when backers hear from you next" is a diagnosis, not a failure.

## Anti-patterns

- Diagnosing from platform generalities while implying you read their page ("Kickstarter pages usually...") — that is invention wearing a diagnosis costume.
- Padding to five findings when two are real. Two real beats four thin.
- Opening with what Tideover is. The readout is about THEIR page; the product earns its mention inside a finding.
- Ending with "want me to explain more?" — end with the one concrete next step.

## What good looks like

- Every finding traceable to a field the scrape returned (or its absence).
- A merchant could read the readout in under a minute and repeat the top finding from memory.
- The next step is one sentence, one question.
- A failed scrape produced a plain explanation and a manual path, not a guess.
