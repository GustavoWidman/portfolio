# portfolio

my personal portfolio website. built with next.js 15 and react 19, featuring a blog powered by fumadocs-mdx, dark mode support, multi-language content (english/portuguese), smooth scroll animations, and an interactive terminal gimmick. includes sections for about, experience, technical stack, projects, and contact.

## stack

- **next.js** v16 — app router with static export
- **react** v19 — ui framework with hooks for state management
- **typescript** — static typing throughout the codebase
- **tailwind css** v4 — utility-first styling with custom theme
- **fumadocs-mdx** — blog/documentation system with mdx support
- **bun** — package manager and runtime
- **nix** — reproducible production builds via flakes
- **lucide-react** & **react-icons** — comprehensive icon libraries
- **next-themes** — dark mode with persistent state
- **zod** — schema validation for mdx frontmatter

## getting started

### development

```bash
bun install
bun run dev
```

the dev server will start at `http://localhost:3000`. changes are hot-reloaded automatically as you work.

### preview

```bash
bun run preview
```

this will generate a production build and serve the `out` directory at `http://localhost:3000` for testing before deployment.

### building

```bash
bun run build
```

runs og image generation, next.js build, and locale-specific html generation. outputs the compiled site to `out/`. ready for static hosting.

### linting

```bash
bun run lint
```

uses oxlint for code quality checks.

### formatting

```bash
bun run format
```

uses oxfmt for code formatting.

## features

- **responsive design** — works across desktop, tablet, and mobile
- **dark mode** — theme toggle with persistent state (defaults to dark)
- **internationalization** — english and portuguese support
- **blog** — mdx-powered blog with syntax highlighting and search
- **scheduled posts** — future-dated posts show countdown timers
- **smooth interactions** — scroll-triggered animations and parallax effects
- **intro sequence** — animated terminal-style introduction on first visit
- **interactive terminal** — command-line gimmick with easter eggs
- **version footer** — shows version, commit hash, and dev mode indicator
- **type-safe** — fully typed components and data structures
- **og images** — auto-generated open graph images for social sharing

## directory structure

```
app/                 # next.js app router pages and layouts
blog/                # mdx blog posts (per-language files)
components/          # react components (portfolio/ and blog/)
lib/                 # utilities, types, config, and content data
scripts/             # build scripts (og generation, locale html)
```

## nix

to build with nix:

```bash
nix build
```

the build process compiles the site using bun and outputs static assets. the output is available in `./result` and ready for deployment.

the flake uses `bun2nix` to manage dependencies reproducibly, with dependency metadata kept in `.bun.nix`. this is regenerated automatically when dependencies change.

the commit hash is embedded at build time via `SOURCE_COMMIT` environment variable, enabling deployment tracking.

## deployment

production is deployed via nixos configuration at `/Users/r3dlust/GitHub/nix/hosts/oracle-2/portfolio.nix`.

- **portfolio**: `r3dlust.com`, `www.r3dlust.com`, `guswid.com`, `www.guswid.com`
- **blog only**: `blog.r3dlust.com`, `blog.guswid.com`

## license

[mit](LICENSE) — gustavo widman, 2025
