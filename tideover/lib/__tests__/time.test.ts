import assert from "node:assert/strict";
import { test } from "node:test";
import { timeAgo } from "@/lib/time";

const NOW = new Date("2026-07-03T12:00:00.000Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

test("timeAgo: sub-minute reads as 'just now'", () => {
  assert.equal(timeAgo(ago(0), NOW), "just now");
  assert.equal(timeAgo(ago(30_000), NOW), "just now");
});

test("timeAgo: minutes/hours/days/weeks/months, with correct singular/plural", () => {
  assert.equal(timeAgo(ago(1 * MIN), NOW), "1 minute ago");
  assert.equal(timeAgo(ago(5 * MIN), NOW), "5 minutes ago");
  assert.equal(timeAgo(ago(1 * HOUR), NOW), "1 hour ago");
  assert.equal(timeAgo(ago(3 * HOUR), NOW), "3 hours ago");
  assert.equal(timeAgo(ago(1 * DAY), NOW), "1 day ago");
  assert.equal(timeAgo(ago(2 * DAY), NOW), "2 days ago");
  assert.equal(timeAgo(ago(7 * DAY), NOW), "1 week ago");
  assert.equal(timeAgo(ago(21 * DAY), NOW), "3 weeks ago");
  assert.equal(timeAgo(ago(30 * DAY), NOW), "1 month ago");
  assert.equal(timeAgo(ago(75 * DAY), NOW), "2 months ago");
});

test("timeAgo: a future timestamp clamps to 'just now' rather than going negative", () => {
  assert.equal(timeAgo(ago(-5 * DAY), NOW), "just now");
});

test("timeAgo: an unparseable timestamp yields an empty string", () => {
  assert.equal(timeAgo("not-a-date", NOW), "");
});
