import { AUTHOR } from "../config";
import { canonical } from "../urls";
import type { Language } from "../config";
import type { Epoch } from "../epochs";
import type { Post } from "../posts";

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * `sitemap.xml`: home, blog index and every released post (canonical main-host URLs).
 * `lastmod` is the newest release for the blog, the publication instant for posts, and
 * the epoch reference time for the home page.
 */
export function sitemapXml(posts: Post[], epoch: Epoch): string {
  const newest = posts[0]?.published ?? new Date(epoch.now);
  const url = (loc: string, lastmod: Date, changefreq: string, priority: string): string =>
    `<url>\n<loc>${escapeXml(loc)}</loc>\n<lastmod>${lastmod.toISOString()}</lastmod>\n<changefreq>${changefreq}</changefreq>\n<priority>${priority}</priority>\n</url>`;
  const entries = [
    url(canonical.home(), new Date(epoch.now), "monthly", "1"),
    url(canonical.blog(), newest, "weekly", "0.9"),
    ...posts.map((post) => url(canonical.post(post.slug), post.published, "monthly", "0.7")),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

const FEED_TEXT: Record<Language, { title: string; description: string; language: string }> = {
  en: {
    title: `${AUTHOR.name} · Blog`,
    description:
      "Articles on Rust systems, networking from raw sockets up, edge/CDN infrastructure, NixOS and performance work.",
    language: "en",
  },
  pt: {
    title: `${AUTHOR.name} · Blog`,
    description:
      "Artigos sobre sistemas em Rust, redes a partir de raw sockets, infraestrutura de edge/CDN, NixOS e trabalho de performance.",
    language: "pt-BR",
  },
};

/** Item link for a language: the canonical URL, pinned to Portuguese for the PT feed. */
function itemLink(post: Post): string {
  const url = canonical.post(post.slug);
  return post.lang === "en" ? url : `${url}?lang=${post.lang}`;
}

/** RSS 2.0 feed of the posts released in one language. */
export function rssXml(posts: Post[], epoch: Epoch, lang: Language): string {
  const text = FEED_TEXT[lang];
  const lastBuild = (posts[0]?.published ?? new Date(epoch.now)).toUTCString();
  const items = posts
    .map((post) => {
      const link = escapeXml(itemLink(post));
      const categories = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${post.published.toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
${categories}
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(text.title)}</title>
    <link>${canonical.blog()}</link>
    <description>${escapeXml(text.description)}</description>
    <language>${text.language}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${canonical.feed()}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}
