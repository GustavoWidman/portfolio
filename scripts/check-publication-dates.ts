/**
 * Publication-date assertions: release boundaries, the frontmatter schema, display in the
 * site timezone, release epochs, the build reference time, and which language version a
 * tree serves when versions have different release dates. Must pass under any machine
 * timezone:
 *   bun scripts/check-publication-dates.ts && TZ=UTC bun scripts/check-publication-dates.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { postSchema } from "../src/content/schema";
import { splitFrontmatter } from "../src/content/source";
import { computeEpochs, latestCommitTime } from "../src/lib/epochs";
import { formatDateValue, getPublicationDate, isScheduled } from "../src/lib/publication-date";
import { releasedBySlug, scheduledPosts, servedPost, servedPosts } from "../src/lib/release";
import type { Language } from "../src/lib/config";
import type { Post } from "../src/lib/posts";

const root = fileURLToPath(new URL("..", import.meta.url));

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

const article = splitFrontmatter(readFileSync(join(root, "blog/autonomous-loops/en.mdx"), "utf8"));
const parsed = postSchema.parse(article.data);
assert.equal(parsed.date, timestamp, "collection schema must preserve exact release time");
const legacy = postSchema.parse({ ...article.data, date: new Date("2026-10-21T00:00:00Z") });
assert.equal(legacy.date, "2026-10-21", "legacy YAML date objects stay date-only");
assert.equal(getPublicationDate(legacy.date).getTime(), legacyRelease);
const plain = postSchema.parse({ ...article.data, date: "2026-10-21" });
assert.equal(plain.date, "2026-10-21");
assert.throws(() => postSchema.parse({ ...article.data, date: "2026-10-21T16:00:00" }));
const bare = splitFrontmatter(readFileSync(join(root, "blog/upstreamer/en.mdx"), "utf8"));
assert.equal(postSchema.parse(bare.data).date, "2026-04-27", "unquoted YAML dates stay date-only");

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

// Release epochs: e0 starts at the reference time; each later distinct release starts one.
const reference = release / 1000 - 3600;
const epochs = computeEpochs([timestamp, timestamp, "2026-10-21", "2026-12-01"], reference);
assert.deepEqual(
  epochs.map(({ name, start }) => [name, start]),
  [
    ["e0", reference],
    ["e1", release / 1000],
    ["e2", Date.parse("2026-12-01T03:00:00Z") / 1000],
  ],
);
assert.equal(isScheduled(timestamp, epochs[0].now), true);
assert.equal(isScheduled(timestamp, epochs[1].now), false);
assert.equal(
  computeEpochs([timestamp], release / 1000).length,
  1,
  "a release at the reference time is already out",
);

// Build reference time from VCS output: one committer time per parent, the latest wins.
assert.equal(latestCommitTime("1794187136\n"), 1794187136);
assert.equal(latestCommitTime("1794187136\n1794187137\n"), 1794187137, "merge: latest parent");
assert.equal(latestCommitTime("17941871361794187137"), undefined, "concatenated times rejected");
assert.equal(latestCommitTime("1794187136000\n"), undefined, "milliseconds rejected");
assert.equal(latestCommitTime(""), undefined);
assert.equal(latestCommitTime("abc\n"), undefined);

// Language versions with their own release dates. A tree serves its own language when it
// is released, else the other released version; a slug with no released version is a
// countdown represented by the version released first.
const version = (slug: string, lang: Language, date: string): Post => ({
  id: `${slug}/${lang}`,
  slug,
  lang,
  title: `${slug} ${lang}`,
  date,
  published: getPublicationDate(date),
  excerpt: "",
  tags: [],
  body: "",
  filePath: `blog/${slug}/${lang}.mdx`,
});
const early = "2026-11-01T12:00:00-03:00";
const late = "2026-12-01T12:00:00-03:00";
const split = [
  version("both", "en", "2026-10-01"),
  version("both", "pt", "2026-10-01"),
  version("pt-first", "en", late),
  version("pt-first", "pt", early),
  version("en-first", "en", early),
  version("en-first", "pt", late),
  version("en-only", "en", early),
];
const [before, between, after] = computeEpochs(
  split.map((post) => post.date),
  Date.parse("2026-10-15T00:00:00Z") / 1000,
);
assert.ok(before && between && after);
const served = (epoch: typeof before, lang: Language): string[] =>
  servedPosts(split, epoch, lang).map((post) => post.id);
const countdowns = (epoch: typeof before, lang: Language): string[] =>
  scheduledPosts(split, epoch, lang).map((post) => post.id);
assert.deepEqual(served(before, "en"), ["both/en"]);
assert.deepEqual(served(before, "pt"), ["both/pt"]);
assert.deepEqual(countdowns(before, "en"), ["en-first/en", "en-only/en", "pt-first/pt"]);
assert.deepEqual(countdowns(before, "pt"), ["en-first/en", "en-only/en", "pt-first/pt"]);
assert.deepEqual(served(between, "en"), ["en-first/en", "en-only/en", "pt-first/pt", "both/en"]);
assert.deepEqual(served(between, "pt"), ["en-first/en", "en-only/en", "pt-first/pt", "both/pt"]);
assert.deepEqual(countdowns(between, "en"), [], "a slug with a released version is not scheduled");
// Lists sort by the date of the version they show.
assert.deepEqual(served(after, "en"), ["pt-first/en", "en-first/en", "en-only/en", "both/en"]);
assert.deepEqual(served(after, "pt"), ["en-first/pt", "en-only/en", "pt-first/pt", "both/pt"]);
assert.equal(servedPost(split, between, "en", "pt-first")?.id, "pt-first/pt");
assert.equal(servedPost(split, between, "pt", "en-first")?.id, "en-first/en");
assert.equal(servedPost(split, before, "pt", "pt-first"), undefined);
assert.deepEqual(
  releasedBySlug(split, between).map((post) => post.id),
  served(between, "en"),
  "machine indexes list what the English tree serves",
);
for (const epoch of [before, between, after]) {
  const slugs = (lang: Language): string[] => servedPosts(split, epoch, lang).map((p) => p.slug);
  assert.deepEqual(slugs("en").sort(), slugs("pt").sort(), "every tree has the same slugs");
}

console.log(
  `publication boundary/schema/display/epoch/release assertions passed (TZ=${process.env.TZ ?? "default"})`,
);
