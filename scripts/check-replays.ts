/**
 * Session replay assertions. Always: the replay model on `scripts/fixtures/replay.json`
 * (lines, failed builds, playback schedule) and the validator's refusals. After a build
 * (`dist/` present): every `figure.replay` of every tree points at a replay asset in
 * `dist/_astro/` with its Brotli sidecar, and the figure's static state (commands, failed
 * builds, notes) agrees with that asset; every replay asset is used by some page.
 *
 *   bun scripts/check-replays.ts [--dist <dir>]
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { validateReplay } from "../src/lib/markdown/replay-refs";
import {
  commandAt,
  failedBuilds,
  HOLD,
  schedule,
  SCREEN_LINES,
  sessionLines,
} from "../src/scripts/replay-model";
import type { ReplayData } from "../src/scripts/replay-model";

const root = fileURLToPath(new URL("..", import.meta.url));
const { values } = parseArgs({ options: { dist: { type: "string", default: "dist" } } });
const dist = join(root, values.dist);

// The model, on a session of 12 commands with 3 failed builds and 2 quotes.
const fixture = validateReplay(
  JSON.parse(readFileSync(join(root, "scripts/fixtures/replay.json"), "utf8")),
  "replay.json",
);
const { lines, ends } = sessionLines(fixture);
assert.equal(ends.length, 13);
assert.equal(lines.length, 12 + 2 + 2);
assert.deepEqual(lines[2], { kind: "cmd", text: "zig build-exe src/main.zig" });
assert.equal(lines[3].kind, "err");
assert.deepEqual(
  lines.slice(ends[4], ends[5]).map((line) => line.kind),
  ["cmd", "err", "say"],
);
assert.ok(ends.every((end, k) => k === 0 || end > ends[k - 1]));
assert.deepEqual(failedBuilds(fixture), [0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]);

const starts = schedule(12, new Set([5]));
assert.equal(starts.length, 13);
assert.ok(starts.every((start, k) => k === 0 || start > starts[k - 1]));
const plain = schedule(12, new Set());
assert.ok(Math.abs(starts[6] - starts[5] - (plain[6] - plain[5]) - HOLD) < 1e-9);
for (let k = 0; k <= 12; k++) {
  assert.equal(commandAt(starts, starts[k]), k);
  if (k > 0) assert.equal(commandAt(starts, starts[k] - 1e-6), k - 1);
}
assert.equal(commandAt(starts, -1), 0);
assert.equal(commandAt(starts, 1e9), 12);
// Long sessions still play in under a minute, plus their holds.
assert.ok(schedule(5000, new Set()).at(-1)! < 60);

const broken = (change: (data: ReplayData) => void): void => {
  const data = structuredClone(fixture);
  change(data);
  assert.throws(() => validateReplay(data, "broken.json"));
};
broken((data) => {
  (data as { version: number }).version = 2;
});
broken((data) => {
  data.events = [];
});
broken((data) => {
  delete data.events[2].f;
});
broken((data) => {
  data.quotes![0].at = 13;
});
broken((data) => {
  data.quotes![0].mark = "absent";
});
broken((data) => {
  data.result = { passed: 7, total: 6 };
});

let figures = 0;
const used = new Set<string>();
if (existsSync(join(dist, "site"))) {
  const pages = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? pages(join(dir, entry.name))
        : entry.name.endsWith(".html")
          ? [join(dir, entry.name)]
          : [],
    );
  for (const page of pages(join(dist, "site"))) {
    const html = readFileSync(page, "utf8");
    for (const match of html.matchAll(/<figure class="replay"([^>]*)>([\s\S]*?)<\/figure>/g)) {
      figures++;
      const where = `${page.slice(dist.length)}: replay ${match[1]}`;
      const attr = (name: string): string | undefined =>
        new RegExp(`\\s${name}="([^"]*)"`).exec(match[1])?.[1];
      const url = attr("data-replay") ?? "";
      assert.ok(url.startsWith("/_astro/") && url.endsWith(".json"), `${where}: data-replay`);
      const file = join(dist, url);
      assert.ok(existsSync(file), `${where}: ${url} is missing`);
      assert.ok(existsSync(`${file}.br`), `${where}: ${url} has no Brotli sidecar`);
      used.add(url);
      const data = validateReplay(JSON.parse(readFileSync(file, "utf8")), url);
      const count = data.events.length;
      assert.equal(Number(attr("data-replay-n")), count, `${where}: data-replay-n`);
      const body = match[2];
      const dd = (name: string): number =>
        Number(new RegExp(`<dd ${name}="">(\\d+)</dd>`).exec(body)?.[1]);
      assert.equal(dd("data-replay-cmds"), count, `${where}: commands`);
      assert.equal(dd("data-replay-fails"), failedBuilds(data)[count], `${where}: failed builds`);
      const shown = (body.match(/class="rl /g) ?? []).length;
      const { ends: all } = sessionLines(data);
      assert.equal(shown, Math.min(SCREEN_LINES, all[count]), `${where}: lines at rest`);
      for (const [, at] of body.matchAll(/data-replay-at="(\d+)"/g)) {
        assert.ok(Number(at) >= 1 && Number(at) <= count, `${where}: note at ${at}`);
      }
    }
  }
  const assets = existsSync(join(dist, "_astro"))
    ? readdirSync(join(dist, "_astro")).filter((name) => name.endsWith(".json"))
    : [];
  for (const asset of assets)
    assert.ok(used.has(`/_astro/${asset}`), `/_astro/${asset} is used by no page`);
}

console.log(`replays: model ok, ${figures} figure(s) in ${values.dist}/ ok`);
