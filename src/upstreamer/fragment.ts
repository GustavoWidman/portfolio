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
import type { HostKind } from "../lib/config";

/**
 * upstreamer route fragments for the static build.
 *
 * `upstreamerFragment()` renders `dist/upstreamer/<host>.json`, the headers, route steps and
 * error routes of one host kind. A virtual host serves the site with one route step that
 * includes it by path:
 *
 *     services.upstreamer.virtualHosts."guswid.com".routes = [
 *       { include = "${portfolio}/upstreamer/main.json"; }
 *     ];
 *
 * upstreamer reads the fragment when it loads its config, and `upstreamer check` validates
 * it when the host's system is built. Every file root is absolute: the directory the build
 * is served from (the package's store path in a Nix build).
 */

/** The parts of `dist/site/manifest.json` the fragments depend on. */
export type FragmentManifest = Pick<SiteManifest, "epochs" | "languages" | "files">;

/** A string upstreamer expands per request: `{path}`, `{vars.x}`, `{re.1}`, ... */
type Template = string;
type Coding = (typeof PRECOMPRESSED)[number];

interface Matcher {
  path?: string | string[];
  pathRegex?: string;
  header?: Record<string, string>;
  headerRegex?: Record<string, string>;
  query?: Record<string, string>;
  value?: Template;
  in?: string[];
  regex?: string;
  file?: { root: Template; paths: Template[] };
  /** True once the clock has reached these unix seconds. */
  after?: number;
  any?: Matcher[];
  none?: Matcher[];
}

interface FilesAction {
  root: Template;
  precompressed: Coding[];
  etagSidecar?: string;
}

/** One action per step. */
type Action =
  | { set: Record<string, Template> }
  | { rewrite: Template }
  | { tryFiles: { root: Template; paths: Template[] } }
  | { headers: Record<string, Template | null> }
  | { requestHeaders: Record<string, Template | null> }
  | { encode: Coding[] }
  | { routes: Step[] }
  | { firstOf: Step[] }
  | { files: FilesAction }
  | { respond: { body: Template } }
  | { redirect: { to: Template; status: 301 } }
  | { error: number };

type Step = { name?: string; when?: Matcher } & Action;

export interface Fragment {
  fragment: 1;
  headers: Record<string, string | null>;
  routes: Step[];
  errors: { status?: number[]; routes: Step[] }[];
}

const files = (root: Template, etags: boolean): Step => ({
  files: {
    root,
    precompressed: [...PRECOMPRESSED],
    ...(etags ? { etagSidecar: ETAG_SIDECAR } : {}),
  },
});

/** A path matcher value: one pattern as a string, several as a list. */
function pathList(paths: readonly string[]): string | string[] {
  return paths.length === 1 ? paths[0]! : [...paths];
}

const ENCODE: Step = { encode: [...DYNAMIC_ENCODINGS] };

function headers(): Fragment["headers"] {
  return {
    ...Object.fromEntries(REMOVED_HEADERS.map((name) => [name, null])),
    ...SECURITY_HEADERS,
  };
}

/** Release epoch: the newest one whose start (unix seconds) has passed. */
function epochSteps(manifest: FragmentManifest): Step[] {
  const [first, ...later] = manifest.epochs;
  if (!first) throw new Error("manifest lists no epochs");
  return [
    { name: "epoch", set: { epoch: first.name } },
    ...later.map(({ name, start }): Step => ({
      name: `epoch_${name}`,
      when: { after: start },
      set: { epoch: name },
    })),
  ];
}

/**
 * Language: ?lang, else the language cookie, else the first Accept-Language tag, else the
 * default. Each later match overrides the earlier ones.
 */
function languageSteps(manifest: FragmentManifest): Step[] {
  const all = [...manifest.languages];
  return [
    { name: "lang_default", set: { lang: DEFAULT_LANGUAGE } },
    ...all
      .filter((lang) => lang !== DEFAULT_LANGUAGE)
      .map((lang): Step => ({
        name: `lang_accept_${lang}`,
        when: { value: "{header.Accept-Language}", regex: acceptLanguagePattern(lang) },
        set: { lang },
      })),
    {
      name: "lang_cookie",
      when: { value: `{cookie.${LANG_STORAGE_KEY}}`, in: all },
      set: { lang: `{cookie.${LANG_STORAGE_KEY}}` },
    },
    { name: "lang_query", when: { value: "{query.lang}", in: all }, set: { lang: "{query.lang}" } },
  ];
}

/** Markdown negotiation for the blog index and posts (rules in src/lib/agents.ts). */
function negotiationStep(): Step {
  return {
    name: "markdown_wanted",
    when: {
      any: [
        ...MARKDOWN_QUERY.map(([key, value]): Matcher => ({ query: { [key]: value } })),
        { headerRegex: { Accept: MARKDOWN_ACCEPT.first } },
        {
          headerRegex: { Accept: MARKDOWN_ACCEPT.anywhere },
          none: [{ headerRegex: { Accept: MARKDOWN_ACCEPT.wildcard } }],
        },
        { headerRegex: { "User-Agent": aiUserAgentPattern() } },
      ],
    },
    set: { markdown: "yes" },
  };
}

function redirectSteps(kind: HostKind): Step[] {
  const redirect = (name: string, pathRegex: string): Step => ({
    name,
    when: { pathRegex },
    redirect: { to: "/{re.1}{?query}", status: 301 },
  });
  return [
    { name: "unsafe_path", when: { pathRegex: UNSAFE_PATH }, error: 404 },
    ...(kind === "blog" ? [redirect("blog_prefix", REDIRECTS.blogPrefix)] : []),
    redirect("trailing_slash", REDIRECTS.trailingSlash),
    redirect("index_html", REDIRECTS.indexHtml),
  ];
}

function sharedFileSteps(root: string): Step[] {
  const staticRoot = `${root}/static`;
  return [
    {
      name: "astro",
      when: { path: "/_astro/*" },
      routes: [{ headers: { "Cache-Control": CACHE_CONTROL.immutable } }, files(root, false)],
    },
    {
      name: "og",
      when: { path: `/${epochFiles.ogDir}/*` },
      routes: [
        { headers: { "Cache-Control": CACHE_CONTROL.static } },
        files(`${root}/site/{vars.epoch}`, false),
      ],
    },
    {
      name: "static",
      when: { none: [{ path: "/" }], file: { root: staticRoot, paths: ["{path}"] } },
      routes: [
        { headers: { "Cache-Control": CACHE_CONTROL.static } },
        { when: { path: "*.txt" }, headers: { "Content-Type": TEXT_CONTENT_TYPE } },
        files(staticRoot, true),
      ],
    },
  ];
}

function treeSteps(manifest: FragmentManifest, kind: HostKind): Step[] {
  const { files: tree } = manifest;
  const paths = HOST_PATHS[kind];
  const blogMarkdown = `/${tree.blogMarkdown}`;
  const post = postMarkdownPath(tree, "{re.1}");
  const markdown: Matcher = { value: "{vars.markdown}", in: ["yes"] };
  return [
    {
      name: "tree_caching",
      headers: { "Cache-Control": CACHE_CONTROL.tree, Vary: VARY.tree },
    },
    {
      name: "agent_dependent",
      when: { pathRegex: paths.agentDependent },
      headers: { Vary: VARY.agent },
    },
    {
      name: "rewrites",
      firstOf: [
        { name: "mdx_index", when: { path: [...MDX_INDEX_PATHS] }, rewrite: blogMarkdown },
        { name: "mdx_llms_post", when: { pathRegex: MDX_LLMS_POST }, rewrite: post },
        { name: "mdx_post", when: { pathRegex: paths.mdxPost }, rewrite: post },
        {
          name: "markdown_index",
          when: { ...markdown, path: paths.blogIndex },
          rewrite: blogMarkdown,
        },
        { name: "markdown_post", when: { ...markdown, pathRegex: paths.post }, rewrite: post },
        {
          name: "curl",
          when: {
            path: pathList(paths.curl),
            header: { "User-Agent": CURL_USER_AGENT },
          },
          rewrite: `/${tree.curl}`,
        },
        {
          name: "try_files",
          tryFiles: { root: "{vars.tree}", paths: ["{path}/index.html", "{path}"] },
        },
      ],
    },
    ...treeContentTypes(tree).map(({ paths: match, type }): Step => ({
      when: { path: pathList(match) },
      headers: { "Content-Type": type },
    })),
    { name: "serve_tree", ...files("{vars.tree}", true) },
  ];
}

function errorRoutes(manifest: FragmentManifest): Fragment["errors"] {
  return [
    {
      status: [404],
      routes: [
        { rewrite: `/${manifest.files.notFound}` },
        {
          headers: {
            "Cache-Control": CACHE_CONTROL.tree,
            Vary: VARY.tree,
            "Content-Type": NOT_FOUND_CONTENT_TYPE,
          },
        },
        ENCODE,
        // A custom status bypasses conditional requests, so no ETag sidecars here.
        files("{vars.tree}", false),
      ],
    },
    {
      routes: [
        { headers: { "Cache-Control": CACHE_CONTROL.error } },
        { respond: { body: "{err.status_code} {err.status_text}" } },
      ],
    },
  ];
}

/**
 * The route fragment of one host kind, serving the build in `root` (an absolute directory).
 * Host-kind differences are decided here, so the fragment holds only the steps of its host.
 */
export function upstreamerFragment(
  manifest: FragmentManifest,
  root: string,
  kind: HostKind,
): Fragment {
  return {
    fragment: 1,
    headers: headers(),
    routes: [
      { name: "no_ims", requestHeaders: { "If-Modified-Since": null } },
      { name: "encode", ...ENCODE },
      ...epochSteps(manifest),
      ...languageSteps(manifest),
      { name: "tree", set: { tree: `${root}/site/{vars.epoch}/${kind}/{vars.lang}` } },
      negotiationStep(),
      ...redirectSteps(kind),
      {
        name: "internal",
        when: { path: [...internalPaths(manifest.files), ...SIDECAR_PATHS] },
        error: 404,
      },
      ...sharedFileSteps(root),
      ...treeSteps(manifest, kind),
    ],
    errors: errorRoutes(manifest),
  };
}

export function renderFragment(fragment: Fragment): string {
  return `${JSON.stringify(fragment, null, 2)}\n`;
}

export interface LocalConfigOptions {
  /** Directory holding `main.json` and `blog.json`, absolute. */
  fragments: string;
  mainPort?: number;
  blogPort?: number;
}

/**
 * `dist/upstreamer/local.json`: an upstreamer config serving both host kinds over plain HTTP
 * on 127.0.0.1, for local previews (`upstreamer run dist/upstreamer/local.json`).
 */
export function localUpstreamerConfig(options: LocalConfigOptions): string {
  const { fragments, mainPort = 4801, blogPort = 4802 } = options;
  const site = (kind: HostKind, port: number): object => ({
    name: kind,
    hosts: ["*"],
    listen: [`127.0.0.1:${port}`],
    routes: [{ include: `${fragments}/${kind}.json` }],
  });
  const config = {
    version: 1,
    http3: false,
    listen: { http: [], https: [] },
    sites: [site("main", mainPort), site("blog", blogPort)],
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}
