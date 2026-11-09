/**
 * Route matrix for the generated Caddy config (`dist/caddy/`). Run after `bun run build`.
 *
 * 1. Config: `caddy fmt` and `caddy validate` on the generated files, plus a production-style
 *    vhost importing the snippet by absolute path.
 * 2. Routes: starts Caddy with `dist/caddy/Caddyfile.local` (main host 127.0.0.1:4801, blog
 *    host 127.0.0.1:4802, admin 127.0.0.1:2098) and compares every answer with the file it
 *    must come from: language selection, curl card, markdown negotiation, `.mdx` and llms
 *    routes, feeds, static files, redirects, 404 pages, content types, cache, security headers.
 * 3. Epochs: builds `dist-routes/` with the posts in `scripts/fixtures/scheduled-posts`
 *    (one scheduled in 2100, two whose language versions are released three months apart),
 *    reloads Caddy with configs whose gate for the first post lies after now, before now,
 *    and 3 s after now, and checks both sides of the gate. The same build checks
 *    precompressed sidecars and ETags, that every tree serves the same version of a
 *    split-date post as page and as markdown, and the metadata of that build.
 * 4. Agreement: `wantsMarkdown()` (src/lib/agents.ts) gives the answers expected from Caddy,
 *    and in every tree of both builds a post page exists exactly when its markdown does, in
 *    the same language.
 *
 * Usage: bun scripts/check-routes.ts [--dist <dir>] [--no-epoch-build]
 *   --dist <dir>       checks another build of the same sources, e.g. the Nix `result`
 *                      (Caddy then runs with PORTFOLIO_DIST=<dir>)
 *   --no-epoch-build   reuses an existing dist-routes/
 * Exits non-zero when any check fails.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { request as httpRequest } from "node:http";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, gunzipSync, gzipSync } from "node:zlib";

import { caddySnippet, localCaddyfile } from "../src/caddy/snippet";
import { readManifest, writeEtagSidecars } from "../src/caddy/write";
import { AI_USER_AGENTS, wantsMarkdown } from "../src/lib/agents";
import type { CaddyManifest } from "../src/caddy/snippet";
import type { ChildProcess } from "node:child_process";

type Host = "main" | "blog";
type Lang = "en" | "pt";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST_FLAG = process.argv.indexOf("--dist");
/** Build under test; without `--dist`, the local Caddyfile's default root (`dist`) is used. */
const DIST_ARG = DIST_FLAG >= 0 ? process.argv[DIST_FLAG + 1] : undefined;
const DIST = DIST_ARG ? resolve(DIST_ARG) : join(ROOT, "dist");
const EPOCH_DIST = join(ROOT, "dist-routes");
const FIXTURE_POSTS = join(ROOT, "scripts", "fixtures", "scheduled-posts");
const FIXTURE_SLUG = "route-check";
const FIXTURE_TITLE: Record<Lang, string> = {
  en: "Route check fixture",
  pt: "Post de teste das rotas",
};

/** Fixture posts whose language versions are released at different instants. */
interface SplitPost {
  slug: string;
  /** Language released at `SPLIT_FIRST`; the other follows at `SPLIT_SECOND`. */
  first: Lang;
  title: Record<Lang, string>;
}
const SPLIT_POSTS: SplitPost[] = [
  {
    slug: "release-pt-first",
    first: "pt",
    title: {
      en: "Release fixture, Portuguese first (English)",
      pt: "Fixture de lançamento, português primeiro",
    },
  },
  {
    slug: "release-en-first",
    first: "en",
    title: {
      en: "Release fixture, English first",
      pt: "Fixture de lançamento, inglês primeiro (português)",
    },
  },
];
const SPLIT_FIRST = Date.parse("2100-03-01T00:00:00-03:00") / 1000;
const SPLIT_SECOND = Date.parse("2100-06-01T00:00:00-03:00") / 1000;
const CADDY = process.env.CADDY ?? "caddy";
const ADMIN = "127.0.0.1:2098";
const PORTS: Record<Host, number> = { main: 4801, blog: 4802 };
const HOST_HEADER: Record<Host, string> = { main: "guswid.com", blog: "blog.guswid.com" };
const HTML_LANG: Record<Lang, string> = { en: "en", pt: "pt-BR" };
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const BROWSER_ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const CURL_UA = "curl/8.7.1";

const TYPE = {
  html: "text/html; charset=utf-8",
  markdown: "text/markdown; charset=utf-8",
  text: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  rss: "application/rss+xml; charset=utf-8",
};
/** Tree answers depend on language, epoch and format: browsers revalidate, shared caches never store. */
const NO_CACHE = "private, no-cache";
const STATIC_CACHE = "public, max-age=3600";
const IMMUTABLE = "public, max-age=31536000, immutable";
const LANG_VARY = ["Cookie", "Accept-Language"];
const AGENT_VARY = ["Cookie", "Accept-Language", "User-Agent", "Accept"];
const HOSTS = ["main", "blog"] as const;
const LANGS = ["en", "pt"] as const;

const agentUserAgent = (token: string): string => `Mozilla/5.0 (compatible; ${token}/1.0)`;

/**
 * Markdown negotiation on a post URL: query, request headers (User-Agent defaults to a
 * browser), and whether markdown is served. Caddy and `wantsMarkdown()` are both checked
 * against this table.
 */
const NEGOTIATION: [string, Record<string, string>, boolean][] = [
  ["?format=markdown", {}, true],
  ["?raw=true", {}, true],
  ["?format=html", {}, false],
  ["?raw=false", {}, false],
  ["", { Accept: "text/markdown" }, true],
  ["", { Accept: "text/plain" }, true],
  ["", { Accept: "TEXT/MARKDOWN" }, true],
  ["", { Accept: "text/markdown, */*" }, true],
  ["", { Accept: "text/html, text/markdown" }, true],
  ["", { Accept: "text/html, text/plain;q=0.9" }, true],
  ["", { Accept: "text/html, text/markdown;q=0.9, */*;q=0.8" }, false],
  ["", { Accept: BROWSER_ACCEPT }, false],
  ["", { Accept: "*/*" }, false],
  ["", { "User-Agent": "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)" }, true],
  ["", { "User-Agent": "claudebot/1.0" }, true],
  ["", { "User-Agent": "Google-Extended" }, false],
  ["", { "User-Agent": "Mozilla/5.0 (compatible; Applebot-Extended/0.1)" }, false],
  ...AI_USER_AGENTS.map((token): [string, Record<string, string>, boolean] => [
    "",
    { "User-Agent": agentUserAgent(token) },
    true,
  ]),
];

// ---------------------------------------------------------------------------------------
// HTTP

interface Answer {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}

interface Request {
  host: Host;
  path: string;
  method?: string;
  /** A list is sent as one field line per value. */
  headers?: Record<string, string | string[]>;
}

function send({ host, path, method = "GET", headers = {} }: Request): Promise<Answer> {
  return new Promise((resolvePromise, reject) => {
    const req = httpRequest(
      {
        host: "127.0.0.1",
        port: PORTS[host],
        path,
        method,
        agent: false,
        headers: { Host: HOST_HEADER[host], "User-Agent": BROWSER_UA, ...headers },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const flat: Record<string, string> = {};
          for (const [name, value] of Object.entries(res.headers)) {
            if (value !== undefined) flat[name] = Array.isArray(value) ? value.join(", ") : value;
          }
          resolvePromise({
            status: res.statusCode ?? 0,
            headers: flat,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(10_000, () => req.destroy(new Error("timeout")));
    req.end();
  });
}

// ---------------------------------------------------------------------------------------
// Expectations

interface Expect {
  status: number;
  /** The body must equal this file byte for byte. */
  file?: string;
  /** The body must equal these bytes. */
  bytes?: Buffer;
  location?: string;
  /** Exact Content-Type, or a pattern where the OS MIME table decides (JS, CSS). */
  type?: string | RegExp;
  cache?: string;
  /** Tokens that must appear in Vary. */
  vary?: string[];
  /** Tokens that must not appear in Vary. */
  varyNot?: string[];
  /** `<html lang>` of the served page. */
  lang?: Lang;
  includes?: string[];
  excludes?: string[];
  /** Exact header values; `null` means the header must be absent. */
  headers?: Record<string, string | null>;
  emptyBody?: boolean;
}

interface Case {
  group: string;
  request: Request;
  expect: Expect;
  note?: string;
}

interface Result {
  group: string;
  ok: boolean;
  line: string;
  problems: string[];
}

const SECURITY: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
};

function varyTokens(value: string | undefined): string[] {
  return (value ?? "").split(",").map((token) => token.trim().toLowerCase());
}

function preview(buffer: Buffer): string {
  return JSON.stringify(buffer.subarray(0, 60).toString("utf8"));
}

function evaluate(answer: Answer, expect: Expect): string[] {
  const problems: string[] = [];
  const { headers } = answer;
  if (answer.status !== expect.status) problems.push(`status ${answer.status}`);
  for (const [name, value] of Object.entries(SECURITY)) {
    if (headers[name] !== value) problems.push(`${name}=${headers[name] ?? "(missing)"}`);
  }
  if (!headers["permissions-policy"]) problems.push("permissions-policy missing");
  if (headers.server !== undefined) problems.push(`server=${headers.server}`);
  if (headers["last-modified"] !== undefined)
    problems.push(`last-modified=${headers["last-modified"]}`);
  if (expect.location !== undefined && headers.location !== expect.location) {
    problems.push(`location=${headers.location ?? "(missing)"}`);
  }
  if (expect.type !== undefined) {
    const type = headers["content-type"] ?? "";
    const ok = typeof expect.type === "string" ? type === expect.type : expect.type.test(type);
    if (!ok) problems.push(`content-type=${type || "(missing)"}`);
  }
  if (expect.cache !== undefined && headers["cache-control"] !== expect.cache) {
    problems.push(`cache-control=${headers["cache-control"] ?? "(missing)"}`);
  }
  const vary = varyTokens(headers.vary);
  for (const token of expect.vary ?? []) {
    if (!vary.includes(token.toLowerCase())) problems.push(`vary lacks ${token} (${headers.vary})`);
  }
  for (const token of expect.varyNot ?? []) {
    if (vary.includes(token.toLowerCase())) problems.push(`vary has ${token}`);
  }
  for (const [name, value] of Object.entries(expect.headers ?? {})) {
    const actual = headers[name.toLowerCase()];
    if (value === null ? actual !== undefined : actual !== value) {
      problems.push(`${name}=${actual ?? "(missing)"}`);
    }
  }
  const expectedBody = expect.bytes ?? (expect.file ? readFileSync(expect.file) : undefined);
  if (expectedBody && !answer.body.equals(expectedBody)) {
    problems.push(`body differs (${answer.body.length} B ${preview(answer.body)})`);
  }
  const text = answer.body.toString("utf8");
  if (expect.lang !== undefined) {
    const lang = /<html[^>]*\slang="([^"]*)"/.exec(text)?.[1];
    if (lang !== HTML_LANG[expect.lang]) problems.push(`html lang=${lang ?? "(none)"}`);
  }
  for (const needle of expect.includes ?? []) {
    if (!text.includes(needle)) problems.push(`body lacks ${JSON.stringify(needle)}`);
  }
  for (const needle of expect.excludes ?? []) {
    if (text.includes(needle)) problems.push(`body has ${JSON.stringify(needle)}`);
  }
  if (expect.emptyBody && answer.body.length > 0) problems.push(`body ${answer.body.length} B`);
  return problems;
}

function describe(test: Case, base: string): string {
  const { request, expect } = test;
  const extra = Object.entries(request.headers ?? {})
    .map(([name, value]) => {
      const text = Array.isArray(value) ? value.join(" | ") : value;
      return `${name}: ${text.length > 34 ? `${text.slice(0, 31)}...` : text}`;
    })
    .join("; ");
  const req = `${request.method ?? "GET"} ${request.path}${extra ? `  [${extra}]` : ""}`;
  const target =
    expect.location !== undefined
      ? `-> ${expect.location}`
      : expect.file
        ? relative(base, expect.file)
        : (test.note ?? "");
  return `${request.host.padEnd(4)}  ${req.padEnd(78)}  ${expect.status} ${target}`;
}

async function run(cases: Case[], base: string): Promise<Result[]> {
  const results: Result[] = [];
  for (const test of cases) {
    let problems: string[];
    try {
      problems = evaluate(await send(test.request), test.expect);
    } catch (error) {
      problems = [`request failed: ${(error as Error).message}`];
    }
    results.push({
      group: test.group,
      ok: problems.length === 0,
      line: describe(test, base),
      problems,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------------------
// Build trees

interface Trees {
  dist: string;
  epoch: string;
  tree: (host: Host, lang: Lang, epoch?: string) => string;
}

function currentEpoch(manifest: CaddyManifest, now: number): string {
  const passed = manifest.epochs.filter((epoch) => epoch.start <= now);
  return (passed.at(-1) ?? manifest.epochs[0]).name;
}

function trees(dist: string, epoch: string): Trees {
  return {
    dist,
    epoch,
    tree: (host, lang, name = epoch) => join(dist, "site", name, host, lang),
  };
}

/** A page file: `page` is "home", "blog" (the index) or a post slug. */
function htmlPage(t: Trees, host: Host, lang: Lang, page: string, epoch?: string): string {
  const tree = t.tree(host, lang, epoch);
  if (page === "home") return join(tree, "index.html");
  if (page === "blog") return join(tree, host === "main" ? "blog/index.html" : "index.html");
  return join(tree, host === "main" ? `blog/${page}/index.html` : `${page}/index.html`);
}

/** A released slug whose EN and PT markdown differ, so language selection is observable. */
function pickSlug(t: Trees): string {
  const dir = join(t.tree("main", "en"), "blog");
  const slugs = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const slug of slugs) {
    const en = readFileSync(join(t.tree("main", "en"), "_md/blog", `${slug}.md`));
    const pt = readFileSync(join(t.tree("main", "pt"), "_md/blog", `${slug}.md`));
    if (!en.equals(pt)) return slug;
  }
  throw new Error("no released post has distinct EN and PT versions");
}

function firstFile(dir: string, pattern: RegExp): string {
  const name = readdirSync(dir).find((file) => pattern.test(file));
  if (!name) throw new Error(`no file matching ${pattern} in ${dir}`);
  return name;
}

// ---------------------------------------------------------------------------------------
// Route matrix on dist/

function routeCases(t: Trees): Case[] {
  const slug = pickSlug(t);
  const md = (host: Host, lang: Lang, name: string | null): string =>
    join(t.tree(host, lang), name === null ? "_md/blog.md" : `_md/blog/${name}.md`);
  const notFound = (host: Host, lang: Lang): string => join(t.tree(host, lang), "404.html");
  const postPath = (host: Host, name = slug): string =>
    host === "main" ? `/blog/${name}` : `/${name}`;
  const indexPath = (host: Host): string => (host === "main" ? "/blog" : "/");
  const cases: Case[] = [];
  const add = (group: string, request: Request, expect: Expect, note?: string): void => {
    cases.push({ group, request, expect, note });
  };
  const html = (host: Host, lang: Lang, page: string, vary = AGENT_VARY): Expect => ({
    status: 200,
    file: htmlPage(t, host, lang, page),
    lang,
    type: TYPE.html,
    cache: NO_CACHE,
    vary,
  });
  const markdown = (host: Host, lang: Lang, name: string | null, agentVary = true): Expect => ({
    status: 200,
    file: md(host, lang, name),
    type: TYPE.markdown,
    cache: NO_CACHE,
    vary: agentVary ? AGENT_VARY : LANG_VARY,
  });
  const missing = (host: Host, lang: Lang = "en"): Expect => ({
    status: 404,
    file: notFound(host, lang),
    lang,
    type: TYPE.html,
    cache: NO_CACHE,
    vary: LANG_VARY,
  });
  const moved = (location: string): Expect => ({ status: 301, location });

  // Pages and language selection.
  for (const host of ["main", "blog"] as const) {
    const pages: [string, string][] =
      host === "main"
        ? [
            ["/", "home"],
            ["/blog", "blog"],
            [postPath(host), slug],
          ]
        : [
            ["/", "blog"],
            [postPath(host), slug],
          ];
    for (const [path, page] of pages) {
      add("pages", { host, path, headers: { Accept: BROWSER_ACCEPT } }, html(host, "en", page));
    }
    const home = host === "main" ? "home" : "blog";
    const lang: [Record<string, string | string[]>, string, Lang][] = [
      [{ "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" }, "/", "pt"],
      [{ "Accept-Language": "pt" }, "/", "pt"],
      [{ "Accept-Language": "PT-br" }, "/", "pt"],
      [{ "Accept-Language": "en-US,en;q=0.9,pt;q=0.8" }, "/", "en"],
      [{ "Accept-Language": "es-ES,pt;q=0.9" }, "/", "en"],
      [{ "Accept-Language": "ptx" }, "/", "en"],
      [{ "Accept-Language": ["en", "pt"] }, "/", "en"],
      [{ "Accept-Language": ["pt-BR", "en"] }, "/", "pt"],
      [{ Cookie: "portfolio_lang=pt" }, "/", "pt"],
      [{ Cookie: "a=1; portfolio_lang=pt; b=2" }, "/", "pt"],
      [{ Cookie: "portfolio_lang=en", "Accept-Language": "pt-BR" }, "/", "en"],
      [{ Cookie: "portfolio_lang=fr", "Accept-Language": "pt-BR" }, "/", "pt"],
      [{ Cookie: "portfolio_lang=pt" }, "/?lang=en", "en"],
      [{ Cookie: "portfolio_lang=en" }, "/?lang=pt", "pt"],
      [{ "Accept-Language": "pt-BR" }, "/?lang=en", "en"],
      [{ Cookie: "portfolio_lang=pt" }, "/?lang=xx", "pt"],
      [{}, "/?lang=pt", "pt"],
    ];
    for (const [headers, path, expected] of lang) {
      add("language", { host, path, headers }, html(host, expected, home));
    }
    add("language", { host, path: `${postPath(host)}?lang=pt` }, html(host, "pt", slug));
    add(
      "language",
      { host, path: postPath(host), headers: { "Accept-Language": "pt-BR" } },
      html(host, "pt", slug),
    );
    add(
      "pages",
      { host, path: postPath(host), method: "HEAD" },
      {
        status: 200,
        type: TYPE.html,
        cache: NO_CACHE,
        emptyBody: true,
      },
    );
  }

  // curl card.
  const curl = (host: Host, lang: Lang): Expect => ({
    status: 200,
    file: join(t.tree(host, lang), "_curl.txt"),
    type: TYPE.text,
    cache: NO_CACHE,
    vary: ["User-Agent", "Cookie"],
  });
  add("curl", { host: "main", path: "/", headers: { "User-Agent": CURL_UA } }, curl("main", "en"));
  add(
    "curl",
    { host: "main", path: "/index", headers: { "User-Agent": CURL_UA } },
    curl("main", "en"),
  );
  add(
    "curl",
    { host: "main", path: "/?lang=pt", headers: { "User-Agent": CURL_UA } },
    curl("main", "pt"),
  );
  add(
    "curl",
    { host: "main", path: "/", headers: { "User-Agent": CURL_UA, Cookie: "portfolio_lang=pt" } },
    curl("main", "pt"),
  );
  add("curl", { host: "blog", path: "/", headers: { "User-Agent": CURL_UA } }, curl("blog", "en"));
  add(
    "curl",
    { host: "blog", path: "/?lang=pt", headers: { "User-Agent": CURL_UA } },
    curl("blog", "pt"),
  );
  add("curl", { host: "main", path: "/index" }, missing("main"), "browser on /index");
  add(
    "curl",
    { host: "main", path: "/blog", headers: { "User-Agent": CURL_UA } },
    html("main", "en", "blog"),
  );
  add(
    "curl",
    { host: "blog", path: "/", headers: { "User-Agent": CURL_UA, Accept: "text/markdown" } },
    markdown("blog", "en", null),
    "explicit markdown wins over the card",
  );

  // Markdown negotiation on the blog index and posts.
  for (const host of ["main", "blog"] as const) {
    const post = postPath(host);
    const index = indexPath(host);
    for (const [query, headers, wanted] of NEGOTIATION) {
      add(
        "negotiation",
        { host, path: `${post}${query}`, headers },
        wanted ? markdown(host, "en", slug) : html(host, "en", slug),
      );
    }
    add("negotiation", { host, path: `${index}?format=markdown` }, markdown(host, "en", null));
    add(
      "negotiation",
      { host, path: index, headers: { "User-Agent": "PerplexityBot/1.0" } },
      markdown(host, "en", null),
    );
    add(
      "negotiation",
      { host, path: index, headers: { Accept: "text/markdown" } },
      markdown(host, "en", null),
    );
    add(
      "negotiation",
      { host, path: `${post}?format=markdown&lang=pt` },
      markdown(host, "pt", slug),
    );
    add(
      "negotiation",
      { host, path: `${post}?raw=true`, headers: { Cookie: "portfolio_lang=pt" } },
      markdown(host, "pt", slug),
    );
    add(
      "negotiation",
      { host, path: post, headers: { Accept: "text/markdown", "Accept-Language": "pt-BR" } },
      markdown(host, "pt", slug),
    );
    add(
      "negotiation",
      { host, path: `${postPath(host, "no-such-post")}?format=markdown` },
      missing(host),
    );
    add(
      "negotiation",
      {
        host,
        path: host === "main" ? "/llms.txt" : "/rss.xml",
        headers: { "User-Agent": "GPTBot/1.2" },
      },
      {
        status: 200,
        file: join(t.tree(host, "en"), host === "main" ? "llms.txt" : "rss.xml"),
        type: host === "main" ? TYPE.text : TYPE.rss,
      },
      "machine files are not negotiated",
    );
  }
  add(
    "negotiation",
    { host: "main", path: "/?format=markdown" },
    html("main", "en", "home"),
    "home is never negotiated",
  );

  // .mdx and llms routes.
  for (const host of ["main", "blog"] as const) {
    add("mdx", { host, path: "/blog.mdx" }, markdown(host, "en", null, false));
    add("mdx", { host, path: "/llms.mdx/blog" }, markdown(host, "en", null, false));
    add(
      "mdx",
      { host, path: "/blog.mdx", headers: { Cookie: "portfolio_lang=pt" } },
      markdown(host, "pt", null, false),
    );
    add("mdx", { host, path: `/llms.mdx/blog/${slug}` }, markdown(host, "en", slug, false));
    add("mdx", { host, path: `/llms.mdx/blog/${slug}?lang=pt` }, markdown(host, "pt", slug, false));
    add(
      "mdx",
      { host, path: `/llms.mdx/blog/${slug}`, headers: { "Accept-Language": "pt-BR,pt;q=0.9" } },
      markdown(host, "pt", slug, false),
    );
    add("mdx", { host, path: `${postPath(host)}.mdx` }, markdown(host, "en", slug, false));
    add(
      "mdx",
      { host, path: `${postPath(host)}.mdx`, headers: { Cookie: "portfolio_lang=pt" } },
      markdown(host, "pt", slug, false),
    );
    add("mdx", { host, path: `${postPath(host, "no-such-post")}.mdx` }, missing(host));
    add("mdx", { host, path: "/llms.mdx/blog/no-such-post" }, missing(host));
    for (const [path, file, type] of [
      ["/llms.txt", "llms.txt", TYPE.text],
      ["/llms-full.txt", "llms-full.txt", TYPE.text],
      ["/sitemap.xml", "sitemap.xml", TYPE.xml],
    ] as const) {
      add(
        "machine",
        { host, path },
        {
          status: 200,
          file: join(t.tree(host, "en"), file),
          type,
          cache: NO_CACHE,
          vary: LANG_VARY,
          varyNot: ["User-Agent"],
        },
      );
    }
    // The console's data, in the language the page asks for.
    for (const lang of ["en", "pt"] as const) {
      add(
        "machine",
        { host, path: `/console.json?lang=${lang}` },
        {
          status: 200,
          file: join(t.tree(host, lang), "console.json"),
          type: /^application\/json(;|$)/,
          cache: NO_CACHE,
          vary: LANG_VARY,
        },
      );
    }
    const feed = host === "main" ? "blog/rss.xml" : "rss.xml";
    for (const lang of ["en", "pt"] as const) {
      add(
        "machine",
        { host, path: `/${feed}`, headers: { Cookie: `portfolio_lang=${lang}` } },
        {
          status: 200,
          file: join(t.tree(host, lang), feed),
          type: TYPE.rss,
          cache: NO_CACHE,
        },
      );
    }
  }
  add("mdx", { host: "main", path: `/${slug}.mdx` }, missing("main"), "blog-host path on main");
  add("machine", { host: "main", path: "/rss.xml" }, missing("main"), "blog-host feed on main");

  // Static files and hashed assets, on both hosts.
  const staticDir = join(t.dist, "static");
  const astroDir = join(t.dist, "_astro");
  const ogDir = join(t.dist, "site", t.epoch, "og");
  const font = firstFile(astroDir, /\.woff2$/);
  const js = firstFile(astroDir, /^client\..+\.js$/);
  const image = firstFile(astroDir, /\.avif$/);
  const og = existsSync(ogDir) ? firstFile(ogDir, /\.png$/) : undefined;
  for (const host of ["main", "blog"] as const) {
    for (const [name, type] of [
      ["favicon.svg", "image/svg+xml"],
      ["robots.txt", TYPE.text],
      ["resume-en.pdf", "application/pdf"],
      ["resume-pt.pdf", "application/pdf"],
    ] as const) {
      add(
        "static",
        { host, path: `/${name}` },
        {
          status: 200,
          file: join(staticDir, name),
          type,
          cache: STATIC_CACHE,
          varyNot: ["Cookie"],
        },
      );
    }
    for (const [name, type] of [
      [font, "font/woff2"],
      [js, /^(text|application)\/javascript(;|$)/],
      [image, "image/avif"],
    ] as const) {
      add(
        "assets",
        { host, path: `/_astro/${name}` },
        { status: 200, file: join(astroDir, name), type, cache: IMMUTABLE },
      );
    }
    if (og) {
      add(
        "static",
        { host, path: `/og/${og}` },
        {
          status: 200,
          file: join(ogDir, og),
          type: "image/png",
          cache: STATIC_CACHE,
        },
      );
    }
    add("static", { host, path: "/og/no-such-image.png" }, missing(host));
    add(
      "assets",
      { host, path: "/_astro/no-such-file.js" },
      missing(host),
      "404 must not be immutable",
    );
  }

  // Redirects.
  for (const [path, location] of [
    ["/blog", "/"],
    ["/blog/", "/"],
    ["/blog?lang=pt", "/?lang=pt"],
    [`/blog/${slug}`, `/${slug}`],
    [`/blog/${slug}/`, `/${slug}`],
    [`/blog/${slug}?lang=pt&utm_source=x`, `/${slug}?lang=pt&utm_source=x`],
    [`/blog/${slug}.mdx`, `/${slug}.mdx`],
    ["/blog/rss.xml", "/rss.xml"],
    ["/blog//evil.example", "/evil.example"],
  ] as const) {
    add("redirects", { host: "blog", path }, moved(location));
  }
  add("redirects", { host: "blog", path: "/blogroll" }, missing("blog"), "not a /blog path");
  for (const host of ["main", "blog"] as const) {
    const post = postPath(host);
    add("redirects", { host, path: `${post}/` }, moved(post));
    add("redirects", { host, path: `${post}/?lang=pt` }, moved(`${post}?lang=pt`));
    add("redirects", { host, path: "/llms.mdx/blog/" }, moved("/llms.mdx/blog"));
    add("redirects", { host, path: "/index.html" }, moved("/"));
    add("redirects", { host, path: `${post}/index.html?lang=pt` }, moved(`${post}?lang=pt`));
    add("redirects", { host, path: "//evil.example/" }, moved("/evil.example"), "no open redirect");
    add(
      "redirects",
      { host, path: "/%2F%2Fevil.example/" },
      moved("/evil.example"),
      "no open redirect",
    );
    add("redirects", { host, path: "/\\evil.example/" }, missing(host), "backslash refused");
    add("redirects", { host, path: "/%5Cevil.example/" }, missing(host), "backslash refused");
    // Browsers drop TAB, CR and LF from a Location, so "/<TAB>/host" would read as "//host".
    for (const path of [
      "/%09/evil.example/",
      "/%09%09/evil.example/",
      "/%0A/evil.example/",
      "/%0D/evil.example/",
      "/%0D%0A/evil.example/",
      "/%01/evil.example/",
      "/%1F/evil.example/",
      "/%7F/evil.example/",
      "/%09/evil.example/index.html",
      "/./%09/evil.example/",
    ]) {
      add("redirects", { host, path }, missing(host), "control character refused");
    }
    add(
      "redirects",
      { host, path: "/%2509/evil.example/" },
      moved("/%09/evil.example"),
      "an encoded % stays encoded",
    );
  }
  for (const path of ["/blog/%09/evil.example", "/blog/%09/evil.example/", "/blog/%0A/x"]) {
    add("redirects", { host: "blog", path }, missing("blog"), "control character refused");
  }
  add("redirects", { host: "main", path: "/blog/" }, moved("/blog"));
  add("redirects", { host: "main", path: "/blog/index.html" }, moved("/blog"));

  // Not found and internal files.
  for (const host of ["main", "blog"] as const) {
    add("404", { host, path: "/no-such-page" }, missing(host, "en"));
    add(
      "404",
      { host, path: "/no-such-page", headers: { "Accept-Language": "pt-BR" } },
      missing(host, "pt"),
    );
    add("404", { host, path: "/no-such-page?lang=pt" }, missing(host, "pt"));
    add(
      "404",
      { host, path: "/no-such-page", headers: { Cookie: "portfolio_lang=pt" } },
      missing(host, "pt"),
    );
    add("404", { host, path: postPath(host, "no-such-post") }, missing(host));
    for (const path of [
      "/_md/blog.md",
      `/_md/blog/${slug}.md`,
      "/_MD/blog.md",
      "/_md",
      "/_curl.txt",
      "/404.html",
      "/llms.txt.etag",
      "/favicon.svg.etag",
    ]) {
      add("internal", { host, path }, missing(host));
    }
    add(
      "404",
      { host, path: "/", method: "POST" },
      { status: 405, cache: "no-store" },
      "other errors",
    );
  }
  add("404", { host: "main", path: `/${slug}` }, missing("main"), "blog-host path on main");

  // Validators and on-the-fly compression.
  const llms = join(t.tree("main", "en"), "llms.txt");
  const etag = readFileSync(`${llms}.etag`, "utf8");
  add(
    "etag",
    { host: "main", path: "/llms.txt" },
    { status: 200, file: llms, headers: { ETag: etag } },
  );
  add(
    "etag",
    { host: "main", path: "/llms.txt", headers: { "If-None-Match": etag } },
    { status: 304, emptyBody: true },
  );
  add(
    "etag",
    { host: "main", path: "/llms.txt", headers: { "If-None-Match": '"stale"' } },
    { status: 200, file: llms },
  );
  add(
    "etag",
    {
      host: "main",
      path: "/llms.txt",
      headers: { "If-Modified-Since": "Fri, 01 Jan 2100 00:00:00 GMT" },
    },
    { status: 200, file: llms },
    "dates are not validators",
  );
  add(
    "etag",
    { host: "main", path: "/favicon.svg" },
    {
      status: 200,
      headers: { ETag: readFileSync(join(staticDir, "favicon.svg.etag"), "utf8") },
    },
  );
  return cases;
}

/** On-the-fly compression: the body must decompress to the page and revalidate by ETag. */
async function encodingChecks(t: Trees): Promise<Result[]> {
  const file = htmlPage(t, "main", "en", "blog");
  const headers = { "Accept-Encoding": "gzip" };
  const problems: string[] = [];
  let etag = "";
  try {
    const answer = await send({ host: "main", path: "/blog", headers });
    etag = answer.headers.etag ?? "";
    if (answer.headers["content-encoding"] !== "gzip") {
      problems.push(`content-encoding=${answer.headers["content-encoding"] ?? "(none)"}`);
    } else if (!gunzipSync(answer.body).equals(readFileSync(file))) {
      problems.push("decompressed body differs");
    }
    if (!varyTokens(answer.headers.vary).includes("accept-encoding")) {
      problems.push("vary lacks Accept-Encoding");
    }
    if (!etag) problems.push("no ETag");
  } catch (error) {
    problems.push((error as Error).message);
  }
  const first: Result = {
    group: "encoding",
    ok: problems.length === 0,
    line: `${"main  GET /blog  [Accept-Encoding: gzip]".padEnd(86)}200 gzip of ${relative(t.dist, file)}`,
    problems,
  };
  const revalidate = await run(
    [
      {
        group: "encoding",
        request: { host: "main", path: "/blog", headers: { ...headers, "If-None-Match": etag } },
        expect: { status: 304, emptyBody: true },
        note: `revalidated with ${etag}`,
      },
    ],
    t.dist,
  );
  return [first, ...revalidate];
}

// ---------------------------------------------------------------------------------------
// Epoch gate on dist-routes/

function buildEpochDist(): void {
  const result = spawnSync(
    process.execPath,
    ["--bun", "x", "astro", "build", "--outDir", relative(ROOT, EPOCH_DIST)],
    {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      env: {
        ...process.env,
        ASTRO_TELEMETRY_DISABLED: "1",
        PORTFOLIO_EXTRA_POSTS_DIR: FIXTURE_POSTS,
      },
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `fixture build failed:\n${(result.stdout + result.stderr).split("\n").slice(-30).join("\n")}`,
    );
  }
}

/** Precompressed variants for the encoding checks; ETag sidecars are refreshed afterwards. */
function writePrecompressed(dist: string, epoch: string): { file: string; robots: string } {
  const file = join(dist, "site", epoch, "main", "en", "llms.txt");
  const robots = join(dist, "static", "robots.txt");
  for (const path of [file, robots]) {
    const raw = readFileSync(path);
    writeFileSync(`${path}.gz`, gzipSync(raw, { level: 9 }));
    writeFileSync(`${path}.br`, brotliCompressSync(raw));
  }
  writeEtagSidecars(dist);
  return { file, robots };
}

function epochCases(t: Trees, side: "before" | "after", group: string): Case[] {
  const visible = side === "after";
  const slug = FIXTURE_SLUG;
  const cases: Case[] = [];
  const add = (request: Request, expect: Expect, note?: string): void => {
    cases.push({ group, request, expect, note });
  };
  const notFound = (host: Host): Expect => ({
    status: 404,
    file: join(t.tree(host, "en"), "404.html"),
  });
  // Machine files link the post by URL; the curl card lists it by title.
  const presence = (file: string): Pick<Expect, "includes" | "excludes"> => {
    const needle = file === "_curl.txt" ? FIXTURE_TITLE.en : slug;
    return visible ? { includes: [needle] } : { excludes: [needle] };
  };
  for (const host of ["main", "blog"] as const) {
    const post = host === "main" ? `/blog/${slug}` : `/${slug}`;
    const page = htmlPage(t, host, "en", slug);
    const mdFile = join(t.tree(host, "en"), `_md/blog/${slug}.md`);
    add(
      { host, path: post },
      visible ? { status: 200, file: page, includes: [FIXTURE_TITLE.en] } : notFound(host),
    );
    add(
      { host, path: `${post}?lang=pt` },
      visible
        ? { status: 200, file: htmlPage(t, host, "pt", slug), includes: [FIXTURE_TITLE.pt] }
        : { status: 404, file: join(t.tree(host, "pt"), "404.html") },
    );
    add({ host, path: `${post}.mdx` }, visible ? { status: 200, file: mdFile } : notFound(host));
    add(
      { host, path: `/llms.mdx/blog/${slug}` },
      visible ? { status: 200, file: mdFile } : notFound(host),
    );
    add(
      { host, path: post, headers: { "User-Agent": "GPTBot/1.2" } },
      visible ? { status: 200, file: mdFile } : notFound(host),
    );
    add(
      { host, path: `/og/${slug}-en.png` },
      visible
        ? { status: 200, file: join(t.dist, "site", t.epoch, "og", `${slug}-en.png`) }
        : notFound(host),
    );
    const index = htmlPage(t, host, "en", "blog");
    add(
      { host, path: host === "main" ? "/blog" : "/" },
      visible
        ? { status: 200, file: index, includes: [`href="${post}"`] }
        : {
            status: 200,
            file: index,
            includes: ["data-countdown", FIXTURE_TITLE.en],
            excludes: [`href="${post}"`],
          },
      visible ? "listed with a link" : "countdown card, no link",
    );
    const feed = host === "main" ? "blog/rss.xml" : "rss.xml";
    for (const file of [
      "llms.txt",
      "llms-full.txt",
      "sitemap.xml",
      feed,
      "_md/blog.md",
      "_curl.txt",
    ]) {
      const path = file === "_md/blog.md" ? "/blog.mdx" : file === "_curl.txt" ? "/" : `/${file}`;
      const headers = file === "_curl.txt" ? { "User-Agent": CURL_UA } : undefined;
      add(
        { host, path, headers },
        { status: 200, file: join(t.tree(host, "en"), file), ...presence(file) },
      );
    }
  }
  return cases;
}

function precompressedCases(files: { file: string; robots: string }): Case[] {
  const etagOf = (path: string): string => readFileSync(`${path}.etag`, "utf8");
  const group = "precompressed";
  const { file, robots } = files;
  return [
    {
      group,
      request: { host: "main", path: "/llms.txt", headers: { "Accept-Encoding": "gzip" } },
      expect: {
        status: 200,
        bytes: readFileSync(`${file}.gz`),
        type: TYPE.text,
        vary: ["Accept-Encoding"],
        headers: { "Content-Encoding": "gzip", ETag: etagOf(`${file}.gz`) },
      },
      note: "llms.txt.gz",
    },
    {
      group,
      request: { host: "main", path: "/llms.txt", headers: { "Accept-Encoding": "gzip, br" } },
      expect: {
        status: 200,
        bytes: readFileSync(`${file}.br`),
        headers: { "Content-Encoding": "br" },
      },
      note: "llms.txt.br (preferred over gzip)",
    },
    {
      group,
      request: { host: "main", path: "/llms.txt" },
      expect: { status: 200, file, headers: { "Content-Encoding": null, ETag: etagOf(file) } },
      note: "identity",
    },
    {
      group,
      request: {
        host: "main",
        path: "/llms.txt",
        headers: { "Accept-Encoding": "gzip", "If-None-Match": etagOf(`${file}.gz`) },
      },
      expect: { status: 304, emptyBody: true },
      note: "revalidated with the gzip ETag",
    },
    {
      group,
      request: { host: "blog", path: "/robots.txt", headers: { "Accept-Encoding": "gzip" } },
      expect: {
        status: 200,
        bytes: readFileSync(`${robots}.gz`),
        type: TYPE.text,
        headers: { "Content-Encoding": "gzip" },
      },
      note: "static/robots.txt.gz",
    },
  ];
}

// ---------------------------------------------------------------------------------------
// Agreement checks (files and reference code, no server)

function result(group: string, line: string, problems: string[]): Result {
  return { group, ok: problems.length === 0, line, problems };
}

/** `wantsMarkdown()` must answer every negotiation case the way Caddy is expected to. */
function referenceResults(): Result[] {
  return NEGOTIATION.map(([query, headers, wanted]) => {
    const params = new URLSearchParams(query.slice(1));
    const actual = wantsMarkdown({
      userAgent: headers["User-Agent"] ?? BROWSER_UA,
      accept: headers.Accept ?? null,
      format: params.get("format"),
      raw: params.get("raw"),
    });
    const request = Object.entries(headers)
      .map(([name, value]) => `${name}: ${value}`)
      .join("; ");
    return result(
      "negotiation reference: wantsMarkdown()",
      `${(query || request || "(browser)").slice(0, 78).padEnd(78)}  ${wanted ? "markdown" : "html"}`,
      actual === wanted ? [] : [`wantsMarkdown() = ${actual}`],
    );
  });
}

/** Slugs with a post page in a tree. */
function pageSlugs(tree: string, host: Host): string[] {
  const dir = host === "main" ? join(tree, "blog") : tree;
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "index.html")))
    .map((entry) => entry.name)
    .sort();
}

/** Slugs with per-post markdown in a tree. */
function markdownSlugs(tree: string): string[] {
  const dir = join(tree, "_md", "blog");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.slice(0, -".md".length))
    .sort();
}

const htmlLangOf = (html: string): string | undefined =>
  /<html[^>]*\slang="([^"]*)"/.exec(html)?.[1];

/** `> Language: EN` of a per-post markdown file, as an `<html lang>` value. */
function markdownLangOf(markdown: string): string | undefined {
  const lang = /^> Language: (EN|PT)$/m.exec(markdown)?.[1];
  return lang === undefined ? undefined : HTML_LANG[lang.toLowerCase() as Lang];
}

/**
 * In every tree of `dist`, a post page exists exactly when its markdown does, and both are
 * the same language version.
 */
function agreementResults(dist: string): Result[] {
  const results: Result[] = [];
  for (const { name } of readManifest(dist).epochs) {
    for (const host of HOSTS) {
      for (const lang of LANGS) {
        const t = trees(dist, name);
        const tree = t.tree(host, lang);
        const pages = pageSlugs(tree, host);
        const markdown = markdownSlugs(tree);
        const problems: string[] = [];
        for (const slug of pages.filter((page) => !markdown.includes(page))) {
          problems.push(`${slug}: page without markdown`);
        }
        for (const slug of markdown.filter((file) => !pages.includes(file))) {
          problems.push(`${slug}: markdown without page`);
        }
        for (const slug of pages.filter((page) => markdown.includes(page))) {
          const page = htmlLangOf(readFileSync(htmlPage(t, host, lang, slug), "utf8"));
          const md = markdownLangOf(readFileSync(join(tree, "_md/blog", `${slug}.md`), "utf8"));
          if (page !== md) problems.push(`${slug}: page lang ${page}, markdown lang ${md}`);
        }
        results.push(
          result(
            "page/markdown agreement",
            `${relative(ROOT, tree)}: ${pages.length} posts`,
            pages.length === 0 ? ["no posts", ...problems] : problems,
          ),
        );
      }
    }
  }
  return results;
}

/** The language a tree serves for a split-date fixture in an epoch starting at `start`. */
function splitServed(post: SplitPost, lang: Lang, start: number): Lang | undefined {
  if (start >= SPLIT_SECOND) return lang;
  if (start >= SPLIT_FIRST) return post.first;
  return undefined;
}

/** Pages, markdown and listings of the split-date fixtures in every tree of `dist`. */
function splitFileResults(dist: string, manifest: CaddyManifest): Result[] {
  const results: Result[] = [];
  for (const epoch of manifest.epochs) {
    const t = trees(dist, epoch.name);
    for (const host of HOSTS) {
      for (const lang of LANGS) {
        const tree = t.tree(host, lang);
        const index = readFileSync(htmlPage(t, host, lang, "blog"), "utf8");
        for (const post of SPLIT_POSTS) {
          const served = splitServed(post, lang, epoch.start);
          const page = htmlPage(t, host, lang, post.slug);
          const markdown = join(tree, "_md/blog", `${post.slug}.md`);
          const href = `href="${host === "main" ? `/blog/${post.slug}` : `/${post.slug}`}"`;
          const problems: string[] = [];
          if (served === undefined) {
            if (existsSync(page)) problems.push("page exists before any release");
            if (existsSync(markdown)) problems.push("markdown exists before any release");
            if (index.includes(href)) problems.push("index links the post");
            const card = `lang="${HTML_LANG[post.first]}">${post.title[post.first]}</h2>`;
            const expected = post.first === lang ? `<h2>${post.title[lang]}</h2>` : card;
            if (!index.includes(expected)) problems.push(`index lacks countdown ${expected}`);
          } else if (!existsSync(page) || !existsSync(markdown)) {
            problems.push(`page ${existsSync(page)}, markdown ${existsSync(markdown)}`);
          } else {
            const html = readFileSync(page, "utf8");
            const md = readFileSync(markdown, "utf8");
            if (htmlLangOf(html) !== HTML_LANG[served]) {
              problems.push(`page lang ${htmlLangOf(html)}`);
            }
            if (!html.includes(`<h1>${post.title[served]}</h1>`)) problems.push("page title");
            if (!md.startsWith(`# ${post.title[served]}\n`)) problems.push("markdown title");
            if (markdownLangOf(md) !== HTML_LANG[served]) {
              problems.push(`markdown lang ${markdownLangOf(md)}`);
            }
            const attr = served === lang ? "" : ` lang="${HTML_LANG[served]}"`;
            if (!index.includes(`<h2${attr}><a ${href}>${post.title[served]}</a></h2>`)) {
              problems.push(`index lacks the card for the ${served} version`);
            }
            if (index.includes(`>${post.title[post.first]}</h2>`)) {
              problems.push("index still has a countdown");
            }
          }
          results.push(
            result(
              "release dates per language: files",
              `${relative(dist, tree)}  ${post.slug.padEnd(17)}  ${served ?? "scheduled"}`,
              problems,
            ),
          );
        }
      }
    }
  }
  return results;
}

/** Requests while the first versions of the split-date fixtures are out (`t` is that epoch). */
function splitHttpCases(t: Trees, group: string): Case[] {
  const cases: Case[] = [];
  for (const host of HOSTS) {
    for (const post of SPLIT_POSTS) {
      const other: Lang = post.first === "en" ? "pt" : "en";
      const path = host === "main" ? `/blog/${post.slug}` : `/${post.slug}`;
      const markdown = join(t.tree(host, other), "_md/blog", `${post.slug}.md`);
      const page: Expect = {
        status: 200,
        file: htmlPage(t, host, other, post.slug),
        lang: post.first,
        type: TYPE.html,
        includes: [post.title[post.first]],
      };
      const md: Expect = { status: 200, file: markdown, type: TYPE.markdown };
      const query = `?lang=${other}`;
      cases.push(
        { group, request: { host, path: `${path}${query}` }, expect: page },
        { group, request: { host, path: `${path}?format=markdown&lang=${other}` }, expect: md },
        { group, request: { host, path: `${path}.mdx${query}` }, expect: md },
        { group, request: { host, path: `/llms.mdx/blog/${post.slug}${query}` }, expect: md },
        {
          group,
          request: { host, path, headers: { Cookie: `portfolio_lang=${post.first}` } },
          expect: { ...page, file: htmlPage(t, host, post.first, post.slug) },
        },
      );
    }
  }
  return cases;
}

// ---------------------------------------------------------------------------------------
// Caddy process

function portInUse(port: number): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const socket = connect({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolvePromise(true);
    });
    socket.once("error", () => resolvePromise(false));
  });
}

async function waitForAdmin(child: ChildProcess, log: string): Promise<void> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(`caddy exited:\n${readFileSync(log, "utf8").slice(-2000)}`);
    try {
      const response = await fetch(`http://${ADMIN}/config/`);
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    await sleep(100);
  }
  throw new Error("caddy did not start within 15 s");
}

function caddy(
  args: string[],
  env = caddyEnv(DIST_ARG ? DIST : undefined),
): {
  ok: boolean;
  output: string;
} {
  const result = spawnSync(CADDY, args, { cwd: ROOT, encoding: "utf8", env });
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}` };
}

/**
 * Environment for Caddy commands. The local Caddyfile reads PORTFOLIO_DIST while it is
 * adapted, so it is set only for the build under test (`--dist`) and never inherited.
 */
function caddyEnv(dist?: string): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.PORTFOLIO_DIST;
  if (dist) env.PORTFOLIO_DIST = dist;
  return env;
}

/** Writes a snippet and a local Caddyfile (absolute paths) for `manifest` into `dir`. */
function writeConfig(dir: string, dist: string, manifest: CaddyManifest, name: string): string {
  const snippet = join(dir, `${name}.caddy`);
  const config = join(dir, `${name}.Caddyfile`);
  writeFileSync(snippet, caddySnippet(manifest));
  writeFileSync(config, localCaddyfile({ dist, snippet }));
  return config;
}

/** Loads a config written by `writeConfig`, whose root must not be overridden. */
function reload(config: string): void {
  const args = ["reload", "--config", config, "--adapter", "caddyfile", "--address", ADMIN];
  const result = caddy(args, caddyEnv());
  if (!result.ok) throw new Error(`caddy reload failed:\n${result.output}`);
}

// ---------------------------------------------------------------------------------------
// Config checks

function configResults(work: string): Result[] {
  const results: Result[] = [];
  const record = (line: string, problems: string[]): void => {
    results.push({ group: "config", ok: problems.length === 0, line, problems });
  };
  for (const name of ["portfolio.caddy", "Caddyfile.local"]) {
    const file = join(DIST, "caddy", name);
    const formatted = caddy(["fmt", file]);
    const same = formatted.ok && formatted.output === readFileSync(file, "utf8");
    record(`caddy fmt ${relative(ROOT, file)}`, same ? [] : ["not formatted"]);
  }
  const local = caddy([
    "validate",
    "--config",
    join(DIST, "caddy", "Caddyfile.local"),
    "--adapter",
    "caddyfile",
  ]);
  const warnings = local.output.split("\n").filter((line) => /"level":"(warn|error)"/.test(line));
  record(
    `caddy validate ${relative(ROOT, join(DIST, "caddy", "Caddyfile.local"))}`,
    local.ok ? warnings : [local.output.slice(-500)],
  );
  const vhosts = join(work, "vhosts.Caddyfile");
  const snippet = join(DIST, "caddy", "portfolio.caddy");
  writeFileSync(
    vhosts,
    [
      "{",
      "\tadmin off",
      "}",
      "",
      "guswid.com, www.guswid.com, r3dlust.com, www.r3dlust.com {",
      `\timport ${snippet} ${DIST} main`,
      "}",
      "",
      "blog.guswid.com, blog.r3dlust.com {",
      `\timport ${snippet} ${DIST} blog`,
      "}",
      "",
    ].join("\n"),
  );
  const production = caddy(["validate", "--config", vhosts, "--adapter", "caddyfile"]);
  record(
    "caddy validate: production vhosts importing the snippet",
    production.ok ? [] : [production.output.slice(-500)],
  );
  return results;
}

// ---------------------------------------------------------------------------------------
// Report

/** Prints the results grouped (groups in order of first appearance); returns the failures. */
function report(results: Result[]): number {
  const groups = new Map<string, Result[]>();
  for (const result of results) {
    groups.set(result.group, [...(groups.get(result.group) ?? []), result]);
  }
  for (const [group, members] of groups) {
    const failed = members.filter((result) => !result.ok).length;
    console.log(`\n${group}  (${members.length - failed}/${members.length})`);
    for (const result of members) {
      console.log(`  ${result.ok ? "PASS" : "FAIL"}  ${result.line}`);
      for (const problem of result.problems) console.log(`        ! ${problem}`);
    }
  }
  const failed = results.filter((result) => !result.ok).length;
  console.log(
    `\n${results.length - failed}/${results.length} checks passed${failed ? `, ${failed} failed` : ""}`,
  );
  return failed;
}

// ---------------------------------------------------------------------------------------

/**
 * Builds `dist-routes/` with the fixture post (unless `--no-epoch-build` and it exists),
 * then checks the gate of the fixture's epoch from both sides with reloaded configs.
 */
async function epochResults(work: string): Promise<Result[]> {
  const built = existsSync(join(EPOCH_DIST, "site", "manifest.json"));
  if (!built || !process.argv.includes("--no-epoch-build")) {
    const started = performance.now();
    buildEpochDist();
    const ms = Math.round(performance.now() - started);
    console.log(`built ${relative(ROOT, EPOCH_DIST)}/ with the fixture post in ${ms} ms`);
  }
  const manifest = readManifest(EPOCH_DIST);
  const index = manifest.epochs.findIndex((epoch) =>
    existsSync(join(EPOCH_DIST, "site", epoch.name, "main", "en", `_md/blog/${FIXTURE_SLUG}.md`)),
  );
  if (index < 1) throw new Error(`${FIXTURE_SLUG} must be released after the first epoch`);
  const fixture = manifest.epochs[index];
  const previous = manifest.epochs[index - 1];
  const gated = (start: number): CaddyManifest => ({
    ...manifest,
    epochs: manifest.epochs.map((epoch, i) => (i === index ? { ...epoch, start } : epoch)),
  });
  const after = trees(EPOCH_DIST, fixture.name);
  const before = trees(EPOCH_DIST, previous.name);
  const precompressed = writePrecompressed(EPOCH_DIST, fixture.name);
  const clock = Math.floor(Date.now() / 1000);
  const results: Result[] = [];

  reload(writeConfig(work, EPOCH_DIST, gated(clock - 3600), "after"));
  const afterGroup = `epoch: gate 1 h ago -> ${fixture.name}`;
  results.push(...(await run(epochCases(after, "after", afterGroup), EPOCH_DIST)));
  results.push(...(await run(precompressedCases(precompressed), EPOCH_DIST)));

  reload(writeConfig(work, EPOCH_DIST, gated(clock + 3600), "before"));
  const beforeGroup = `epoch: gate in 1 h -> ${previous.name}`;
  results.push(...(await run(epochCases(before, "before", beforeGroup), EPOCH_DIST)));

  reload(writeConfig(work, EPOCH_DIST, manifest, "manifest"));
  const manifestGroup = `epoch: manifest gate ${fixture.start} -> ${previous.name}`;
  results.push(...(await run(epochCases(before, "before", manifestGroup), EPOCH_DIST)));

  // One config with the gate 3 s ahead: the same request flips from 404 to 200 unreloaded.
  const flip = Math.floor(Date.now() / 1000) + 3;
  reload(writeConfig(work, EPOCH_DIST, gated(flip), "flip"));
  const group = `epoch: gate at ${flip}, one config before and after`;
  const request: Request = { host: "main", path: `/blog/${FIXTURE_SLUG}` };
  const notFound = join(before.tree("main", "en"), "404.html");
  const page = htmlPage(after, "main", "en", FIXTURE_SLUG);
  const flipCase = (expect: Expect, note: string): Case => ({ group, request, expect, note });
  results.push(
    ...(await run([flipCase({ status: 404, file: notFound }, "before the gate")], EPOCH_DIST)),
  );
  await sleep(Math.max(0, flip * 1000 - Date.now()) + 300);
  results.push(
    ...(await run([flipCase({ status: 200, file: page }, "after the gate")], EPOCH_DIST)),
  );

  // Split release dates: the files of every epoch, then requests while only the first
  // language versions are out (every epoch up to that one gated in the past).
  results.push(...splitFileResults(EPOCH_DIST, manifest));
  const firstOut = manifest.epochs.findIndex((epoch) => epoch.start === SPLIT_FIRST);
  if (firstOut < 1) throw new Error("no epoch starts at the first split release");
  const through: CaddyManifest = {
    ...manifest,
    epochs: manifest.epochs.map((epoch, i) =>
      i >= 1 && i <= firstOut ? { ...epoch, start: clock - 3600 } : epoch,
    ),
  };
  reload(writeConfig(work, EPOCH_DIST, through, "split"));
  const splitGroup = `release dates per language: requests in ${manifest.epochs[firstOut].name}`;
  const split = trees(EPOCH_DIST, manifest.epochs[firstOut].name);
  results.push(...(await run(splitHttpCases(split, splitGroup), EPOCH_DIST)));
  results.push(...agreementResults(EPOCH_DIST));
  const meta = spawnSync(process.execPath, ["scripts/check-metadata.ts", EPOCH_DIST], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const metaOutput = `${meta.stdout}${meta.stderr}`.trim().split("\n");
  results.push(
    result(
      "release dates per language: metadata",
      `scripts/check-metadata.ts ${relative(ROOT, EPOCH_DIST)}`,
      meta.status === 0 ? [] : metaOutput.slice(-20),
    ),
  );
  return results;
}

async function main(): Promise<number> {
  const local = join(DIST, "caddy", "Caddyfile.local");
  if (!existsSync(local)) {
    console.error(`${local} not found; run \`bun run build\` first`);
    return 1;
  }
  for (const port of [PORTS.main, PORTS.blog, Number(ADMIN.split(":")[1])]) {
    if (await portInUse(port)) {
      console.error(`127.0.0.1:${port} is in use; stop whatever listens there first`);
      return 1;
    }
  }
  const work = mkdtempSync(join(tmpdir(), "portfolio-routes-"));
  const log = join(work, "caddy.log");
  const results: Result[] = [
    ...configResults(work),
    ...referenceResults(),
    ...agreementResults(DIST),
  ];

  const logFd = openSync(log, "w");
  const child = spawn(CADDY, ["run", "--config", local, "--adapter", "caddyfile"], {
    cwd: ROOT,
    env: caddyEnv(DIST_ARG ? DIST : undefined),
    stdio: ["ignore", logFd, logFd],
  });
  closeSync(logFd);
  const stop = (): void => {
    if (child.exitCode === null) child.kill("SIGTERM");
  };
  process.once("SIGINT", () => {
    stop();
    process.exit(130);
  });

  try {
    await waitForAdmin(child, log);
    const current = trees(DIST, currentEpoch(readManifest(DIST), Math.floor(Date.now() / 1000)));
    results.push(...(await run(routeCases(current), DIST)));
    results.push(...(await encodingChecks(current)));
    results.push(...(await epochResults(work)));
  } catch (error) {
    results.push({ group: "setup", ok: false, line: "check run", problems: [String(error)] });
  } finally {
    stop();
    await new Promise((resolvePromise) => {
      if (child.exitCode !== null) resolvePromise(undefined);
      else child.once("exit", resolvePromise);
    });
  }

  const failed = report(results);
  if (failed) console.log(`caddy log: ${log}`);
  else rmSync(work, { recursive: true, force: true });
  return failed ? 1 : 0;
}

process.exit(await main());
