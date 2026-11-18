/**
 * Writes a session replay (`src/scripts/replay-model.ts`, version 1) from one trial of a
 * gungnir study, as released with its records (`runs/<experiment>/trials/<system>/<task>/
 * <language>/r<rep>`): every shell command of the counted attempt shortened to one line, the
 * first compiler error each printed, the agent's own words at the commands named with
 * `--quote`, the session's wall time and the hidden tests its program passed.
 *
 *   bun scripts/replay-from-gungnir.ts <trial dir> --out blog/<slug>/replays/<name>.json \
 *     --meta "Nemotron 3.5 Super VL" --meta "Codex 0.166.0" --meta "no reasoning" --meta "Zig 0.17" \
 *     --quote "112:trimmed/non-standard" --quote "20:does NOT allow:does NOT allow"
 *
 * `--quote <command>:<text>[:<mark>]` keeps the sentence of an agent message said after that
 * command (1-based) that contains <text>, highlighting <mark>. A failed build is a command
 * whose output carried a compiler, type-checker or syntax error, as the gungnir paper counts
 * them (paper/analysis/sessions.py).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { parseArgs } from "node:util";

import { validateReplay } from "../src/lib/markdown/replay-refs";
import type { ReplayData, ReplayEvent, ReplayQuote } from "../src/scripts/replay-model";

const BUN_PARSE = String.raw`^error: (?<msg>.*)\n {4}at [^\s(]+\.[mc]?[jt]sx?:\d+:\d+$`;
/** Diagnostics a compiler, type checker or parser reports before the program runs. */
const STATIC: Record<string, string[]> = {
  rust: [String.raw`^error\[(?<key>E\d{4})\]: (?<msg>.*)$`],
  zig: [String.raw`\.zig:\d+:\d+: error: (?<msg>.*)$`],
  go: [String.raw`^\S+\.go:\d+:\d+: (?<msg>(?!.*panic).*)$`],
  c: [String.raw`\.[ch]:\d+:\d+: error: (?<msg>.*)$`],
  cpp: [String.raw`\.(?:cpp|cc|cxx|hpp|hh|h):\d+:\d+: error: (?<msg>.*)$`],
  typescript: [String.raw`error (?<key>TS\d+): (?<msg>.*)$`, BUN_PARSE],
  javascript: [BUN_PARSE],
  python: [String.raw`^\s*(?<key>SyntaxError|IndentationError|TabError): (?<msg>.*)$`],
};
const COMMAND_WIDTH = 66;
const ERROR_WIDTH = 84;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    meta: { type: "string", multiple: true, default: [] },
    quote: { type: "string", multiple: true, default: [] },
  },
});
const trial = positionals[0];
if (!trial || !values.out) {
  console.error(
    "usage: replay-from-gungnir.ts <trial dir> --out <file> [--meta <text>]... [--quote <n>:<text>[:<mark>]]...",
  );
  process.exit(2);
}

const language = basename(dirname(trial));
const patterns = (STATIC[language] ?? []).map((p) => new RegExp(p, "m"));
if (!patterns.length) throw new Error(`no compiler errors known for ${language}`);
const record = JSON.parse(readFileSync(join(trial, "run/record.json"), "utf8"));
const system: string = record.inputs.system;
const transcript = readFileSync(
  join(trial, "attempts", String(record.attempt), "transcript.jsonl"),
  "utf8",
);

/** The command as the agent typed it, on one line: shell wrapper, `cd /work` and `/work/` dropped. */
function shorten(command: string): string {
  let text = command.replace(/^\/bin\/(ba)?sh -lc /, "").trim();
  const quote = text[0];
  if (quote === "'" || quote === '"') {
    text = text.slice(1);
    if (text.endsWith(quote)) text = text.slice(0, -1);
  }
  text = text.replaceAll('\\"', '"').replace(/^cd \/work && /, "");
  const rows = text.split("\n");
  const first = rows[0].replace(/\s+/g, " ").replaceAll("/work/", "");
  return first.length > COMMAND_WIDTH || rows.length > 1
    ? `${first.slice(0, COMMAND_WIDTH)} …`
    : first;
}

/** The whole line of the first compiler error in `output`, if any. */
function firstError(output: string): string | undefined {
  let best: number | undefined;
  for (const pattern of patterns) {
    const match = pattern.exec(output);
    if (match && (best === undefined || match.index < best)) best = match.index;
  }
  if (best === undefined) return undefined;
  const start = output.lastIndexOf("\n", best) + 1;
  const end = output.indexOf("\n", best);
  const line = output
    .slice(start, end < 0 ? undefined : end)
    .replaceAll("/work/", "")
    .trim();
  return line.length > ERROR_WIDTH ? `${line.slice(0, ERROR_WIDTH - 2)} …` : line;
}

const events: ReplayEvent[] = [];
/** Agent messages, keyed by the number of commands run before them. */
const said = new Map<number, string[]>();
const say = (text: string): void => {
  said.set(events.length, [...(said.get(events.length) ?? []), text]);
};
const ran = (command: string, output: string): void => {
  const e = firstError(output);
  events.push(e ? { c: shorten(command), e, f: 1 } : { c: shorten(command) });
};

const pending = new Map<string, string>();
for (const row of transcript.split("\n")) {
  if (!row.trim()) continue;
  const event = JSON.parse(row);
  if (system.startsWith("codex")) {
    const item = event.item ?? {};
    if (event.type !== "item.completed") continue;
    if (item.type === "command_execution") ran(item.command, item.aggregated_output ?? "");
    else if (item.type === "agent_message") say(item.text);
  } else {
    const content = event.message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (event.type === "assistant" && part.type === "tool_use" && part.name === "Bash") {
        pending.set(part.id, part.input.command);
      } else if (event.type === "assistant" && part.type === "text") {
        say(part.text);
      } else if (
        event.type === "user" &&
        part.type === "tool_result" &&
        pending.has(part.tool_use_id)
      ) {
        const body = Array.isArray(part.content)
          ? part.content.map((c: { text?: string }) => c.text ?? "").join("\n")
          : String(part.content ?? "");
        ran(pending.get(part.tool_use_id)!, body);
        pending.delete(part.tool_use_id);
      }
    }
  }
}

const quotes: ReplayQuote[] = values.quote.map((spec) => {
  const [at, needle, mark] = spec.split(":");
  const n = Number(at);
  for (const message of said.get(n) ?? []) {
    for (const sentence of message.split(/(?<=[.?!])\s+|\n+/)) {
      if (sentence.includes(needle))
        return { at: n, text: sentence.trim(), ...(mark ? { mark } : {}) };
    }
  }
  throw new Error(`no sentence with ${JSON.stringify(needle)} after command ${n}`);
});

/** `1h 9m 56s 893ms …` in minutes. */
function minutes(wall: string): number {
  const unit: Record<string, number> = { h: 60, m: 1, s: 1 / 60 };
  let total = 0;
  for (const [, value, name] of wall.matchAll(/(\d+)(h|m|s)\b/g))
    total += Number(value) * unit[name];
  return Math.round(total);
}

const grade = JSON.parse(readFileSync(join(trial, "grade/record.json"), "utf8"));
const cases = Object.values(grade.judgement.cases as Record<string, { outcome: unknown }>);
const data: ReplayData = {
  version: 1,
  meta: values.meta,
  minutes: minutes(record.process.wall),
  result: { passed: cases.filter((c) => c.outcome === "pass").length, total: cases.length },
  events,
  quotes,
};
validateReplay(data, values.out);
mkdirSync(dirname(values.out), { recursive: true });
writeFileSync(values.out, `${JSON.stringify(data)}\n`);
console.log(
  `${values.out}: ${events.length} commands, ${events.filter((e) => e.f).length} failed builds, ` +
    `${data.result!.passed}/${data.result!.total} hidden tests, ${data.minutes} min`,
);
