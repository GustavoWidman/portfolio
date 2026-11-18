import { readFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

import remarkParse from "remark-parse";
import { unified } from "unified";
import type { ViteUserConfig } from "astro";
import type { Nodes } from "mdast";

import { readPostSources } from "../../content/source";
import type { ReplayData } from "../../scripts/replay-model";

/** A Vite plugin object, typed through Astro's config so `vite` needs no direct dependency. */
type VitePlugin = Extract<NonNullable<ViteUserConfig["plugins"]>[number], { name: string }>;

const parser = unified().use(remarkParse);

/** Info-string language of a replay block: ` ```replay ./replays/<name>.json `. */
export const REPLAY_LANG = "replay";

/** The `./` path in the info string of a replay block, if any. */
export function replaySource(meta: string | null | undefined): string | undefined {
  return meta?.split(/\s+/).find((token) => token.startsWith("./"));
}

/** Project-relative paths of the replay files a post body references. */
export function replayPaths(body: string, postDir: string): string[] {
  const paths: string[] = [];
  const walk = (node: Nodes): void => {
    if (node.type === "code" && node.lang === REPLAY_LANG) {
      const source = replaySource(node.meta);
      if (!source) throw new Error(`${postDir}: a replay block names no ./ file`);
      paths.push(`${postDir}/${source.slice(2)}`);
    }
    if ("children" in node) for (const child of node.children) walk(child);
  };
  walk(parser.parse(body));
  return paths;
}

/** What a replay block says besides its file: a caption and notes pinned to commands. */
export interface ReplayBlock {
  /** Project-relative path of the replay file. */
  path: string;
  caption: string;
  /** Author's notes, each shown from command `at` (1-based) on while the replay plays. */
  notes: { at: number; text: string }[];
}

const NOTE = /^(\d+):\s+(.+)$/;

/**
 * Parses the body of a replay block: lines `<command>: <text>` are notes, every other line
 * is the caption. The block stays readable as plain markdown, where agents read it.
 */
export function parseReplayBlock(path: string, body: string): ReplayBlock {
  const notes: ReplayBlock["notes"] = [];
  const caption: string[] = [];
  for (const line of body.split("\n")) {
    const note = NOTE.exec(line.trim());
    if (note) notes.push({ at: Number(note[1]), text: note[2] });
    else if (line.trim()) caption.push(line.trim());
  }
  return { path, caption: caption.join(" "), notes };
}

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/** Checks a parsed replay file against format version 1; `path` names it in errors. */
export function validateReplay(value: unknown, path: string): ReplayData {
  const fail = (message: string): never => {
    throw new Error(`${path}: ${message}`);
  };
  if (!value || typeof value !== "object") fail("not a JSON object");
  const data = value as Partial<ReplayData>;
  if (data.version !== 1) fail(`unsupported version ${String(data.version)}`);
  if (!Array.isArray(data.meta) || !data.meta.every((item) => typeof item === "string")) {
    fail("meta must be a list of strings");
  }
  if (!Array.isArray(data.events) || data.events.length === 0)
    fail("events must be a non-empty list");
  data.events!.forEach((event, i) => {
    if (typeof event?.c !== "string") fail(`event ${i + 1} has no command`);
    if (event.e !== undefined && typeof event.e !== "string")
      fail(`event ${i + 1}: e must be a string`);
    if (event.f !== undefined && event.f !== 1) fail(`event ${i + 1}: f must be 1 when set`);
    if (event.e !== undefined && event.f !== 1)
      fail(`event ${i + 1} has an error line but no failed build`);
  });
  const count = data.events!.length;
  for (const quote of data.quotes ?? []) {
    if (!isCount(quote.at) || quote.at < 1 || quote.at > count)
      fail(`quote at ${quote.at} is outside the session`);
    if (typeof quote.text !== "string" || !quote.text) fail(`quote at ${quote.at} has no text`);
    if (quote.mark !== undefined && !quote.text.includes(quote.mark)) {
      fail(`quote at ${quote.at}: mark is not part of the text`);
    }
  }
  if (data.minutes !== undefined && !(typeof data.minutes === "number" && data.minutes > 0)) {
    fail("minutes must be a positive number");
  }
  if (data.result !== undefined) {
    const { passed, total } = data.result;
    if (!isCount(passed) || !isCount(total) || passed > total || total === 0)
      fail("result must be passed <= total");
  }
  return data as ReplayData;
}

/** One referenced replay: where the page fetches it and its data, for the final state. */
export interface ReplayAsset {
  url: string;
  data: ReplayData;
}

const MODULE_ID = "virtual:post-replays";
const RESOLVED_ID = `\0${MODULE_ID}`;

/**
 * Vite plugin exposing `virtual:post-replays`: a map from the project-relative path of
 * every replay file a post references to its `ReplayAsset`. Each file is validated and
 * emitted minified as `_astro/<name>.<hash>.json` (immutable, fetched by the player); in dev
 * it is served from its source. Paths resolve against the directory of the post's source
 * file, so posts in `PORTFOLIO_EXTRA_POSTS_DIR` can carry replays too.
 */
export function postReplaysPlugin(root: string): VitePlugin {
  let build = false;
  return {
    name: "portfolio:post-replays",
    enforce: "pre",
    configResolved(config) {
      build = config.command === "build";
    },
    resolveId: (id) => (id === MODULE_ID ? RESOLVED_ID : undefined),
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      const paths = new Set<string>();
      for (const source of readPostSources(root)) {
        const postDir = relative(root, dirname(source.filePath)).split("\\").join("/");
        for (const path of replayPaths(source.body, postDir)) paths.add(path);
      }
      const entries: string[] = [];
      for (const path of [...paths].sort()) {
        const file = join(root, path);
        this.addWatchFile(file);
        const data = validateReplay(JSON.parse(readFileSync(file, "utf8")), path);
        let url: string;
        if (build) {
          const ref = this.emitFile({
            type: "asset",
            name: basename(path),
            source: JSON.stringify(data),
          });
          url = `import.meta.ROLLUP_FILE_URL_${ref}`;
        } else {
          url = JSON.stringify(`/@fs${file}`);
        }
        entries.push(`  ${JSON.stringify(path)}: { url: ${url}, data: ${JSON.stringify(data)} },`);
      }
      return `export default {\n${entries.join("\n")}\n};\n`;
    },
  };
}
