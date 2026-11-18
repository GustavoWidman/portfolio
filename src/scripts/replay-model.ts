/**
 * Session replays: the data format of `blog/<slug>/replays/<name>.json` and the pure
 * functions that turn it into terminal lines and a playback schedule. The renderer
 * (`src/lib/markdown/replays.ts`) draws the final state with them at build time and the
 * player chunk (`src/scripts/replay.ts`) draws every other state, so both show the same lines.
 */

/** One shell command of the session. */
export interface ReplayEvent {
  /** The command, shortened to one line. */
  c: string;
  /** The first compiler error its output carried. */
  e?: string;
  /** Set when its output carried any compiler error (a failed build). */
  f?: 1;
}

/** The agent's own words, said after command `at` (1-based). */
export interface ReplayQuote {
  at: number;
  text: string;
  /** A verbatim part of `text` to highlight. */
  mark?: string;
}

/** Format version 1 of a replay file. */
export interface ReplayData {
  version: 1;
  /** Shown in the figure head, joined by `·`: model, harness, effort, language. */
  meta: string[];
  /** Wall time of the session, in minutes. */
  minutes?: number;
  /** Hidden tests the final program passed. */
  result?: { passed: number; total: number };
  events: ReplayEvent[];
  quotes?: ReplayQuote[];
}

/** Lines the terminal holds; CSS shows fewer on small screens. */
export const SCREEN_LINES = 18;

export type ReplayLine =
  | { kind: "cmd"; text: string }
  | { kind: "err"; text: string }
  | { kind: "say"; text: string; mark?: string };

/** Every terminal line of the session in order, and `ends[k]`: the line count after command k. */
export function sessionLines(data: ReplayData): { lines: ReplayLine[]; ends: number[] } {
  const quotes = new Map<number, ReplayQuote[]>();
  for (const quote of data.quotes ?? []) {
    quotes.set(quote.at, [...(quotes.get(quote.at) ?? []), quote]);
  }
  const lines: ReplayLine[] = [];
  const ends = [0];
  data.events.forEach((event, i) => {
    lines.push({ kind: "cmd", text: event.c });
    if (event.e) lines.push({ kind: "err", text: event.e });
    for (const quote of quotes.get(i + 1) ?? []) {
      lines.push({ kind: "say", text: quote.text, mark: quote.mark });
    }
    ends.push(lines.length);
  });
  return { lines, ends };
}

/** `fails[k]`: failed builds among the first k commands. */
export function failedBuilds(data: ReplayData): number[] {
  const fails = [0];
  for (const event of data.events) fails.push(fails[fails.length - 1] + (event.f ? 1 : 0));
  return fails;
}

/** Seconds a reader gets on a command the author or the agent comments on. */
export const HOLD = 2.6;
/** Seconds on each of the first commands, before the session speeds up. */
const OPENING = 0.32;
const OPENING_COMMANDS = 8;
/** Seconds the rest of the session takes, spread evenly over its commands. */
const RUN = 22;

/**
 * Playback schedule: `starts[k]` is the second at which command k has just been shown
 * (`starts[0]` is the empty terminal), so a session of any length plays in about half a
 * minute, slow at first and pausing on every command in `holds`.
 */
export function schedule(count: number, holds: ReadonlySet<number>): number[] {
  const step = Math.min(0.25, RUN / Math.max(1, count - OPENING_COMMANDS));
  const starts = [0.6];
  for (let k = 1; k <= count; k++) {
    const dwell = (k <= OPENING_COMMANDS ? OPENING : step) + (holds.has(k - 1) ? HOLD : 0);
    starts.push(starts[k - 1] + dwell);
  }
  return starts;
}

/** The last k with `starts[k] <= t`. */
export function commandAt(starts: readonly number[], t: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
