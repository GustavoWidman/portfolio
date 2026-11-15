import { aiUserAgentPattern } from "../lib/agents";
import { DEFAULT_LANGUAGE, LANG_STORAGE_KEY } from "../lib/config";
import {
  acceptLanguagePattern,
  CACHE_CONTROL,
  CURL_USER_AGENT,
  DYNAMIC_ENCODINGS,
  ETAG_SIDECAR,
  HOST_PATHS,
  internalPaths,
  MARKDOWN_ACCEPT,
  MARKDOWN_QUERY,
  MDX_INDEX_PATHS,
  MDX_LLMS_POST,
  NOT_FOUND_CONTENT_TYPE,
  postMarkdownPath,
  PRECOMPRESSED,
  REDIRECTS,
  REMOVED_HEADERS,
  SECURITY_HEADERS,
  SIDECAR_PATHS,
  TEXT_CONTENT_TYPE,
  treeContentTypes,
  UNSAFE_PATH,
  VARY,
} from "../lib/serving";
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
  ...REMOVED_HEADERS.map((name) => `-${name}`),
  ...Object.entries(SECURITY_HEADERS).map(([name, value]) => `${name} ${token(value)}`),
];

/** `<directive> "<value>"`, quoted whether or not the value needs it. */
function quoted(head: string, value: string): string {
  return `${head} "${value}"`;
}

const ENCODE = `encode ${DYNAMIC_ENCODINGS.join(" ")}`;

/**
 * `file_server` with the precompressed sidecars of `writePrecompressed()`. Browsers accept br
 * and zstd with equal weight, so the order is the server's preference: Brotli at quality 11 is
 * the smallest of the three for this site's files. With `etags`, ETags come
 * from `.etag` sidecars (content hashes) instead of modification time and size, which are
 * not distinctive in the Nix store (every mtime is 1).
 */
function fileServer(etags: boolean): Line[] {
  return block("file_server", [
    `precompressed ${PRECOMPRESSED.join(" ")}`,
    ...(etags ? [`etag_file_extensions ${ETAG_SIDECAR}`] : []),
    "disable_canonical_uris",
  ]);
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
      `@lang_accept_${lang} vars_regexp {http.request.header.Accept-Language} ${acceptLanguagePattern(lang)}`,
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
      ...MARKDOWN_QUERY.map(
        ([key, value], i) => `${i === 0 ? "" : "|| "}query({"${key}": "${value}"})`,
      ),
      `|| header_regexp("Accept", "${MARKDOWN_ACCEPT.first}")`,
      `|| (header_regexp("Accept", "${MARKDOWN_ACCEPT.anywhere}") && !header_regexp("Accept", "${MARKDOWN_ACCEPT.wildcard}"))`,
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
    `@unsafe_path path_regexp ${UNSAFE_PATH}`,
    "error @unsafe_path 404",
    "",
    "# Blog host: /blog and /blog/<path> move to / and /<path>, keeping the query.",
    ...block("@blog_prefix", [
      "vars host_kind blog",
      `path_regexp blog_prefix ${REDIRECTS.blogPrefix}`,
    ]),
    "redir @blog_prefix /{re.blog_prefix.1}{?query} 301",
    "",
    "# One URL per page: no trailing slash and no index.html. Path matchers see the cleaned",
    "# path, so captures never start with a slash.",
    `@trailing_slash path_regexp trailing_slash ${REDIRECTS.trailingSlash}`,
    "redir @trailing_slash /{re.trailing_slash.1}{?query} 301",
    `@index_html path_regexp index_html ${REDIRECTS.indexHtml}`,
    "redir @index_html /{re.index_html.1}{?query} 301",
  ];
}

function sharedFilesSection(): Line[] {
  return [
    "# Hashed build assets, shared by every epoch, host and language.",
    ...block("route /_astro/*", [
      "root * {args[0]}",
      quoted("header Cache-Control", CACHE_CONTROL.immutable),
      "# Names are content hashes, so the default ETag is stable per name.",
      ...fileServer(false),
    ]),
    "",
    "# Open Graph images exist per epoch, so the image of a scheduled post stays private.",
    ...block(`route /${epochFiles.ogDir}/*`, [
      "root * {args[0]}/site/{vars.epoch}",
      quoted("header Cache-Control", CACHE_CONTROL.static),
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
      quoted("header Cache-Control", CACHE_CONTROL.static),
      "@static_text path *.txt",
      quoted("header @static_text >Content-Type", TEXT_CONTENT_TYPE),
      ...fileServer(true),
    ]),
  ];
}

function treeSection(manifest: CaddyManifest): Line[] {
  const { files } = manifest;
  const post = (name: string): string => postMarkdownPath(files, `{re.${name}.1}`);
  const blogMarkdown = `/${files.blogMarkdown}`;
  const hosts = Object.entries(HOST_PATHS);
  return [
    "# Everything else comes from the selected tree. One URL answers in several languages,",
    "# epochs and formats, and a cache that ignores Vary would mix them: private keeps the",
    "# answers out of shared caches, no-cache makes browsers revalidate by ETag.",
    "root * {vars.tree}",
    quoted("header Cache-Control", CACHE_CONTROL.tree),
    quoted("header Vary", VARY.tree),
    "# Pages whose answer also depends on User-Agent and Accept (curl card, markdown).",
    ...hosts.flatMap(([host, paths]) =>
      block(`@agent_dependent_${host}`, [
        `vars host_kind ${host}`,
        `path_regexp ${paths.agentDependent}`,
      ]),
    ),
    ...hosts.map(([host]) => quoted(`header @agent_dependent_${host} Vary`, VARY.agent)),
    "",
    "# Rewrites into the tree; only the first matching rewrite applies.",
    `@mdx_index path ${MDX_INDEX_PATHS.join(" ")}`,
    `rewrite @mdx_index ${blogMarkdown}`,
    `@mdx_llms_post path_regexp mdx_llms_post ${MDX_LLMS_POST}`,
    `rewrite @mdx_llms_post ${post("mdx_llms_post")}`,
    ...hosts.flatMap(([host, paths]) => [
      ...block(`@mdx_post_${host}`, [
        `vars host_kind ${host}`,
        `path_regexp mdx_post_${host} ${paths.mdxPost}`,
      ]),
      `rewrite @mdx_post_${host} ${post(`mdx_post_${host}`)}`,
    ]),
    ...hosts.flatMap(([host, paths]) => [
      ...block(`@markdown_index_${host}`, [
        `vars markdown_host ${host}`,
        `path ${paths.blogIndex}`,
      ]),
      `rewrite @markdown_index_${host} ${blogMarkdown}`,
      ...block(`@markdown_post_${host}`, [
        `vars markdown_host ${host}`,
        `path_regexp markdown_post_${host} ${paths.post}`,
      ]),
      `rewrite @markdown_post_${host} ${post(`markdown_post_${host}`)}`,
    ]),
    ...hosts.flatMap(([host, paths]) => [
      ...block(`@curl_${host}`, [
        `vars host_kind ${host}`,
        `path ${paths.curl.join(" ")}`,
        `header User-Agent ${CURL_USER_AGENT}`,
      ]),
      `rewrite @curl_${host} /${files.curl}`,
    ]),
    "try_files {path}/index.html {path}",
    "",
    "# Content types by the file that is served (set when the response is written).",
    ...treeContentTypes(files).flatMap(({ name, paths, type }) => [
      `@${name} path ${paths.join(" ")}`,
      quoted(`header @${name} >Content-Type`, type),
    ]),
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
        quoted("Cache-Control", CACHE_CONTROL.tree),
        quoted("Vary", VARY.tree),
        quoted("Content-Type", NOT_FOUND_CONTENT_TYPE),
      ]),
      ENCODE,
      "# A custom status bypasses conditional requests, so no ETag sidecars here.",
      ...fileServer(false),
    ]),
    "",
    ...block("handle_errors", [
      ...block("header", COMMON_HEADERS),
      quoted("header Cache-Control", CACHE_CONTROL.error),
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
      ENCODE,
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
      `@internal path ${[...internalPaths(manifest.files), ...SIDECAR_PATHS].join(" ")}`,
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
