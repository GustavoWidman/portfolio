# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Personal portfolio and blog of Gustavo Widman, built as a fully static site with Astro 7 and TypeScript and served directly by Caddy or upstreamer (no application process). The home page presents identity, selected work, research, writing, experience, open source and contact; the blog renders the posts in `blog/`. Every page exists in English and Portuguese at the same URL (the web server picks the variant), with light/dark themes and no framework JavaScript.

## Toolchain

- **Package Manager**: `bun` - used for all package management and scripts
- **Site generator**: `astro` (static output, no adapter)
- **Build Orchestrator**: `nix` - used for production builds and deployment
- **Linting**: `oxlint`
- **Formatting**: `oxfmt` (configured in `.oxfmtrc.json`; `blog/` and fixtures are never formatted)

## Commands

```bash
bun run dev           # astro dev; main-host URLs (/, /blog, /blog/<slug>, ...) are mapped to the newest epoch
bun run build         # static build into dist/ (see "Build output")
bun run check         # astro check (TypeScript, .astro files)
bun run check:headings  # built heading ids vs scripts/fixtures/heading-ids.json (run after build)
bun run check:dates   # publication-date assertions, default TZ and TZ=UTC
bun run check:meta    # head tags, JSON-LD and Open Graph images of every built page (run after build)
bun run check:routes  # Caddy route matrix on dist/ + epoch gate on dist-routes/ (run after build; needs caddy)
bun run check:replays # replay model assertions, plus every built replay figure against its data (after build)
bun run check:routes --server upstreamer  # the same matrix through upstreamer ($UPSTREAMER or upstreamer on PATH)
bun run og:preview    # render every Open Graph card into dist-og/ (template review, no build)
bun scripts/replay-from-gungnir.ts <trial dir> --out blog/<slug>/replays/<name>.json --meta … --quote …
                      # session replay of one released gungnir trial (see "Session Replays")
caddy run --config dist/caddy/Caddyfile.local   # preview: main host :4801, blog host :4802 (from the project root)
upstreamer run dist/upstreamer/local.json      # the same preview through upstreamer
bun run lint          # oxlint
bun run format        # oxfmt
nix build -L .        # production build via the Nix flake
```

`PORTFOLIO_BUILD_TIME` (unix seconds) sets the build reference time; without it the build uses the latest committer time of `jj log -r @-` (every parent of a merge, then `git log -1`). The wall clock is never used. `PORTFOLIO_COMMIT` (a hexadecimal commit id) sets the commit shown in the footer status line; without it the build reads the parent commit from jj, then git, and leaves the commit out when neither exists (`src/lib/build-info.ts`). `PORTFOLIO_EXTRA_POSTS_DIR` adds a directory of extra posts (`<slug>/<lang>.mdx`, no local images; replay files resolve against the post's own directory) for tests. `PORTFOLIO_SERVE_ROOT` (an absolute directory) is where the build will be served from, written into the upstreamer fragments; without it they name the absolute path of `dist/`.

### Testing

No test framework is configured; checks are standalone scripts in `scripts/`. When adding a test framework, ask the user which one to use.

## Build Output

```
dist/
  _astro/                 the client module and its chunks, the subset fonts, optimized images,
                          replay data (`<name>.<hash>.json`) (immutable)
  static/                 files from public/ (favicon, résumé PDFs, robots.txt)
  site/manifest.json      epochs (name, start), hosts, languages, machine file names, og images
  site/<epoch>/og/        Open Graph images released in that epoch (served at /og/<file>)
  site/<epoch>/<host>/<lang>/
      index.html, blog/index.html, blog/<slug>/index.html   (host "main")
      index.html, <slug>/index.html                         (host "blog")
      404.html, sitemap.xml, llms.txt, llms-full.txt, _curl.txt, console.json,
      _md/blog.md, _md/blog/<slug>.md, blog/rss.xml (main) | rss.xml (blog)
  caddy/portfolio.caddy   generated Caddy snippet (see "Web Server")
  caddy/Caddyfile.local   local preview config importing the snippet
  upstreamer/main.json, upstreamer/blog.json
                          generated upstreamer route fragments (see "Web Server")
  upstreamer/local.json   local preview config including the fragments
  **/<file>.{br,zst,gz}   precompressed sidecars of every html/css/js/json/xml/txt/md/svg file
                          in _astro/, static/ and the trees (Brotli 11, zstd 19, gzip 9)
  **/<file>.etag          content-hash ETag sidecars for site/ and static/, sidecars included (not og/)
```

- **Epochs**: `e0` is the site at the build reference time; every later post release starts another epoch with that post included. The web server serves the newest epoch whose start has passed.
- **Hosts**: `main` (guswid.com, r3dlust.com, www.) has the blog under `/blog/`; `blog` (blog.guswid.com, blog.r3dlust.com) has it at `/`. Blog-tree links to the portfolio are absolute `https://guswid.com/...`.
- **Languages**: `en` and `pt` trees; the web server picks one per request (`?lang` > cookie `portfolio_lang` > `Accept-Language` pt* > en).
- **Open Graph images**: `portfolio-<lang>.png`, `blog-index-<lang>.png` and `<slug>-<lang>.png` (1200x630) are rendered once after the build and written into every epoch where their page exists, so the image of a scheduled post is not reachable before its release.

## Deployment

- **Nix Configuration**: `/Users/r3dlust/GitHub/nix/hosts/oracle-2/portfolio.nix`
- **Server**: Caddy (default) or upstreamer serves `dist/` directly.
- **NixOS module** (`nixosModules.default`): `services.portfolio = { enable; proxy; package; domains; blogDomains; virtualHostConfig; }`. It only adds virtual hosts and enables their server by default. With `proxy = "caddy"` (the default) it adds `services.caddy.virtualHosts`, each importing the generated snippet with `import <package>/caddy/portfolio.caddy <package> main|blog`; per-host directives such as `tls` go in `services.caddy.virtualHosts.<host>.extraConfig`, which NixOS merges with the module. With `proxy = "upstreamer"` it adds `services.upstreamer.virtualHosts`, each with the single route step `{ include = "<package>/upstreamer/main.json"; }` (or `blog.json`); per-host settings such as `tls.acmeCert` go in the same virtual hosts. The host must import upstreamer's NixOS module (an assertion says so), which runs `upstreamer check` over the config when the system is built; the flake has no upstreamer input, and defines the upstreamer virtual hosts only when `services.upstreamer` is declared, since defining an undeclared option fails evaluation even under a false `mkIf`. `virtualHostConfig` is Caddy configuration and must stay empty with upstreamer. There is no service, port or runtime Bun; setting the removed `port`/`host` options fails evaluation with a migration message.
- **Production URLs**:
  - Portfolio: `r3dlust.com`, `www.r3dlust.com`, `guswid.com`, `www.guswid.com`
  - Blog only: `blog.r3dlust.com`, `blog.guswid.com`

## Web Server

`dist/caddy/portfolio.caddy` is generated from `dist/site/manifest.json` by `src/caddy/snippet.ts`, and `dist/upstreamer/{main,blog}.json` by `src/upstreamer/fragment.ts`, from the same rule data in `src/lib/serving.ts` (headers, cache and Vary values, content types, internal paths, redirect and negotiation patterns, the paths that differ per host kind). Both are written by the Astro integration `caddyConfig()`, the last one in `astro.config.ts`, which also writes the precompressed and ETag sidecars; `bun scripts/caddy.ts [dist]` regenerates all of them in a finished build. A rule changes in `src/lib/serving.ts` (or `src/lib/agents.ts`), so both servers follow it. A Caddy site block imports the snippet with `import <dist>/caddy/portfolio.caddy <dist> main|blog`. It implements, in order:

- epoch selection (`expression int({time.now.unix}) >= <start>` per epoch) and language selection (`?lang` > cookie `portfolio_lang` > first `Accept-Language` tag `pt*` > `en`), giving the tree `<dist>/site/<epoch>/<host>/<lang>`;
- markdown negotiation (rules in `src/lib/agents.ts`) on the blog index and posts, served in place from `_md/`;
- 301s: blog host `/blog[/<path>]` to `/<path>`, trailing slashes, `index.html` (query kept; paths with a backslash or a control character are refused, so no `Location` can read as `//host`);
- `/_astro/*` (immutable), `/og/*` (per epoch), `public/` files from `static/`, then the tree: `.mdx`/llms routes, negotiated markdown, the curl card (`curl/*` on `/`, plus `/index` on main), `try_files {path}/index.html {path}`;
- headers: content types for html/md/txt/rss/sitemap, `Cache-Control` (`private, no-cache` for the tree and its 404 pages: one URL answers in several languages, epochs and formats, so shared caches must not store it even where they ignore `Vary`; 1 h for static and OG; immutable for `_astro`), `Vary` (`Cookie, Accept-Language`, plus `User-Agent, Accept` where negotiation applies), security headers, no `Server` or `Last-Modified` (Nix store mtimes are constant; validation uses the `.etag` sidecars);
- `handle_errors 404` with the tree's `404.html`;
- `file_server` sends the precompressed sidecars, Brotli first, then zstd, then gzip (browsers weigh br and zstd equally, and Brotli 11 is the smallest of the three for every file of the site); each encoding has its own ETag and answers `If-None-Match` with 304. `encode zstd gzip` only compresses what has no sidecar. Sidecar paths (`*.etag`, `*.br`, `*.zst`, `*.gz`) are 404.

The upstreamer fragments implement the same list as route steps, one fragment per host kind, so the host-kind tests of the snippet are decided when the fragment is generated. Epoch gates are `after` matchers; upstreamer reads its clock once per second, so a release goes live up to a second after its start. upstreamer's `path` matcher is case-sensitive where Caddy's is not, so a path differing only in case from a rewritten path (`/BLOG` with markdown wanted, `/Index` for curl) is not rewritten under upstreamer.

HSTS and TLS are left to the deployment. `bun run check:routes [--dist <dir>] [--server caddy|upstreamer]` asserts the whole matrix with real requests, including both sides of an epoch gate and posts whose language versions are released at different times (fixture posts in `scripts/fixtures/scheduled-posts/`, built into `dist-routes/`). It also checks `wantsMarkdown()` against the same negotiation table as Caddy, and that every tree has a post page exactly where it has the post's markdown, in the same language.

## Version Control

- **VCS**: `jj` (Jujutsu) - NOT git. Use `jj` commands for all version control operations
- **Default branch/bookmark**: `master`

### Commit Workflow

Before starting any new feature or individual code change: 0. Check current repository state with `jj status`

1. Optionally create a new commit to segment changes if the current state is dirty using `jj new`
2. Optionally describe the planned changes: `jj describe -m "[DESCRIPTION]"`

After completing a feature:

1. Bump version in `package.json` (the flake reads its version from there)
2. Commit the changes: `jj commit -m "[COMMIT_MESSAGE]"`

### Viewing History

```bash
jj history -n 5            # Show last 5 commits
jj history -n 10           # Show last 10 commits
```

### Commit Message Style

**IMPORTANT**: Before creating a commit, run `jj history -n 5` to review recent commit messages and match the established style:

- Use conventional commits format: `type(scope): description`
- Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`
- Keep descriptions lowercase, concise, and in imperative mood
- Example: `refactor(blog): restructure posts to use bundled images`

### Keeping AGENTS.md Updated

**IMPORTANT**: After any change that affects project structure, workflows, or conventions:

1. Update `AGENTS.md` to reflect the change
2. Commit AGENTS.md changes separately with: `jj commit -m "docs(agents): [description]"`
3. Do not bump version for AGENTS.md-only changes
4. Examples of changes requiring AGENTS.md updates:
   - New directories or file structure changes
   - New commands or scripts
   - Changes to build/deployment process
   - New dependencies or tooling changes
   - Modified conventions or patterns

### Restrictions

- **NEVER** move or set bookmarks
- **NEVER** push to remote
- These actions are the sole responsibility of the user

## Code Style Guidelines

### Formatting (oxfmt)

- **Indentation**: 2 spaces
- **Linting**: oxlint with recommended rules enabled
- Run `bun run lint`, `bun run format` and `bun run check` before committing significant changes

### TypeScript

- **Strict mode**: Enabled (`astro/tsconfigs/strict`)
- Always use `import type` for type-only imports
- Use explicit return types for exported functions
- Prefer interfaces for object types, types for unions/primitives

### Imports Organization

Order imports as follows (separated by blank lines):

1. Node built-ins (`node:fs`, `node:path`)
2. Astro virtual modules and third-party packages (`astro:content`, `shiki`)
3. Relative imports (`../lib/config`)
4. Type imports (`import type { X }`), last in each group

Example:

```typescript
import { readFileSync } from "node:fs";

import { getCollection } from "astro:content";

import { computeEpochs } from "./epochs";
import type { Language } from "./config";
```

### Astro Components

- Pages are generated from `src/pages/site/[epoch]/[host]/[lang]/[...path].astro` (HTML) and `[...file].ts` (machine files); page bodies live in `src/components/pages/`, the home page's parts in `src/components/home/`, the figures (bars, columns, meters, blocks, bytes, walk, the hero scope) in `src/components/figures/`, and the post's key-figures box in `src/components/blog/`.
- Define a `Props` interface in the frontmatter of each component.
- All user-facing strings come from `src/i18n/` via `t(lang)`; content data lives in `src/data/*.ts` with both languages side by side: `profile`, `work` (spec sheets and smaller builds), `research`, `experience`, `open-source`, `benchmark` (the upstreamer numbers every figure and readout derives from), `readouts`, `post-figures` (a post's list figure and key figures), `figure-types` and `format` (figure shapes, numbers formatted per language), `types` (`Localized`, `Text`, `pick`, `text`).
- Dates are formatted at build time with `formatDate`/`formatDateTime` (`src/i18n/index.ts`), always in `SITE_TIMEZONE`.
- Markup must work without JavaScript, and with JavaScript on but the client module blocked: whatever the module would finish (reveals, readouts, the boot screen) also reaches its final state through CSS alone. Behaviour goes in feature modules under `src/scripts/features/` (see "Client Script"); the inline head script (`src/scripts/head.ts`) stays under 1 KB.
- `Base.astro` includes `Boot.astro` (home page only, first in `<body>`).
- Write explicit spaces (`{" "}`) between inline elements on separate lines; HTML compression removes the newline.

### Styling

- Plain CSS in `src/styles/`, one file per area:
  - `global.css`: every page. Tokens, fonts, base elements, shared pieces (`.frame`, `.label`, `.unit`, `.num`, `.sep`, `.arr`, `.ul`, `.btn`, `.badge`, `.kv`, `.table-wrap` tables), header, footer, motion, print.
  - `home.css`: home page. `blog.css`: blog index and posts (with the post's print rules). `post-list.css`: post cards, on the home page and the blog index. `quirks.css`: boot screen and 404 page, on every page.
  - `console.css`: the console panel, imported with `?inline` by `src/scripts/console.ts`, so it arrives with the console chunk.
- `Base.astro` inlines the stylesheets of a page kind into one `<style>` in the head (`?inline` imports, `PAGE_STYLES`), so the first paint needs no request after the page itself. Every page is rendered by one route module, so a stylesheet imported from a component would be merged into one file served to all pages. A new stylesheet is added to `PAGE_STYLES`, never imported from a component.
- Colors are tokens on `:root`, redefined for `[data-theme="dark"]` and for `prefers-color-scheme: dark` without an explicit `data-theme="light"`, on screens only: a page prints dark on white in either theme. One accent (`--signal`, `--signal-ink` for text) marks the subject of a figure, one key value and focus. The `--screen-*` tokens (the screen of a session replay) are dark in both themes and become paper in print.
- Every font size is a `--fs-*` token. Layout uses `--maxw`, `--gx` (frame gutter), `--rail`, `--gap` and `--gut` (gap at the midline).
- Fonts are Geist and Geist Mono, self-hosted variable `woff2` files from `@fontsource-variable/*`, declared in `global.css` and preloaded in `Head.astro`. No page requests another origin. The Open Graph renderer reads the package files (`OG_FONTS` in `src/og/template.ts`).
- `fontSubsets()` (`src/integrations/font-subsets.ts`) subsets both files before Vite runs (harfbuzz and woff2 in WebAssembly, every layout feature kept) to printable ASCII, every character of the text files in `src/` and `blog/`, and what Intl writes for dates in both languages; an alias makes the stylesheet and the preloads use the subsets. After the build it fails if any page, stylesheet or script uses a character the full fonts have and the subsets lack.
- Until the web fonts arrive, text uses `Geist Fallback` and `Geist Mono Fallback` (`global.css`): local Arial, Arial Bold and Menlo with `size-adjust` fitted to the width Geist gives the site's own text and Geist's ascent and descent, so the swap keeps line breaks. Where those fonts are missing the rest of the stack applies.
- Code listings are coloured from tokens too (`--t-kw`, `--t-ty`, `--t-fn`, `--t-str`, `--t-num`, `--t-com`, `--t-attr`, light and dark values in `global.css`): `CODE_THEME` in `src/lib/markdown/code.ts` maps TextMate scopes to `var(--t-*)`, so one Shiki theme serves both color schemes.
- Touch layouts (up to 720px wide) give every control outside running text a hit area of at least 40px each way, without overlapping a neighbour's; `.ul` links get theirs from a `::before`.
- Print: the header, footer, tables of contents, copy buttons and prev/next are hidden and code wraps instead of scrolling.

### Motion

- Only `transform`, `opacity`, `clip-path`, `stroke-dashoffset` and colors are animated, with the `--dur-1..4`, `--ease-out` and `--ease-in-out` tokens. Nothing runs forever except the header LED.
- One block at the end of the motion section of `global.css` turns every animation and transition off under `prefers-reduced-motion: reduce`. Start states of entrance animations go inside `@media screen and (prefers-reduced-motion: no-preference)`, so printing shows final states.
- Reveal: an element with `data-reveal` gets `data-in` the first time it enters the viewport. CSS keys the start state off `.js [data-reveal]:not([data-in])`; `--i` (an integer set inline) staggers by 40 ms. `data-reveal="rise"` is the shared fade-and-rise, `grow` grows figures, `latch` lights a sheet's key value.
- `reveal.ts` marks `<html>` `live`. Until then every start state ends on its own after 2 s (`reveal-fallback`, `stack-fallback`), so content never stays hidden behind a module that failed to load. Readouts have the same kind of fallback, keyed off `data-ready`.
- Theme switch: `setTheme()` (`features/theme.ts`) reveals the new theme in a circle with the View Transition API; `data-vt="theme"` is on `<html>` meanwhile.
- Page navigation: `@view-transition { navigation: auto }`; the header keeps its place (`view-transition-name: site-head`), the rest cross-fades.
- Header LED (`[data-led]`): breathes in CSS; `blinkLed()` (`features/led.ts`) confirms an action, `blinkLedOnNextPage()` does so after a navigation. It is off and red on the 404 page.

### Client Script

- `src/scripts/client.ts` is the only deferred module: a registry of `[selector, init]` pairs. A feature's `init` runs only when the page has an element matching its selector.
- Each feature is a module in `src/scripts/features/` exporting `init`. Features own their elements and reach each other only through exported functions. Shared helpers are in `src/scripts/util.ts`.
- Features and selectors: `theme` (`[data-theme-toggle]`), `language` (`a[data-lang-switch]`), `led` (`[data-led]`), `reveal` (`[data-reveal]`), `boot` (`[data-boot]`), `code` (`[data-copy-code]`), `countdown` (`[data-countdown]`), `console-trigger` (`[data-console-open]`), `replay` (`figure[data-replay]`).
- Component scripts: the hero scope's cursor (`features/scope-cursor.ts`, imported by `ScopeFigure.astro`) and the readouts' count-up (`features/readouts-count.ts`, imported by `Readouts.astro`) are separate modules that only the home page loads.
- Theme state is one value, `light | dark | system`: `data-theme` on `<html>` holds an explicit choice (mirrored in localStorage `theme`), its absence means `system`. The button follows an OS change under `system`.
- A page restored from the back/forward cache (`pageshow` with `persisted`) re-applies the stored theme and reloads when the language cookie no longer matches it.
- With cookies refused, the language switch navigates to `?lang=` so the choice still holds for that page.
- Same-origin page links are prefetched by Speculation Rules with `moderate` eagerness (`Head.astro`; pointer rest or touch start). Documents are only fetched, never prerendered: a prerender would run the head script and the client module early (boot cookie, LED blink, language reload, theme). Links with an extension and the language links are excluded.
- The module stays under 6 KB minified with every feature. The console and the replay player are separate chunks: the console loads on first use, the player when a replay figure comes within a screen of the viewport. `astro.config.ts` replaces Vite's dynamic-import preload helper with a plain call, because neither chunk has CSS to preload and their one dependency is the module that imports them.

### Quirks

- Boot screen (`Boot.astro`, home page only): a power-on self-test whose lines are facts of the build, ending in READY. The head script adds `boot` to `<html>` on the first home view of a browser session: the session cookie `boot` (on the registrable domain, so every tab and both hosts share it) is set, and the screen runs only if the cookie took; never under reduced motion. CSS plays and dismisses it in 1.3 s on its own; `features/boot.ts` ends it early on any key or click, without letting the key scroll the page or the click follow a link under the screen.
- Serial console (`src/scripts/console.ts`; its data is the tree's `console.json`, written by `src/lib/machine/console.ts` and fetched together with the chunk on first open, from the URL in the footer button's `data-console-open`): a modal `<dialog>` opened by the footer's `$ curl guswid.com` button or the backtick key. Commands: `help`, `whoami`, `ls [blog]`, `exp`, `cv en|pt`, `blog`, `open <slug>`, `theme [light|dark|system]`, `lang en|pt`, `version`, `clear`, `sudo`, `exit`; `rm -rf /` panics and reboots into the home page with the `boot` cookie cleared. History with the arrow keys, Tab completes commands and slugs, input is always printed as text; Escape and the backdrop close it and focus returns.
- 404 page (`NotFoundPage.astro`): a flat-lined scope; an inline script shows the requested path and the nearest post (edit distance over the slugs in the page's `#nf-posts` list).

### Naming Conventions

- **Files**: PascalCase for components (`PostCard.astro`), kebab-case for modules (`post-render.ts`)
- **Functions**: camelCase (`formatDate`, `renderMarkdown`)
- **Constants**: SCREAMING_SNAKE_CASE for globals (`SITE_URL`, `PROJECTS`)
- **Types/Interfaces**: PascalCase (`Language`, `Post`, `PageMeta`)

### Error Handling

- Use TypeScript's strict null checking
- Provide fallback values for optional data
- Handle undefined/null explicitly with optional chaining (`?.`) or nullish coalescing (`??`)

### Exports

- Named exports for modules; Astro components are default exports by nature.

## Directory Structure

```
/
├── astro.config.ts          # static build, asset naming, integrations
├── blog/<slug>/             # posts: en.mdx, pt.mdx, imgs/, replays/ (never modified by tooling)
├── public/                  # copied to dist/static/
├── scripts/                 # standalone checks (+ fixtures/), og-preview.ts, replay-from-gungnir.ts, compile-resumes.sh
├── src/
│   ├── content.config.ts    # `blog` collection (custom loader + zod schema)
│   ├── content/             # loader.ts, schema.ts, source.ts (file reading, frontmatter)
│   ├── data/                # site content and measured figures, EN and PT side by side
│   ├── i18n/                # en/ and pt/ (chrome, home, blog, quirks), index.ts: t(), date formatting
│   ├── integrations/        # font-subsets, dist-layout (dist/static, 404.html, manifest), og-images, caddy, dev-routes
│   ├── caddy/               # snippet.ts (Caddy config generator), write.ts (dist/caddy/*, precompressed and ETag sidecars)
│   ├── upstreamer/          # fragment.ts (upstreamer route fragments, local config), write.ts (dist/upstreamer/*)
│   ├── og/                  # Open Graph images: template.ts (the look), render.ts (satori + resvg), images.ts
│   ├── lib/
│   │   ├── config.ts        # site constants (SITE_URL, SITE_TIMEZONE, languages, hosts)
│   │   ├── publication-date.ts, epochs.ts, posts.ts, release.ts, routes.ts, urls.ts, seo.ts
│   │   ├── build-info.ts    # version, commit and date shown on the site
│   │   ├── markdown/        # render.ts (unified + GFM), code.ts (Shiki), images.ts, image-refs.ts
│   │   ├── machine/         # llms, feeds (sitemap, RSS), curl card, console data, files.ts (endpoint wiring)
│   │   ├── agents.ts        # AI User-Agent list and markdown negotiation rules
│   │   └── serving.ts       # web-server rule data shared by the Caddy and upstreamer generators
│   ├── layouts/Base.astro
│   ├── components/          # Head, SiteHeader, SiteFooter, Boot, PostCard, ScheduledCard, Toc,
│   │                        # pages/, home/, figures/, blog/
│   ├── pages/site/[epoch]/[host]/[lang]/
│   ├── scripts/             # head.ts (inline), client.ts (shared module), util.ts, features/, console.ts and
│   │                        # replay.ts (chunks), replay-model.ts (replay format, shared with the renderer)
│   └── styles/              # global.css, quirks.css, home.css, post-list.css, blog.css, console.css
├── typst/                   # résumé sources
└── nix/bun.nix              # patched Bun for Nix builds
```

## Blog Rendering

- Posts are CommonMark + GFM with YAML frontmatter (`title`, `date`, `excerpt`, `tags`); they are not compiled as MDX and math is not enabled.
- Heading ids come from github-slugger over the heading text (inline code included), deduplicated per document; `scripts/check-heading-ids.ts` guards all of them.
- h2 and h3 are numbered in document order. The number is an empty `<a class="heading-number" href="#id" data-number="2.1" aria-label="2.1">` before the heading text, drawn by CSS, so the heading's text stays the post's own; the tables of contents show the same numbers. h4 to h6 wrap their text in `a.heading-anchor`.
- Images carry `width`, `height` and an inline `aspect-ratio`, so their box is reserved even when the file fails to load.
- Local images (`./imgs/<file>`) are resolved through `virtual:post-images` (only referenced files are imported) and optimized to AVIF/WebP `srcset`s; SVG files are served as-is via `<img>`. A GIF stays the `<img>` inside a `<picture>` whose `<source type="image/webp">` is its lossless animated WebP (same frames, delays and loop; made with sharp by `postImagesPlugin` and cached under Vite's cache directory), unless the WebP would not be smaller.
- Every post image is `loading="lazy"`: a post opens with its title, excerpt and text, so the first image is below the first viewport and no image is the largest paint.
- An image on a line of its own becomes `<figure>` with its title, else alt text, as caption.
- A fenced block with the language `replay` is a session replay, not a listing (see "Session Replays").

## Session Replays

A replay plays a coding agent's session in a post: every shell command, the compiler errors and the agent's own words scroll through a screen, with a barcode of the session (a tick per command, red for a failed build), counters and the author's notes.

````markdown
```replay ./replays/zig-bigint.json
Caption of the figure, any number of lines.

20: A note, shown from command 20 on while the replay plays.
112: Another note.
```
````

- The block stays readable in the markdown served to agents: the info string names the file, `<n>: <text>` lines are notes, every other line is the caption. Notes are per language; the data is shared.
- Data lives in `blog/<slug>/replays/<name>.json`, format version 1 (`src/scripts/replay-model.ts`): `meta` (strings shown in the head), `minutes`, `result` (`passed`/`total` hidden tests), `events` (`c` command on one line, `e` first compiler error, `f: 1` for a failed build) and `quotes` (`at`, verbatim `text`, optional `mark`). `bun scripts/replay-from-gungnir.ts` writes one from a trial of the released gungnir records, counting failed builds as the paper does.
- `virtual:post-replays` (`src/lib/markdown/replay-refs.ts`) validates every referenced file and emits it minified as `_astro/<name>.<hash>.json`; `src/lib/markdown/replays.ts` builds the figure at rest (the end of the session, the result, every note), which is all a page without the player shows.
- The player (`src/scripts/replay.ts`, loaded by `features/replay.ts`) starts by itself when the screen is mostly in view, never under reduced motion; it pauses out of view and resumes on return. Play/pause, the barcode (a range input over it, arrows step a command) and the notes (each seeks to its command) take over. Controls appear only with `data-ready`, a session in progress has `data-active`.
- A session plays in about half a minute whatever its length (`schedule()`), slow for the first commands and holding on every command with a note or a quote.

## Internationalization

- Supported languages: English (`en`), Portuguese (`pt`); UI strings in `src/i18n/`, content in `src/data/`.
- Strings are split by area: `src/i18n/en/{chrome,home,blog,quirks}.ts` and the same files under `pt/`. Each file exports one object of top-level dictionary keys; `index.ts` spreads them into one dictionary per language, so a top-level key belongs to exactly one area. The English object is the shape: each `pt` file is typed as `Widen<typeof en>` (`src/i18n/types.ts`), so a key missing from or only present in one language fails `bun run check`.
- The same URL serves both languages; the web server selects the tree. `<html lang>` matches the served tree, except on a post page that shows the other language version (see Scheduled Blog Posts).
- The EN/PT toggle is a `?lang=` link; with JavaScript it also stores the choice (localStorage and the `portfolio_lang` cookie, shared across the apex and `blog.` hosts) and reloads without `?lang`. On the site's domains the cookie carries `Domain=`; a host-only `portfolio_lang` cookie next to it would be sent first and win on the server, so the toggle and the head script remove it.

## Page Metadata

- `src/lib/seo.ts` builds a `PageMeta` per page (title, description, canonical, Open Graph image, markdown alternate, JSON-LD); `src/components/Head.astro` renders it with the RSS alternate, Open Graph and Twitter tags.
- Canonical URLs always use `https://guswid.com` with the blog under `/blog`, on both hosts. 404 pages are `noindex` without a canonical URL.
- JSON-LD: home has `Person` and `WebSite`; the blog index has `Blog` (listing the released posts) and `BreadcrumbList`; posts have `BlogPosting` and `BreadcrumbList`. `serializeJsonLd()` escapes `<`.
- The Open Graph card design lives entirely in `src/og/template.ts` (size, fonts from `@fontsource`, colors, layout); `src/og/images.ts` decides which cards exist and their text.
- `bun run check:meta` validates all of the above on the built `dist/`, including that each epoch has exactly the Open Graph images of its released pages.

## Scheduled Blog Posts

- A post whose release instant is after the epoch start is absent from that epoch: no page (404), no markdown, llms, sitemap, feed or curl entry. The blog index shows it as a "coming soon" card with a countdown that reloads the page at zero.
- Each language version has its own date. A slug is available once any version is released; a tree serves its own language when that version is out, else the released one (`src/lib/release.ts`). Pages, listings, per-post markdown, feeds and the curl card all use this rule; a post page renders entirely in the language of the version it shows.
- Date-only metadata releases at site-local midnight. For an exact release, use a quoted ISO timestamp with an explicit offset (e.g. `date: '2026-10-21T16:00:00-03:00'`).
- Use `getPublicationDate()`, `formatDateValue()` and `isScheduled()` from `src/lib/publication-date.ts`.
- Regression assertions: `bun run check:dates`.

## Build Notes

- Nix builds use the patched Bun runtime from `nix/bun.nix` (1.4.4 or newer). The flake exports `packages.<system>.bun` and `overlays.default` for consumers, for `aarch64-darwin`, `aarch64-linux` and `x86_64-linux`.
- `packages.default` is the static `dist/` (no executables): bun2nix installs the dependencies, `bun --bun run build` runs with `PORTFOLIO_BUILD_TIME = self.lastModified`, `PORTFOLIO_SERVE_ROOT=$out` and `PORTFOLIO_COMMIT` set to the flake's revision (the parent commit for a dirty tree), then `check:headings`, `check:meta`, `check:dates` and `check:replays` run before install. On Linux the build sets `LD_LIBRARY_PATH` to libstdc++/libgcc_s for the prebuilt sharp and resvg modules. `checks.<system>.caddy-config` validates the generated Caddy snippet with `caddy validate`. `checks.<system>.module-eval` evaluates a NixOS host with each `proxy` (upstreamer's options from a stub) and checks the virtual hosts, the assertions, and that every included fragment exists in the package.
- The flake source is filtered to `package.json`, `bun.lock`, `astro.config.ts`, `tsconfig.json`, `src/`, `blog/`, `public/` and `scripts/`; files needed by the build must be in one of them (and tracked, for `nix build .`).
- `astro build` runs under Node or Bun (`bun --bun x astro build`) with the same output, except that Node's ICU puts thin spaces around the en dash of a date range where Bun puts plain spaces, and the gzip sidecars differ byte for byte (different zlib builds). Sharp is needed at build time only. Font subsetting uses `harfbuzzjs` and `wawoff2` (WebAssembly, no native code); precompression uses `node:zlib` (Brotli and zstd are built into Node and Bun).
- `bun.lock` must stay at `lockfileVersion: 1`: `bun2nix` (postinstall) does not read version 2. Do not delete the lockfile; `bun install` keeps the existing version.
- Dependency updates must refresh both `bun.lock` and `.bun.nix` (`bun install` runs `bun2nix -o .bun.nix`).
