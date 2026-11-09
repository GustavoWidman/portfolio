import { execFileSync } from "node:child_process";

import { getPublicationDate } from "./publication-date";

/**
 * A release epoch: the set of posts visible from `start` (unix seconds) until the next
 * epoch starts. Epoch `e0` starts at the build reference time; every distinct release
 * instant after it starts another epoch. Each epoch is emitted as a complete tree under
 * `dist/site/<name>/` and the web server picks the newest epoch whose start has passed.
 */
export interface Epoch {
  name: string;
  index: number;
  /** Reference instant in unix seconds. Posts released at or before it are visible. */
  start: number;
  /** Same instant in milliseconds, for `isScheduled(date, now)`. */
  now: number;
}

let cachedBuildTime: number | undefined;

/** Upper bound for unix seconds (year 5138); larger values are milliseconds or garbage. */
const MAX_UNIX_SECONDS = 1e11;

function isUnixSeconds(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value < MAX_UNIX_SECONDS;
}

/**
 * The latest of the commit times in `output` (unix seconds, one per line), or undefined
 * when there is none or any line is not plausible unix seconds.
 */
export function latestCommitTime(output: string): number | undefined {
  const lines = output.split("\n").filter((line) => line.trim() !== "");
  const values = lines.map(Number);
  if (values.length === 0 || !values.every(isUnixSeconds)) return undefined;
  return Math.max(...values);
}

function vcsCommitTime(): number | undefined {
  const attempts: [string, string[]][] = [
    [
      "jj",
      [
        "log",
        "-r",
        "@-",
        "--no-graph",
        "--ignore-working-copy",
        "-T",
        // One line per parent: a merge working copy has several.
        'committer.timestamp().format("%s") ++ "\\n"',
      ],
    ],
    ["git", ["log", "-1", "--format=%ct", "HEAD"]],
  ];
  for (const [cmd, args] of attempts) {
    try {
      const out = execFileSync(cmd, args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const seconds = latestCommitTime(out);
      if (seconds !== undefined) return seconds;
    } catch {
      // Tool missing or not a repository; try the next one.
    }
  }
  return undefined;
}

/**
 * Reference time of the build in unix seconds: `PORTFOLIO_BUILD_TIME`, else the latest
 * committer time of the parent commits (jj `@-`, then git `HEAD`). The wall clock is never
 * used, so a build is a pure function of its sources.
 */
export function buildTime(): number {
  if (cachedBuildTime !== undefined) return cachedBuildTime;
  const env = process.env.PORTFOLIO_BUILD_TIME;
  if (env !== undefined && env !== "") {
    const seconds = Number(env);
    if (!isUnixSeconds(seconds)) {
      throw new Error(`PORTFOLIO_BUILD_TIME must be unix seconds, got "${env}"`);
    }
    cachedBuildTime = seconds;
    return seconds;
  }
  const fromVcs = vcsCommitTime();
  if (fromVcs === undefined) {
    throw new Error(
      "Set PORTFOLIO_BUILD_TIME (unix seconds); no jj or git commit time is available",
    );
  }
  cachedBuildTime = fromVcs;
  return fromVcs;
}

/** Epochs for a set of publication dates (`YYYY-MM-DD` or ISO timestamps with offset). */
export function computeEpochs(dates: Iterable<string>, reference: number = buildTime()): Epoch[] {
  const releases = new Set<number>();
  for (const date of dates) {
    const ms = getPublicationDate(date).getTime();
    if (!Number.isFinite(ms)) continue;
    // A post released at a fractional second becomes visible at the next whole second.
    const seconds = Math.ceil(ms / 1000);
    if (seconds > reference) releases.add(seconds);
  }
  const starts = [reference, ...[...releases].sort((a, b) => a - b)];
  return starts.map((start, index) => ({ name: `e${index}`, index, start, now: start * 1000 }));
}
