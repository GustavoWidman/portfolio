import { DEFAULT_LANGUAGE, LANGUAGES } from "./config";
import { isScheduled } from "./publication-date";
import type { Language } from "./config";
import type { Epoch } from "./epochs";
import type { Post } from "./posts";

/**
 * Which version of a post a tree serves. Each language version has its own release date.
 * A slug is available in an epoch once any of its versions is released, and the `<lang>`
 * tree serves the `<lang>` version when it is released, else the released version in the
 * first other language of `LANGUAGES`. Pages, listings, per-post markdown, feeds and the
 * curl card all follow this rule, so a URL that answers in one of them answers in all.
 */

export function isReleased(post: Post, epoch: Epoch): boolean {
  return !isScheduled(post.date, epoch.now);
}

/** `lang` first, then the other languages in `LANGUAGES` order. */
function preference(lang: Language): Language[] {
  return [lang, ...LANGUAGES.filter((other) => other !== lang)];
}

const newestFirst = (a: Post, b: Post): number =>
  b.published.getTime() - a.published.getTime() || a.slug.localeCompare(b.slug);

const soonestFirst = (a: Post, b: Post): number =>
  a.published.getTime() - b.published.getTime() || a.slug.localeCompare(b.slug);

/** The released version of every available slug as the `lang` tree serves it, newest first. */
export function servedPosts(posts: readonly Post[], epoch: Epoch, lang: Language): Post[] {
  const rank = preference(lang);
  const served = new Map<string, Post>();
  for (const post of posts) {
    if (!isReleased(post, epoch)) continue;
    const current = served.get(post.slug);
    if (!current || rank.indexOf(post.lang) < rank.indexOf(current.lang)) {
      served.set(post.slug, post);
    }
  }
  return [...served.values()].sort(newestFirst);
}

/** The version of `slug` the `lang` tree serves in `epoch`; undefined while none is released. */
export function servedPost(
  posts: readonly Post[],
  epoch: Epoch,
  lang: Language,
  slug: string,
): Post | undefined {
  return servedPosts(
    posts.filter((post) => post.slug === slug),
    epoch,
    lang,
  )[0];
}

/**
 * Slugs without any released version in `epoch`, soonest first. Each is represented by the
 * version released first (`lang` first on a tie): the one the `lang` tree serves when the
 * slug becomes available, so a countdown ends exactly when its post appears.
 */
export function scheduledPosts(posts: readonly Post[], epoch: Epoch, lang: Language): Post[] {
  const rank = preference(lang);
  const available = new Set(
    posts.filter((post) => isReleased(post, epoch)).map((post) => post.slug),
  );
  const next = new Map<string, Post>();
  for (const post of posts) {
    if (available.has(post.slug)) continue;
    const current = next.get(post.slug);
    const earlier = current
      ? post.published.getTime() - current.published.getTime() ||
        rank.indexOf(post.lang) - rank.indexOf(current.lang)
      : -1;
    if (earlier < 0) next.set(post.slug, post);
  }
  return [...next.values()].sort(soonestFirst);
}

/**
 * One entry per available slug as the English tree serves it, newest first. This is the
 * language policy of the machine indexes (`/llms.mdx/blog`, `/llms-full.txt`, `/llms.txt`,
 * sitemap), which are identical in every tree.
 */
export function releasedBySlug(posts: readonly Post[], epoch: Epoch): Post[] {
  return servedPosts(posts, epoch, DEFAULT_LANGUAGE);
}
