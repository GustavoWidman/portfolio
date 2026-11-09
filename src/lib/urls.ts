import { SITE_URL } from "./config";
import type { HostKind, Language } from "./config";

/**
 * URL helpers for the two host trees. Links inside a tree are root-relative and correct
 * for that host; links that leave the blog host for the portfolio are absolute canonical
 * URLs. Canonical URLs always use the main host layout (`https://guswid.com/blog/<slug>`).
 */

export function blogIndexHref(host: HostKind): string {
  return host === "main" ? "/blog" : "/";
}

export function postHref(host: HostKind, slug: string): string {
  return host === "main" ? `/blog/${slug}` : `/${slug}`;
}

/** The portfolio home: relative on the main host, absolute canonical from the blog host. */
export function homeHref(host: HostKind): string {
  return host === "main" ? "/" : `${SITE_URL}/`;
}

/** A portfolio file (résumé PDFs): relative on the main host, absolute from the blog host. */
export function portfolioFileHref(host: HostKind, path: string): string {
  return host === "main" ? path : `${SITE_URL}${path}`;
}

export function feedHref(host: HostKind): string {
  return host === "main" ? "/blog/rss.xml" : "/rss.xml";
}

export function postMarkdownHref(host: HostKind, slug: string): string {
  return `${postHref(host, slug)}.mdx`;
}

export function blogMarkdownHref(): string {
  return "/llms.mdx/blog";
}

export const canonical = {
  home: (): string => SITE_URL,
  blog: (): string => `${SITE_URL}/blog`,
  post: (slug: string): string => `${SITE_URL}/blog/${slug}`,
  postMarkdown: (slug: string): string => `${SITE_URL}/blog/${slug}.mdx`,
  feed: (): string => `${SITE_URL}/blog/rss.xml`,
  ogImage: (file: string): string => `${SITE_URL}/og/${file}`,
};

/**
 * Open Graph image of a page: `portfolio`, `blog-index` or a post slug, per language.
 * Served at `/og/<file>` from `site/<epoch>/og/<file>`, so an image exists only in the
 * epochs where its page is released.
 */
export function ogImageFile(page: string, lang: Language): string {
  return `${page}-${lang}.png`;
}

/** Output paths shared by every host and language tree of one `site/<epoch>/` directory. */
export const epochFiles = {
  ogDir: "og",
  ogImage: (file: string): string => `og/${file}`,
};

/**
 * Output file paths inside one `site/<epoch>/<host>/<lang>/` tree. HTML pages follow the
 * public URL layout of the host; machine files have fixed names the web server maps to.
 */
export const treeFiles = {
  sitemap: "sitemap.xml",
  llms: "llms.txt",
  llmsFull: "llms-full.txt",
  curl: "_curl.txt",
  console: "console.json",
  blogMarkdown: "_md/blog.md",
  postMarkdown: (slug: string): string => `_md/blog/${slug}.md`,
  feed: (host: HostKind): string => (host === "main" ? "blog/rss.xml" : "rss.xml"),
  notFound: "404.html",
};
