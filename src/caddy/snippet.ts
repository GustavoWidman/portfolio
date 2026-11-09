import { aiUserAgentPattern } from "../lib/agents";
import { DEFAULT_LANGUAGE, LANG_STORAGE_KEY } from "../lib/config";
import { epochFiles } from "../lib/urls";
import type { SiteManifest } from "../integrations/dist-layout";

/**
 * Caddy configuration for the static build.
 *
 * `caddySnippet()` renders `dist/caddy/portfolio.caddy`. A site block imports it with the
 * build directory and the host kind:
 *
 *     import <dist>/caddy/portfolio.caddy <dist> main   # guswid.com, r3dlust.com, www.
 *     import <dist>/caddy/portfolio.caddy <dist> blog   # blog.guswid.com, blog.r3dlust.com
 *
 * Requests are answered from `<dist>/site/<epoch>/<host>/<lang>/` (pages and machine
 * files), `<dist>/site/<epoch>/og/` (Open Graph images), `<dist>/static/` (files from
 * `public/`) and `<dist>/_astro/` (hashed assets).
 * `localCaddyfile()` renders `dist/caddy/Caddyfile.local`, which serves both host kinds on
 * 127.0.0.1 with the same snippet.
 */

/** The parts of `dist/site/manifest.json` the config depends on. */
export type CaddyManifest = Pick<SiteManifest, "buildTime" | "epochs" | "languages" | "files">;

/** A Caddyfile line, or a nested array for the indented body of the preceding line. */
type Line = string | Line[];

function block(head: string, body: Line[]): Line[] {
  return [`${head} {`, body, "}"];
}

function render(lines: Line[], depth = 0): string[] {
  return lines.flatMap((line) =>
    typeof line === "string"
      ? [line === "" ? "" : `${"\t".repeat(depth)}${line}`]
      : render(line, depth + 1),
  );
}

function iso(seconds: number): string {
  return new Date(seconds * 1000).toISOString().replace(".000Z", "Z");
}

/** Quotes a Caddyfile token when it contains whitespace or quotes. */
function token(value: string): string {
  return /[\s"]/.test(value) ? `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"` : value;
}

/**
 * Response headers for every answer, including redirects and error pages. Modification
 * times say nothing in the Nix store (every mtime is 1970-01-01T00:00:01Z), so responses
 * carry no Last-Modified and validation relies on ETags alone.
 */
const COMMON_HEADERS: Line[] = [
  "-Server",
  "-Last-Modified",
  "X-Content-Type-Options nosniff",
  "X-Frame-Options DENY",
  "Referrer-Policy strict-origin-when-cross-origin",
  'Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"',
  "Cross-Origin-Opener-Policy same-origin",
];

/**
 * `file_server` with the precompressed sidecars of `writePrecompressed()`. Browsers accept br
 * and zstd with equal weight, so the order is the server's preference: Brotli at quality 11 is
 * the smallest of the three for this site's files. With `etags`, ETags come
 * from `.etag` sidecars (content hashes) instead of modification time and size, which are
 * not distinctive in the Nix store (every mtime is 1).
 */
function fileServer(etags: boolean): Line[] {
  return block("file_server", [
    "precompressed br zstd gzip",
    ...(etags ? ["etag_file_extensions .etag"] : []),
    "disable_canonical_uris",
  ]);
}

/** Absolute request paths of tree files that must not be fetched directly. */
function internalPaths(files: CaddyManifest["files"]): string[] {
  const paths = new Set<string>();
  for (const file of [files.blogMarkdown, files.postMarkdown, files.curl, files.notFound]) {
    const [first, ...rest] = file.split("/");
    paths.add(`/${first}`);
    if (rest.length > 0) paths.add(`/${first}/*`);
  }
  return [...paths];
}

function epochSection(manifest: CaddyManifest): Line[] {
  const [first, ...later] = manifest.epochs;
  if (!first) throw new Error("manifest lists no epochs");
  return [
    "# Release epoch: the newest one whose start (unix seconds) has passed.",
    ...manifest.epochs.map(({ name, start }) => `#   ${name}  ${iso(start)}  ${start}`),
    `vars epoch ${first.name}`,
    ...later.flatMap(({ name, start }) => [
      `@epoch_${name} expression \`int({time.now.unix}) >= ${start}\``,
      `vars @epoch_${name} epoch ${name}`,
    ]),
  ];
}

function languageSection(manifest: CaddyManifest): Line[] {
  const others = manifest.languages.filter((lang) => lang !== DEFAULT_LANGUAGE);
  const all = manifest.languages.join(" ");
  return [
    `# Language: ?lang, else cookie ${LANG_STORAGE_KEY}, else the first Accept-Language tag,`,
    `# else ${DEFAULT_LANGUAGE}. Each later match overrides the earlier ones. The header placeholder`,
    "# joins repeated Accept-Language fields with commas, so the first tag of the whole list counts.",
    `vars lang ${DEFAULT_LANGUAGE}`,
    ...others.flatMap((lang) => [
      `@lang_accept_${lang} vars_regexp {http.request.header.Accept-Language} (?i)^\\s*${lang}([-_;,\\s]|$)`,
      `vars @lang_accept_${lang} lang ${lang}`,
    ]),
    `@lang_cookie vars {cookie.${LANG_STORAGE_KEY}} ${all}`,
    `vars @lang_cookie lang {cookie.${LANG_STORAGE_KEY}}`,
    `@lang_query vars {query.lang} ${all}`,
    "vars @lang_query lang {query.lang}",
  ];
}

function negotiationSection(): Line[] {
  return [
    "# Markdown negotiation for the blog index and posts (rules in src/lib/agents.ts).",
    "@markdown_wanted expression <<CEL",
    [
      'query({"format": "markdown"})',
      '|| query({"raw": "true"})',
      '|| header_regexp("Accept", "(?i)^text/(markdown|plain)")',
      '|| (header_regexp("Accept", "(?i)text/(markdown|plain)") && !header_regexp("Accept", "[*]/[*]"))',
      `|| header_regexp("User-Agent", "${aiUserAgentPattern()}")`,
      "CEL",
    ],
    "# markdown_host holds the host kind when markdown is wanted, so one vars matcher checks",
    "# both (a vars matcher with several keys matches when any one of them does).",
    "vars @markdown_wanted markdown_host {args[1]}",
  ];
}

function redirectSection(): Line[] {
  return [
    '# Browsers read "/\\host" in a Location header as "//host", and they drop TAB, CR and',
    '# LF from URLs, so "/<TAB>/host" reads as "//host" too. No redirect may echo a backslash',
    "# or a control character, so paths containing one are refused.",
    "@unsafe_path path_regexp [\\\\\\x00-\\x1f\\x7f]",
    "error @unsafe_path 404",
    "",
    "# Blog host: /blog and /blog/<path> move to / and /<path>, keeping the query.",
    ...block("@blog_prefix", [
      "vars host_kind blog",
      "path_regexp blog_prefix ^/blog(?:/(.*?))?/?$",
    ]),
    "redir @blog_prefix /{re.blog_prefix.1}{?query} 301",
    "",
    "# One URL per page: no trailing slash and no index.html. Path matchers see the cleaned",
    "# path, so captures never start with a slash.",
    "@trailing_slash path_regexp trailing_slash ^/(.+)/$",
    "redir @trailing_slash /{re.trailing_slash.1}{?query} 301",
    "@index_html path_regexp index_html ^/(?:(.*)/)?index\\.html$",
    "redir @index_html /{re.index_html.1}{?query} 301",
  ];
}

function sharedFilesSection(): Line[] {
  return [
    "# Hashed build assets, shared by every epoch, host and language.",
    ...block("route /_astro/*", [
      "root * {args[0]}",
      'header Cache-Control "public, max-age=31536000, immutable"',
      "# Names are content hashes, so the default ETag is stable per name.",
      ...fileServer(false),
    ]),
    "",
    "# Open Graph images exist per epoch, so the image of a scheduled post stays private.",
    ...block(`route /${epochFiles.ogDir}/*`, [
      "root * {args[0]}/site/{vars.epoch}",
      'header Cache-Control "public, max-age=3600"',
      "# No ETag sidecars: og/ holds exactly the epoch's images.",
      ...fileServer(false),
    ]),
    "",
    "# Files copied from public/: favicon, robots.txt, résumés.",
    ...block("@static", [
      "not path /",
      ...block("file", ["root {args[0]}/static", "try_files {path}"]),
    ]),
    ...block("route @static", [
      "root * {args[0]}/static",
      'header Cache-Control "public, max-age=3600"',
      "@static_text path *.txt",
      'header @static_text >Content-Type "text/plain; charset=utf-8"',
      ...fileServer(true),
    ]),
  ];
}

function treeSection(manifest: CaddyManifest): Line[] {
  const { files } = manifest;
  const post = (name: string): string =>
    `/${files.postMarkdown.replace("<slug>", `{re.${name}.1}`)}`;
  const blogMarkdown = `/${files.blogMarkdown}`;
  return [
    "# Everything else comes from the selected tree. One URL answers in several languages,",
    "# epochs and formats, and a cache that ignores Vary would mix them: private keeps the",
    "# answers out of shared caches, no-cache makes browsers revalidate by ETag.",
    "root * {vars.tree}",
    'header Cache-Control "private, no-cache"',
    'header Vary "Cookie, Accept-Language"',
    "# Pages whose answer also depends on User-Agent and Accept (curl card, markdown).",
    ...block("@agent_dependent_main", [
      "vars host_kind main",
      "path_regexp ^/(index|blog(/[^/.]+)?)?$",
    ]),
    ...block("@agent_dependent_blog", ["vars host_kind blog", "path_regexp ^/([^/.]+)?$"]),
    'header @agent_dependent_main Vary "Cookie, Accept-Language, User-Agent, Accept"',
    'header @agent_dependent_blog Vary "Cookie, Accept-Language, User-Agent, Accept"',
    "",
    "# Rewrites into the tree; only the first matching rewrite applies.",
    "@mdx_index path /blog.mdx /llms.mdx/blog",
    `rewrite @mdx_index ${blogMarkdown}`,
    "@mdx_llms_post path_regexp mdx_llms_post ^/llms\\.mdx/blog/([^/]+)$",
    `rewrite @mdx_llms_post ${post("mdx_llms_post")}`,
    ...block("@mdx_post_main", [
      "vars host_kind main",
      "path_regexp mdx_post_main ^/blog/([^/]+)\\.mdx$",
    ]),
    `rewrite @mdx_post_main ${post("mdx_post_main")}`,
    ...block("@mdx_post_blog", [
      "vars host_kind blog",
      "path_regexp mdx_post_blog ^/([^/]+)\\.mdx$",
    ]),
    `rewrite @mdx_post_blog ${post("mdx_post_blog")}`,
    ...block("@markdown_index_main", ["vars markdown_host main", "path /blog"]),
    `rewrite @markdown_index_main ${blogMarkdown}`,
    ...block("@markdown_post_main", [
      "vars markdown_host main",
      "path_regexp markdown_post_main ^/blog/([^/.]+)$",
    ]),
    `rewrite @markdown_post_main ${post("markdown_post_main")}`,
    ...block("@markdown_index_blog", ["vars markdown_host blog", "path /"]),
    `rewrite @markdown_index_blog ${blogMarkdown}`,
    ...block("@markdown_post_blog", [
      "vars markdown_host blog",
      "path_regexp markdown_post_blog ^/([^/.]+)$",
    ]),
    `rewrite @markdown_post_blog ${post("markdown_post_blog")}`,
    ...block("@curl_main", ["vars host_kind main", "path / /index", "header User-Agent curl/*"]),
    `rewrite @curl_main /${files.curl}`,
    ...block("@curl_blog", ["vars host_kind blog", "path /", "header User-Agent curl/*"]),
    `rewrite @curl_blog /${files.curl}`,
    "try_files {path}/index.html {path}",
    "",
    "# Content types by the file that is served (set when the response is written).",
    "@html path *.html",
    'header @html >Content-Type "text/html; charset=utf-8"',
    "@markdown path *.md",
    'header @markdown >Content-Type "text/markdown; charset=utf-8"',
    "@text path *.txt",
    'header @text >Content-Type "text/plain; charset=utf-8"',
    `@feed path /${files.feedMain} /${files.feedBlog}`,
    'header @feed >Content-Type "application/rss+xml; charset=utf-8"',
    `@sitemap path /${files.sitemap}`,
    'header @sitemap >Content-Type "application/xml; charset=utf-8"',
    ...fileServer(true),
  ];
}

function errorSection(manifest: CaddyManifest): Line[] {
  return [
    "# Not found: the 404 page of the selected tree. Headers set before the error are kept,",
    "# so caching and content type are set again here.",
    ...block("handle_errors 404", [
      "root * {vars.tree}",
      `rewrite * /${manifest.files.notFound}`,
      ...block("header", COMMON_HEADERS),
      ...block("header", [
        'Cache-Control "private, no-cache"',
        'Vary "Cookie, Accept-Language"',
        'Content-Type "text/html; charset=utf-8"',
      ]),
      "encode zstd gzip",
      "# A custom status bypasses conditional requests, so no ETag sidecars here.",
      ...fileServer(false),
    ]),
    "",
    ...block("handle_errors", [
      ...block("header", COMMON_HEADERS),
      'header Cache-Control "no-store"',
      'respond "{err.status_code} {err.status_text}" {err.status_code}',
    ]),
  ];
}

/** `dist/caddy/portfolio.caddy`: the site config, parameterized by `<dist> <main|blog>`. */
export function caddySnippet(manifest: CaddyManifest): string {
  const lines: Line[] = [
    "# Portfolio site config, generated from dist/site/manifest.json by src/caddy/snippet.ts.",
    "#",
    "# Import it inside a site block with the build directory and the host kind:",
    "#   import <dist>/caddy/portfolio.caddy <dist> main   (guswid.com, r3dlust.com, www.)",
    "#   import <dist>/caddy/portfolio.caddy <dist> blog   (blog.guswid.com, blog.r3dlust.com)",
    "#",
    `# Build reference time: ${iso(manifest.buildTime)} (${manifest.buildTime}).`,
    "",
    ...block("route", [
      "# Nix store files all have mtime 1970-01-01T00:00:01Z, so responses carry no",
      "# Last-Modified and requests are revalidated by ETag only.",
      ...block("header", COMMON_HEADERS),
      "request_header -If-Modified-Since",
      "encode zstd gzip",
      "",
      ...epochSection(manifest),
      "",
      ...languageSection(manifest),
      "",
      ...block("vars", [
        "host_kind {args[1]}",
        "tree {args[0]}/site/{vars.epoch}/{args[1]}/{vars.lang}",
      ]),
      "",
      ...negotiationSection(),
      "",
      ...redirectSection(),
      "",
      "# Tree files only reachable through the rewrites further down, and the ETag and",
      "# precompressed sidecars that file_server reads in place of a file.",
      `@internal path ${internalPaths(manifest.files).join(" ")} *.etag *.br *.zst *.gz`,
      "error @internal 404",
      "",
      ...sharedFilesSection(),
      "",
      ...treeSection(manifest),
    ]),
    "",
    ...errorSection(manifest),
  ];
  return `${render(lines).join("\n")}\n`;
}

export interface LocalCaddyfileOptions {
  /**
   * Build directory served unless `PORTFOLIO_DIST` is set at run time. A relative path is
   * resolved by Caddy against its working directory.
   */
  dist: string;
  /** Snippet to import, absolute or relative to the Caddyfile's directory. */
  snippet?: string;
  mainPort?: number;
  blogPort?: number;
  admin?: string;
}

/** `dist/caddy/Caddyfile.local`: both host kinds on 127.0.0.1 for local previews. */
export function localCaddyfile(options: LocalCaddyfileOptions): string {
  const {
    dist,
    snippet = "portfolio.caddy",
    mainPort = 4801,
    blogPort = 4802,
    admin = "127.0.0.1:2098",
  } = options;
  const root = token(`{$PORTFOLIO_DIST:${dist}}`);
  const site = (port: number, host: string): Line[] =>
    block(`http://:${port}`, ["bind 127.0.0.1", `import ${token(snippet)} ${root} ${host}`]);
  const lines: Line[] = [
    "# Local preview of the build with the production snippet, generated by src/caddy/snippet.ts.",
    `# From the project root: caddy run --config ${dist}/caddy/Caddyfile.local`,
    `# Main host on http://127.0.0.1:${mainPort}, blog host on http://127.0.0.1:${blogPort}.`,
    `# PORTFOLIO_DIST=<dir> serves another build directory instead of ${dist}.`,
    "{",
    [`admin ${admin}`, "auto_https off", "persist_config off"],
    "}",
    "",
    ...site(mainPort, "main"),
    "",
    ...site(blogPort, "blog"),
  ];
  return `${render(lines).join("\n")}\n`;
}
