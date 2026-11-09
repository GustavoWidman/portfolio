import { t } from "../i18n";
import { resolveLocalImages } from "./markdown/images";
import { bodyHtml, renderMarkdown } from "./markdown/render";
import type { HostKind } from "./config";
import type { TocEntry } from "./markdown/render";
import type { Post } from "./posts";

export interface PreparedPost {
  toc: TocEntry[];
  readingMinutes: number;
  /** Body HTML per host tree (internal `/blog/...` links differ). */
  html: Record<HostKind, string>;
}

const cache = new Map<string, Promise<PreparedPost>>();

async function prepare(post: Post): Promise<PreparedPost> {
  const labels = t(post.lang).post;
  const rendered = await renderMarkdown(post.body, {
    postDir: `blog/${post.slug}`,
    labels: { copyCode: labels.copyCode, copiedCode: labels.copiedCode },
    warn: (message) => console.warn(`[${post.id}] ${message}`),
  });
  await resolveLocalImages(rendered.tree);
  return {
    toc: rendered.toc,
    readingMinutes: rendered.readingMinutes,
    html: { main: bodyHtml(rendered.tree, "main"), blog: bodyHtml(rendered.tree, "blog") },
  };
}

/** Renders a post once per build; every epoch and host tree reuses the result. */
export function preparePost(post: Post): Promise<PreparedPost> {
  let prepared = cache.get(post.id);
  if (!prepared) {
    prepared = prepare(post);
    cache.set(post.id, prepared);
  }
  return prepared;
}
