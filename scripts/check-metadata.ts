/**
 * Checks the head metadata and Open Graph images of every built page:
 * - title, description, canonical, robots, Open Graph and Twitter tags are present and
 *   consistent (`og:url` = canonical, `og:locale` = page language, 404 pages noindex). The
 *   page language is the tree's, except on a post page shown in its other language
 *   because the tree's own version is not released yet (`src/lib/release.ts`);
 * - every JSON-LD block parses, uses schema.org, and has the types expected for the
 *   page (home: Person + WebSite; blog: Blog + BreadcrumbList; post: BlogPosting +
 *   BreadcrumbList), with URLs that match the canonical URL and the page;
 * - the RSS and markdown alternates resolve to files of the same tree;
 * - `og:image` resolves to `dist/site/<epoch>/og/<file>`, a 1200x630 PNG, and each
 *   epoch has exactly the images of its released pages (no image of a scheduled post).
 *
 * Run after `bun run build`: `bun scripts/check-metadata.ts [dist-dir]` (default `dist/`).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { SiteManifest } from "../src/integrations/dist-layout";

const SITE = "https://guswid.com";
const SCHEMA = "https://schema.org";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = resolve(root, process.argv[2] ?? "dist");
const manifest = JSON.parse(
  readFileSync(join(dist, "site", "manifest.json"), "utf8"),
) as SiteManifest;

/** Site language of an `<html lang>` value. */
const PAGE_LANGUAGES: Record<string, string> = { en: "en", "pt-BR": "pt" };

/** Site language of a built page, from its `<html lang>`. */
function pageLanguage(file: string): string | undefined {
  return PAGE_LANGUAGES[/<html lang="([^"]+)"/.exec(readFileSync(file, "utf8"))?.[1] ?? ""];
}

const failures: string[] = [];
let pages = 0;
let jsonLdBlocks = 0;

function fail(where: string, message: string): void {
  failures.push(`${where}: ${message}`);
}

function decode(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

function attributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-z:-]+)="([^"]*)"/g)) attrs[match[1]] = decode(match[2]);
  return attrs;
}

interface Head {
  htmlLang: string;
  page: string;
  title: string;
  meta: Map<string, string[]>;
  links: Record<string, string>[];
  jsonLd: string[];
}

function parseHead(html: string): Head {
  const head = html.slice(0, html.indexOf("</head>"));
  const meta = new Map<string, string[]>();
  for (const match of head.matchAll(/<meta [^>]*>/g)) {
    const attrs = attributes(match[0]);
    const key = attrs.property ?? attrs.name;
    if (key === undefined || attrs.content === undefined) continue;
    meta.set(key, [...(meta.get(key) ?? []), attrs.content]);
  }
  return {
    htmlLang: /<html lang="([^"]+)"/.exec(html)?.[1] ?? "",
    page: /<body data-page="([^"]+)"/.exec(html)?.[1] ?? "",
    title: decode(/<title>([^<]*)<\/title>/.exec(head)?.[1] ?? ""),
    meta,
    links: [...head.matchAll(/<link [^>]*>/g)].map((match) => attributes(match[0])),
    jsonLd: [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (match) => match[1],
    ),
  };
}

function one(head: Head, key: string): string | undefined {
  return head.meta.get(key)?.[0];
}

function pngSize(path: string): { width: number; height: number } | undefined {
  const data = readFileSync(path);
  if (data.subarray(1, 4).toString("latin1") !== "PNG") return undefined;
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

function htmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(path));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

/** Tree file served for a root-relative alternate URL, or undefined if none matches. */
function alternateFile(host: string, href: string): string | undefined {
  if (href === "/llms.mdx/blog" || href === "/blog.mdx") return "_md/blog.md";
  if (href === (host === "main" ? "/blog/rss.xml" : "/rss.xml"))
    return manifest.files[`feed${host === "main" ? "Main" : "Blog"}`];
  const post = (host === "main" ? /^\/blog\/([^/]+)\.mdx$/ : /^\/([^/]+)\.mdx$/).exec(href);
  return post ? `_md/blog/${post[1]}.md` : undefined;
}

function expectedTypes(page: string): string[] {
  switch (page) {
    case "home":
      return ["Person", "WebSite"];
    case "blog":
      return ["Blog", "BreadcrumbList"];
    case "post":
      return ["BlogPosting", "BreadcrumbList"];
    default:
      return [];
  }
}

function checkJsonLd(
  where: string,
  head: Head,
  canonical: string | undefined,
  postExists: (slug: string) => boolean,
): void {
  const types: string[] = [];
  for (const raw of head.jsonLd) {
    jsonLdBlocks++;
    if (raw.includes("</") || raw.includes("<!--"))
      fail(where, "JSON-LD contains unescaped markup");
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
      fail(where, `JSON-LD does not parse: ${(error as Error).message}`);
      continue;
    }
    if (data["@context"] !== SCHEMA) fail(where, `JSON-LD @context is ${String(data["@context"])}`);
    const type = String(data["@type"]);
    types.push(type);

    if (type === "BlogPosting") {
      const image = data.image as { url?: string; width?: number; height?: number } | undefined;
      if (data.url !== canonical) fail(where, "BlogPosting url differs from canonical");
      if (!data.headline || !data.datePublished || !data.description)
        fail(where, "BlogPosting lacks headline, datePublished or description");
      if (Number.isNaN(Date.parse(String(data.datePublished))))
        fail(where, "BlogPosting datePublished is not a date");
      if (image?.url !== one(head, "og:image") || image?.width !== 1200 || image?.height !== 630)
        fail(where, "BlogPosting image differs from og:image");
      if (data.inLanguage !== head.htmlLang)
        fail(where, "BlogPosting inLanguage differs from <html lang>");
      if ((data.author as { name?: string } | undefined)?.name === undefined)
        fail(where, "BlogPosting has no author name");
    }
    if (type === "Blog") {
      if (data.url !== canonical) fail(where, "Blog url differs from canonical");
      for (const item of (data.blogPost as { url: string }[] | undefined) ?? []) {
        const slug = item.url.slice(`${SITE}/blog/`.length);
        if (!item.url.startsWith(`${SITE}/blog/`) || !postExists(slug))
          fail(where, `Blog lists ${item.url}, which is not a page of this tree`);
      }
    }
    if (type === "BreadcrumbList") {
      const items = data.itemListElement as { position: number; item: string }[];
      items.forEach((item, index) => {
        if (item.position !== index + 1) fail(where, "BreadcrumbList positions are not 1..n");
      });
      if (items.at(-1)?.item !== canonical) fail(where, "last breadcrumb is not the canonical URL");
    }
    if (type === "Person" && (!data.name || !data.url || !Array.isArray(data.sameAs)))
      fail(where, "Person lacks name, url or sameAs");
    if (type === "WebSite" && data.url !== SITE) fail(where, "WebSite url is not the site root");
  }
  const expected = expectedTypes(head.page);
  if (types.join() !== expected.join())
    fail(where, `JSON-LD types [${types.join(", ")}], expected [${expected.join(", ")}]`);
}

if (existsSync(join(dist, "static", "og"))) {
  fail("dist/static/og", "Open Graph images must live in the epoch trees, not in static/");
}
if (!manifest.og) fail("manifest.json", "no `og` entry (openGraphImages() did not run)");

for (const { name: epoch } of manifest.epochs) {
  const ogDir = join(dist, "site", epoch, "og");
  const ogFiles = new Set(existsSync(ogDir) ? readdirSync(ogDir) : []);
  const listed = manifest.og?.files[epoch] ?? [];
  if ([...ogFiles].sort().join() !== [...listed].sort().join())
    fail(`${epoch}/og`, "files differ from manifest.og.files");

  // Every image must belong to a page of this epoch, and every page needs its image.
  const expectedImages = new Set<string>();
  for (const lang of manifest.languages) {
    expectedImages.add(`portfolio-${lang}.png`);
    expectedImages.add(`blog-index-${lang}.png`);
    const blogDir = join(dist, "site", epoch, "main", lang, "blog");
    for (const entry of readdirSync(blogDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const shown = pageLanguage(join(blogDir, entry.name, "index.html")) ?? lang;
      expectedImages.add(`${entry.name}-${shown}.png`);
    }
  }
  for (const file of ogFiles) {
    if (!expectedImages.has(file))
      fail(`${epoch}/og/${file}`, "image of a page not released in this epoch");
    const size = pngSize(join(ogDir, file));
    if (size?.width !== 1200 || size.height !== 630)
      fail(`${epoch}/og/${file}`, `not a 1200x630 PNG (${JSON.stringify(size)})`);
  }
  for (const file of expectedImages) {
    if (!ogFiles.has(file)) fail(`${epoch}/og/${file}`, "missing image of a released page");
  }

  for (const host of manifest.hosts) {
    for (const lang of manifest.languages) {
      const tree = join(dist, "site", epoch, host, lang);
      const postExists = (slug: string): boolean =>
        existsSync(join(tree, host === "main" ? "blog" : "", slug, "index.html"));
      for (const file of htmlFiles(tree)) {
        pages++;
        const where = relative(dist, file);
        const head = parseHead(readFileSync(file, "utf8"));
        const canonical = head.links.find((link) => link.rel === "canonical")?.href;
        const notFound = head.page === "not-found";

        if (!head.title) fail(where, "empty <title>");
        if (!one(head, "description")) fail(where, "no meta description");
        // A post page shows the version its tree serves, which may be in the other language.
        const pageLang = head.page === "post" ? (PAGE_LANGUAGES[head.htmlLang] ?? lang) : lang;
        if (PAGE_LANGUAGES[head.htmlLang] !== pageLang)
          fail(where, `<html lang="${head.htmlLang}">`);
        if (notFound) {
          if (canonical) fail(where, "404 page has a canonical URL");
          if (one(head, "robots") !== "noindex") fail(where, "404 page is not noindex");
        } else {
          if (!canonical?.startsWith(SITE)) fail(where, `canonical ${String(canonical)}`);
          if (one(head, "og:url") !== canonical) fail(where, "og:url differs from canonical");
          if (!one(head, "robots")?.startsWith("index")) fail(where, "page is not indexable");
        }
        for (const key of [
          "og:type",
          "og:title",
          "og:description",
          "og:site_name",
          "og:image:alt",
          "twitter:card",
          "twitter:title",
          "twitter:image",
        ]) {
          if (!one(head, key)) fail(where, `missing ${key}`);
        }
        if (one(head, "og:locale") !== (pageLang === "pt" ? "pt_BR" : "en_US"))
          fail(where, "og:locale differs from the page language");
        if (one(head, "twitter:image") !== one(head, "og:image"))
          fail(where, "twitter:image differs from og:image");
        if (one(head, "og:image:width") !== "1200" || one(head, "og:image:height") !== "630")
          fail(where, "og:image size is not 1200x630");

        const image = one(head, "og:image") ?? "";
        if (!image.startsWith(`${SITE}/og/`)) fail(where, `og:image ${image}`);
        else if (!ogFiles.has(image.slice(`${SITE}/og/`.length)))
          fail(where, `og:image ${image} is not in ${epoch}/og`);
        if (head.page === "post" && !image.endsWith(`-${pageLang}.png`))
          fail(where, "post og:image is not in the page language");

        for (const link of head.links.filter((l) => l.rel === "alternate")) {
          const target = alternateFile(host, link.href);
          if (
            target === undefined ||
            !existsSync(join(tree, target)) ||
            !statSync(join(tree, target)).isFile()
          )
            fail(where, `alternate ${link.type} ${link.href} does not resolve in the tree`);
        }
        if (!head.links.some((l) => l.rel === "alternate" && l.type === "application/rss+xml"))
          fail(where, "no RSS alternate");
        if (head.page === "post" || head.page === "blog") {
          if (!head.links.some((l) => l.rel === "alternate" && l.type === "text/markdown"))
            fail(where, "no markdown alternate");
        }

        checkJsonLd(where, head, canonical, postExists);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.slice(0, 50).join("\n"));
  console.error(`\n${failures.length} metadata problem(s) in ${pages} pages`);
  process.exit(1);
}
const images = Object.values(manifest.og?.files ?? {}).reduce(
  (sum, files) => sum + files.length,
  0,
);
console.log(
  `metadata ok: ${pages} pages, ${jsonLdBlocks} JSON-LD blocks, ${images} og images across ${manifest.epochs.length} epoch(s)`,
);
