# portfolio

my personal portfolio website. built with react and typescript, featuring dark mode support, multi-language content, smooth scroll animations, and an introductory terminal sequence. includes sections for about, experience, technical stack, projects, and more.

## stack

- **react** 19 — ui framework with hooks for state management
- **typescript** — static typing throughout the codebase
- **tailwind css** — utility-first styling with custom configurations
- **vite** — fast build tooling and dev server
- **bun** — package manager and runtime
- **lucide-react** & **react-icons** — comprehensive icon libraries
- **@fontsource** — self-hosted fonts (inter and jetbrains mono)

## getting started

### development

```bash
bun install
bun run dev
```

the dev server will start at `http://localhost:3000`. changes are hot-reloaded automatically as you work.

### building

```bash
bun run build
```

outputs the compiled site to `dist/`. ready for static hosting.

### linting

```bash
bun run lint
```

uses biome for code quality checks.

## features

- **responsive design** — works across desktop, tablet, and mobile
- **dark mode** — theme toggle with persistent state
- **internationalization** — support for multiple languages
- **smooth interactions** — scroll-triggered animations and parallax effects
- **intro sequence** — animated terminal-style introduction on first visit
- **type-safe** — fully typed components and data structures

## nix

to build with nix:

```bash
nix build
```

the build process compiles the site using bun and outputs static assets. the output is available in `./result` and ready for deployment.

the flake uses `bun2nix` to manage dependencies reproducibly, with dependency metadata kept in `.bun.nix`. this is regenerated automatically when dependencies change.

## license

[mit](LICENSE) — gustavo widman, 2025
