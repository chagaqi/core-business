import assert from "node:assert/strict";
import { test } from "node:test";
import { escalateTicket, getQueue } from "@/lib/service";
import { getRepositories } from "@/lib/repositories";
import {
  ESCALATION_TAG_PREFIX,
  formatEscalationTag,
  isEscalationTag,
  isFlagged,
  parseEscalationTag,
} from "@/lib/escalation";

const LUMEN = "mch_lumen0001"; // seeded demo merchant

/** A real ticket id from the seeded queue (any status — escalate is status-agnostic). */
async function aTicketId(): Promise<string> {
  const queue = await getQueue(LUMEN);
  assert.ok(queue.length > 0, "seeded merchant has queue rows");
  return queue[0].ticket.id;
}

// ─── tag format (pure) ───────────────────────────────────────────────────────
test("formatEscalationTag → parseEscalationTag round-trips operator, instant, reason", () => {
  const at = new Date("2026-07-07T12:34:56.000Z");
  const tag = formatEscalationTag("Dylan", at, "check with ops");
  assert.ok(tag.startsWith(ESCALATION_TAG_PREFIX), "carries the shared prefix");
  assert.ok(isEscalationTag(tag));

  const parsed = parseEscalationTag(tag);
  assert.ok(parsed, "parses");
  assert.equal(parsed!.operator, "Dylan");
  assert.equal(parsed!.at, at.toISOString(), "instant survives verbatim");
  assert.equal(new Date(parsed!.at).toISOString(), parsed!.at, "instant is a valid ISO-8601 time");
  assert.equal(parsed!.reason, "check with ops");
});

test("escalation tag is well-formed without a reason and with a colon-bearing reason", () => {
  const at = "2026-07-07T00:00:00.000Z";
  const noReason = formatEscalationTag("Dylan", at);
  assert.equal(noReason, `${ESCALATION_TAG_PREFIX}Dylan:${at}`);
  assert.equal(parseEscalationTag(noReason)!.reason, undefined);

  // Reason is the trailing segment, so internal colons are preserved.
  const withColon = parseEscalationTag(formatEscalationTag("Dylan", at, "call: ops team"));
  assert.equal(withColon!.reason, "call: ops team");
});

test("operator colons/newlines are sanitized so the tag stays parseable", () => {
  const tag = formatEscalationTag("Dy:lan\n", "2026-07-07T00:00:00.000Z");
  const parsed = parseEscalationTag(tag);
  assert.ok(parsed, "still parses after sanitizing the operator");
  assert.ok(!parsed!.operator.includes(":"), "no colon leaks into the operator segment");
});

test("isFlagged detects escalation tags and ignores unrelated tags", () => {
  assert.equal(isFlagged(["presale", "gift-sent:card"]), false);
  assert.equal(isFlagged(["presale", formatEscalationTag("Dylan", new Date())]), true);
});

// ─── persistence (through the repository seam) ───────────────────────────────
test("escalateTicket persists a well-formed flag that survives a re-fetch", async () => {
  const id = await aTicketId();
  const repos = getRepositories();

  const result = await escalateTicket(id, "Dylan", { reason: "watch this one" });
  assert.ok("ticket" in result, "escalate succeeds");
  assert.equal(result.escalated, true);

  // Re-fetch from the store (not the returned object) to prove it persisted.
  const refetched = await repos.tickets.findById(id);
  assert.ok(refetched, "ticket still resolves");
  assert.ok(isFlagged(refetched!.tags), "flag survives a re-fetch");

  const tag = refetched!.tags.find(isEscalationTag)!;
  const parsed = parseEscalationTag(tag);
  assert.ok(parsed, "the persisted tag is well-formed");
  assert.equal(parsed!.operator, "Dylan");
  assert.ok(!Number.isNaN(new Date(parsed!.at).getTime()), "carries a valid ISO instant");
  assert.equal(parsed!.reason, "watch this one");
});

test("escalateTicket re-stamps rather than accumulating duplicate flags", async () => {
  const id = await aTicketId();
  const repos = getRepositories();

  await escalateTicket(id, "Dylan");
  await escalateTicket(id, "Dylan", { reason: "second look" });

  const refetched = await repos.tickets.findById(id);
  const flags = refetched!.tags.filter(isEscalationTag);
  assert.equal(flags.length, 1, "exactly one escalation flag, re-stamped not duplicated");
  assert.equal(parseEscalationTag(flags[0])!.reason, "second look", "re-stamp carries the latest reason");
});

test("escalateTicket undo clears the flag", async () => {
  const id = await aTicketId();
  const repos = getRepositories();

  await escalateTicket(id, "Dylan", { reason: "temp" });
  assert.ok(isFlagged((await repos.tickets.findById(id))!.tags), "flagged first");

  const undone = await escalateTicket(id, "Dylan", { undo: true });
  assert.ok("ticket" in undone && undone.escalated === false);
  assert.equal(isFlagged((await repos.tickets.findById(id))!.tags), false, "flag removed after undo");
});

test("escalateTicket reports an error for an unknown ticket", async () => {
  const result = await escalateTicket("tkt_does_not_exist", "Dylan");
  assert.ok("error" in result, "missing ticket returns a structured error");
});
