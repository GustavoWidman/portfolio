import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { blog } from "../source.config";
import { formatDateValue, getPublicationDate, isScheduled } from "../lib/publication-date";

const timestamp = "2026-10-21T16:00:00-03:00";
const release = Date.parse("2026-10-21T19:00:00Z");
const legacyRelease = Date.parse("2026-10-21T03:00:00Z");
assert.equal(getPublicationDate(timestamp).getTime(), release);
assert.equal(formatDateValue(timestamp), timestamp);
assert.equal(getPublicationDate(new Date(release)).getTime(), release);
for (const [now, scheduled] of [
  [release - 1, true],
  [release, false],
  [release + 1, false],
] as const) {
  assert.equal(isScheduled(timestamp, now), scheduled);
  assert.equal(isScheduled(new Date(release), now), scheduled);
}
assert.equal(getPublicationDate("2026-10-21").getTime(), legacyRelease);
assert.equal(isScheduled("2026-10-21", legacyRelease - 1), true);
assert.equal(isScheduled("2026-10-21", legacyRelease), false);
assert.equal(isScheduled("2026-10-21", legacyRelease + 1), false);
assert.equal(getPublicationDate("2026-10").toISOString(), "2026-10-01T03:00:00.000Z");
assert.equal(isScheduled("2026-10-21T16:00:00", release), true, "ambiguous timestamps fail closed");
assert.equal(isScheduled("invalid", release), true);
const schema = blog.schema;
assert.ok(schema && typeof schema !== "function");
const article = matter(readFileSync("blog/autonomous-loops/en.mdx", "utf8"));
const parsed = schema.parse(article.data);
assert.equal(parsed.date, timestamp, "collection schema must preserve exact release time");
const legacy = schema.parse({ ...article.data, date: new Date("2026-10-21T00:00:00Z") });
assert.equal(legacy.date, "2026-10-21", "legacy YAML date objects stay date-only");
assert.equal(getPublicationDate(legacy.date).getTime(), legacyRelease);
const plain = schema.parse({ ...article.data, date: "2026-10-21" });
assert.equal(plain.date, "2026-10-21");
assert.equal(
  getPublicationDate(timestamp).toLocaleDateString("en-US", { timeZone: "America/Sao_Paulo" }),
  "10/21/2026",
);
assert.equal(
  getPublicationDate(timestamp).toLocaleTimeString("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  }),
  "16:00:00",
);
console.log(
  `publication boundary/schema/display assertions passed (TZ=${process.env.TZ ?? "default"})`,
);
