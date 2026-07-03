import assert from "node:assert/strict";
import { test } from "node:test";
import { blocksSend, scoreReplyChecks } from "@/lib/qa";

/** A clean, personalized, wait-acknowledging, order-specific reply. */
const CLEAN =
  "Hi Ada — totally get that waiting on something you've paid for feels long. Your order is on schedule; it's in production now and the current window still holds. I'll message you the moment it moves to the next stage.";

test("hard date present → noHardDate:false and blocksSend true (the hard gate)", () => {
  const checks = scoreReplyChecks({
    text: "Hi Ada — good news, your order ships on 2026-07-14, guaranteed.",
    firstName: "Ada",
  });
  assert.equal(checks.noHardDate, false);
  assert.equal(blocksSend(checks), true);
  const row = checks.dimensions.find((d) => d.key === "noHardDate")!;
  assert.equal(row.kind, "auto");
  assert.equal(row.blocking, true);
  assert.equal(row.pass, false);
});

test("a hard date in a natural-language form (e.g. 'Jul 14') is still caught", () => {
  const checks = scoreReplyChecks({
    text: "Hi Ada — it will arrive Jul 14, promise.",
    firstName: "Ada",
  });
  assert.equal(checks.noHardDate, false);
  assert.equal(blocksSend(checks), true);
});

test("clean personalized text passes and does not block", () => {
  const checks = scoreReplyChecks({ text: CLEAN, firstName: "Ada" });
  assert.equal(checks.noHardDate, true);
  assert.equal(checks.personalized, true);
  assert.equal(blocksSend(checks), false);
  // only the hard-date row is ever marked blocking
  assert.deepEqual(
    checks.dimensions.filter((d) => d.blocking).map((d) => d.key),
    ["noHardDate"],
  );
});

test("personalized is AUTO: true only when the first name appears in the text", () => {
  assert.equal(scoreReplyChecks({ text: "Hi Ada, thanks!", firstName: "Ada" }).personalized, true);
  assert.equal(
    scoreReplyChecks({ text: "Hi there, thanks!", firstName: "Ada" }).personalized,
    false,
  );
  // a blank first name can never pass the personalized check
  assert.equal(scoreReplyChecks({ text: "Hi there", firstName: "" }).personalized, false);
  assert.equal(scoreReplyChecks({ text: "Hi there", firstName: "   " }).personalized, false);
});

test("personalized match is case-insensitive", () => {
  assert.equal(scoreReplyChecks({ text: "hey ada!", firstName: "Ada" }).personalized, true);
});

test("guidance heuristics: acknowledgesWait fires on wait vocabulary, not otherwise", () => {
  assert.equal(
    scoreReplyChecks({ text: "Thanks for waiting on this.", firstName: "Ada" }).acknowledgesWait,
    true,
  );
  assert.equal(
    scoreReplyChecks({ text: "Appreciate your patience here.", firstName: "Ada" }).acknowledgesWait,
    true,
  );
  assert.equal(
    scoreReplyChecks({ text: "Your item is boxed up.", firstName: "Ada" }).acknowledgesWait,
    false,
  );
});

test("guidance heuristics: specificToOrder fires on stage/timeline vocabulary, not otherwise", () => {
  assert.equal(
    scoreReplyChecks({ text: "It's in production and on schedule.", firstName: "Ada" })
      .specificToOrder,
    true,
  );
  assert.equal(
    scoreReplyChecks({ text: "The current window still holds.", firstName: "Ada" }).specificToOrder,
    true,
  );
  assert.equal(
    scoreReplyChecks({ text: "Thanks so much for reaching out!", firstName: "Ada" })
      .specificToOrder,
    false,
  );
});

test("guidance dimensions are labelled guidance, never blocking (proof-only, no score)", () => {
  const checks = scoreReplyChecks({ text: CLEAN, firstName: "Ada" });
  const guidance = checks.dimensions.filter((d) => d.kind === "guidance");
  assert.deepEqual(
    guidance.map((d) => d.key).sort(),
    ["acknowledgesWait", "specificToOrder"],
  );
  assert.ok(guidance.every((d) => d.blocking === false));
});

test("exactly two AUTO and two GUIDANCE dimensions are returned", () => {
  const { dimensions } = scoreReplyChecks({ text: CLEAN, firstName: "Ada" });
  assert.equal(dimensions.length, 4);
  assert.equal(dimensions.filter((d) => d.kind === "auto").length, 2);
  assert.equal(dimensions.filter((d) => d.kind === "guidance").length, 2);
});
