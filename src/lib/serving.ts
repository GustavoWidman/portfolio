import type { SiteManifest } from "../integrations/dist-layout";
import type { HostKind } from "./config";

/**
 * Web-server rules of the static build, shared by the Caddy snippet (`src/caddy/snippet.ts`)
 * and the upstreamer route fragments (`src/upstreamer/fragment.ts`). Path patterns use the
 * syntax both servers accept: an exact path, `/prefix/*` or `*.ext`. Regexes are RE2
 * compatible.
 */

/** Response headers removed from every answer. Nix store mtimes are all 1, so validation uses ETags alone. */
export const REMOVED_HEADERS = ["Server", "Last-Modified"] as const;

/** Response headers set on every answer, redirects and error pages included. */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export const CACHE_CONTROL = {
  /** `_astro/`: names are content hashes. */
  immutable: "public, max-age=31536000, immutable",
  /** `static/` and Open Graph images. */
  static: "public, max-age=3600",
  /**
   * The trees and their 404 pages: one URL answers in several languages, epochs and formats,
   * so shared caches must not store it, and browsers revalidate by ETag.
   */
  tree: "private, no-cache",
  /** Errors other than 404. */
  error: "no-store",
} as const;

export const VARY = {
  /** Every tree answer. */
  tree: "Cookie, Accept-Language",
  /** Pages whose answer also depends on User-Agent and Accept (curl card, markdown). */
  agent: "Cookie, Accept-Language, User-Agent, Accept",
} as const;

/** Precompressed sidecars in the server's order of preference, as content codings. */
export const PRECOMPRESSED = ["br", "zstd", "gzip"] as const;
/** Codings for responses without a sidecar. */
export const DYNAMIC_ENCODINGS = ["zstd", "gzip"] as const;
/** Extension of the ETag sidecar next to a served file. */
export const ETAG_SIDECAR = ".etag";
/** Sidecar files, never served directly. */
export const SIDECAR_PATHS = ["*.etag", "*.br", "*.zst", "*.gz"] as const;

/** Accept-Language regex for a language: the first tag of the field names it. */
export function acceptLanguagePattern(lang: string): string {
  return `(?i)^\\s*${lang}([-_;,\\s]|$)`;
}

/** Accept regexes of the markdown negotiation (rules in `src/lib/agents.ts`). */
export const MARKDOWN_ACCEPT = {
  /** Accept starts with a markdown or plain-text type. */
  first: "(?i)^text/(markdown|plain)",
  /** Accept names one anywhere; it counts when no wildcard follows. */
  anywhere: "(?i)text/(markdown|plain)",
  wildcard: "[*]/[*]",
} as const;

/** Query parameters that ask for markdown. */
export const MARKDOWN_QUERY: readonly (readonly [key: string, value: string])[] = [
  ["format", "markdown"],
  ["raw", "true"],
];

/**
 * Browsers read "/\host" in a Location header as "//host", and they drop TAB, CR and LF from
 * URLs, so "/<TAB>/host" reads as "//host" too. No redirect may echo a backslash or a control
 * character, so paths containing one are refused.
 */
export const UNSAFE_PATH = "[\\\\\\x00-\\x1f\\x7f]";

/** Redirect regexes; capture 1 is the target path without its leading slash. */
export const REDIRECTS = {
  /** Blog host only: `/blog` and `/blog/<path>` move to `/` and `/<path>`. */
  blogPrefix: "^/blog(?:/(.*?))?/?$",
  /** One URL per page: no trailing slash and no `index.html`. */
  trailingSlash: "^/(.+)/$",
  indexHtml: "^/(?:(.*)/)?index\\.html$",
} as const;

/** `.mdx` and llms paths of the blog index markdown, on both hosts. */
export const MDX_INDEX_PATHS = ["/blog.mdx", "/llms.mdx/blog"] as const;
/** llms path of a post's markdown on both hosts; capture 1 is the slug. */
export const MDX_LLMS_POST = "^/llms\\.mdx/blog/([^/]+)$";
/** User-Agent pattern of the curl card. */
export const CURL_USER_AGENT = "curl/*";

/** Paths whose meaning depends on the host kind; regex capture 1 is a post slug. */
export interface HostPaths {
  /** Pages whose answer depends on User-Agent and Accept. */
  agentDependent: string;
  /** `<post>.mdx`. */
  mdxPost: string;
  /** The blog index, negotiable to markdown. */
  blogIndex: string;
  /** A post page, negotiable to markdown. */
  post: string;
  /** Paths that answer curl with the curl card. */
  curl: readonly string[];
}

export const HOST_PATHS: Readonly<Record<HostKind, HostPaths>> = {
  main: {
    agentDependent: "^/(index|blog(/[^/.]+)?)?$",
    mdxPost: "^/blog/([^/]+)\\.mdx$",
    blogIndex: "/blog",
    post: "^/blog/([^/.]+)$",
    curl: ["/", "/index"],
  },
  blog: {
    agentDependent: "^/([^/.]+)?$",
    mdxPost: "^/([^/]+)\\.mdx$",
    blogIndex: "/",
    post: "^/([^/.]+)$",
    curl: ["/"],
  },
};

/** Machine file names of the manifest the rules depend on. */
type TreeFiles = SiteManifest["files"];

/** Absolute request paths of tree files only reachable through rewrites. */
export function internalPaths(files: TreeFiles): string[] {
  const paths = new Set<string>();
  for (const file of [files.blogMarkdown, files.postMarkdown, files.curl, files.notFound]) {
    const [first, ...rest] = file.split("/");
    paths.add(`/${first}`);
    if (rest.length > 0) paths.add(`/${first}/*`);
  }
  return [...paths];
}

/** Request path of a post's markdown in the tree, with `slug` standing for the slug. */
export function postMarkdownPath(files: TreeFiles, slug: string): string {
  return `/${files.postMarkdown.replace("<slug>", slug)}`;
}

/** Content type of a served tree file, by the path it is served from. */
export interface ContentTypeRule {
  /** Caddy matcher name. */
  name: string;
  paths: string[];
  type: string;
}

export const TEXT_CONTENT_TYPE = "text/plain; charset=utf-8";

export function treeContentTypes(files: TreeFiles): ContentTypeRule[] {
  return [
    { name: "html", paths: ["*.html"], type: "text/html; charset=utf-8" },
    { name: "markdown", paths: ["*.md"], type: "text/markdown; charset=utf-8" },
    { name: "text", paths: ["*.txt"], type: TEXT_CONTENT_TYPE },
    {
      name: "feed",
      paths: [`/${files.feedMain}`, `/${files.feedBlog}`],
      type: "application/rss+xml; charset=utf-8",
    },
    { name: "sitemap", paths: [`/${files.sitemap}`], type: "application/xml; charset=utf-8" },
  ];
}

/** Content type of the 404 page. */
export const NOT_FOUND_CONTENT_TYPE = "text/html; charset=utf-8";
