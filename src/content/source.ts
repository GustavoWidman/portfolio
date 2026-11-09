import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { parse as parseYaml } from "yaml";

import { isLanguage } from "../lib/config";
import type { Language } from "../lib/config";

/** One `blog/<slug>/<lang>.mdx` file, split into frontmatter and markdown body. */
export interface PostSource {
  /** Collection id: `<slug>/<lang>`. */
  id: string;
  slug: string;
  lang: Language;
  /** Absolute path of the source file. */
  filePath: string;
  /** The file exactly as stored on disk, frontmatter included. */
  raw: string;
  /** Parsed, unvalidated YAML frontmatter. */
  data: Record<string, unknown>;
  /** Markdown after the closing `---` of the frontmatter. */
  body: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/**
 * Directories scanned for posts. `blog/` is always first; `PORTFOLIO_EXTRA_POSTS_DIR`
 * adds another directory with the same `<slug>/<lang>.mdx` layout (used by tests to
 * inject posts without touching `blog/`). Extra posts cannot reference local images.
 */
export function postDirectories(root: string = process.cwd()): string[] {
  const dirs = [resolve(root, "blog")];
  const extra = process.env.PORTFOLIO_EXTRA_POSTS_DIR;
  if (extra) dirs.push(resolve(root, extra));
  return dirs;
}

export function splitFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = FRONTMATTER.exec(raw);
  if (!match) return { data: {}, body: raw };
  const parsed: unknown = parseYaml(match[1]);
  const data =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  return { data, body: raw.slice(match[0].length) };
}

export function readPostSources(root: string = process.cwd()): PostSource[] {
  const sources: PostSource[] = [];
  const seen = new Set<string>();
  for (const dir of postDirectories(root)) {
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      for (const file of readdirSync(join(dir, slug))) {
        const match = /^([a-z]{2})\.mdx$/.exec(file);
        if (!match || !isLanguage(match[1])) continue;
        const lang = match[1];
        const id = `${slug}/${lang}`;
        if (seen.has(id)) throw new Error(`Duplicate post ${id} in ${dir}`);
        seen.add(id);
        const filePath = join(dir, slug, file);
        const raw = readFileSync(filePath, "utf8");
        const { data, body } = splitFrontmatter(raw);
        sources.push({ id, slug, lang, filePath, raw, data, body });
      }
    }
  }
  return sources.sort((a, b) => a.id.localeCompare(b.id));
}
