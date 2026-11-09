import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { getCollection } from "astro:content";

import { computeEpochs } from "./epochs";
import { getPublicationDate } from "./publication-date";
import type { Language } from "./config";
import type { Epoch } from "./epochs";

/** One language version of a post. */
export interface Post {
  /** `<slug>/<lang>` */
  id: string;
  slug: string;
  lang: Language;
  title: string;
  /** Frontmatter date exactly as written (`YYYY-MM-DD` or an ISO timestamp with offset). */
  date: string;
  /** Release instant. */
  published: Date;
  excerpt: string;
  tags: string[];
  /** Markdown body without frontmatter. */
  body: string;
  /** Source `.mdx` file, relative to the project root. */
  filePath: string;
}

let cached: Promise<Post[]> | undefined;

/** Every post in every language, newest first (ties by slug). */
export function getPosts(): Promise<Post[]> {
  cached ??= getCollection("blog").then((entries) =>
    entries
      .map((entry): Post => {
        const [slug, lang] = entry.id.split("/") as [string, Language];
        return {
          id: entry.id,
          slug,
          lang,
          title: entry.data.title,
          date: entry.data.date,
          published: getPublicationDate(entry.data.date),
          excerpt: entry.data.excerpt,
          tags: entry.data.tags,
          body: entry.body ?? "",
          filePath: entry.filePath ?? "",
        };
      })
      .sort(
        (a, b) => b.published.getTime() - a.published.getTime() || a.slug.localeCompare(b.slug),
      ),
  );
  return cached;
}

export async function getEpochs(): Promise<Epoch[]> {
  return computeEpochs((await getPosts()).map((post) => post.date));
}

const rawCache = new Map<string, string>();

/** The source file exactly as stored, frontmatter included. */
export function rawSource(post: Post): string {
  let raw = rawCache.get(post.filePath);
  if (raw === undefined) {
    raw = readFileSync(resolve(process.cwd(), post.filePath), "utf8");
    rawCache.set(post.filePath, raw);
  }
  return raw;
}
