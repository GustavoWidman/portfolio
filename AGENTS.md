# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Personal portfolio website built with Next.js 15, React 19, and TypeScript. Features a main portfolio site with sections (About, Experience, Stack, Projects) and a blog powered by fumadocs-mdx. Supports dark mode and internationalization (English/Portuguese).

## Toolchain

- **Package Manager**: `bun` - used for all package management and development scripts
- **Build Orchestrator**: `nix` - used for production builds and deployment
- **Linting**: `biome` - fast linter and formatter

## Commands

### Development
```bash
bun run dev           # Start dev server at localhost:3000
```

### Build
```bash
bun run build         # Generate OG images, build Next.js, generate locale HTML
bun run generate-og   # Generate Open Graph images only
bun run generate-locale-html  # Generate locale-specific HTML files
nix build             # Production build via Nix flake
```

### Linting
```bash
bun run lint          # Run Biome linter (biome lint)
```

### Testing
No test framework is configured. When implementing tests, ask the user which framework to use.

## Deployment

- **Nix Configuration**: `/Users/r3dlust/GitHub/nix/hosts/oracle-2/portfolio.nix`
- **Production URLs**:
  - Portfolio: `r3dlust.com`, `www.r3dlust.com`, `guswid.com`, `www.guswid.com`
  - Blog only: `blog.r3dlust.com`, `blog.guswid.com`

## Version Control

- **VCS**: `jj` (Jujutsu) - NOT git. Use `jj` commands for all version control operations
- **Default branch/bookmark**: `master`

### Commit Workflow

Before starting any new feature or individual code change:
0. Check current repository state with `jj status`
1. Optionally create a new commit to segment changes if the current state is dirty using `jj new`
2. Optionally describe the planned changes: `jj describe -m "[DESCRIPTION]"`

After completing a feature:
1. Bump version in `package.json`
2. Bump version in `flake.nix` (must match `package.json`)
3. Commit the changes: `jj commit -m "[COMMIT_MESSAGE]"`

### Viewing History
```bash
jj log -n 5            # Show last 5 commits
jj log -n 10           # Show last 10 commits
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

### Formatting (Biome)
- **Indentation**: 2 spaces
- **Linting**: Biome with recommended rules enabled
- Run `bun run lint` before committing significant changes

### TypeScript
- **Strict mode**: Enabled
- **Target**: ES2022
- Always use `import type` for type-only imports
- Use explicit return types for exported functions
- Prefer interfaces for object types, types for unions/primitives

### Imports Organization
Order imports as follows (separated by blank lines):
1. React/Next.js imports
2. Third-party libraries (lucide-react, react-icons, etc.)
3. Aliased internal imports (`@/lib/*`, `@components/*`)
4. Relative imports (`./Component`, `../lib/helper`)
5. Type imports (use `import type { X }` syntax)

Example:
```typescript
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { DATA } from "@/lib/data/content";
import type { Language } from "@/lib/types";
import CustomComponent from "./CustomComponent";
```

### React Components
- Use `"use client";` directive at the top of client components
- Define interfaces for props with PascalCase naming (e.g., `HeroProps`)
- Use `React.FC<Props>` or inline function syntax
- Export components as default, optionally wrapped with `React.memo`
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`

Component structure:
```typescript
"use client";

import React, { useMemo } from "react";
import type { ComponentProps } from "@/lib/types";

interface ExampleProps {
  value: string;
  onClick: () => void;
}

const Example: React.FC<ExampleProps> = ({ value, onClick }) => {
  const computed = useMemo(() => value.toUpperCase(), [value]);
  
  return <div onClick={onClick}>{computed}</div>;
};

export default React.memo(Example);
```

### Styling
- **Tailwind CSS 4** with custom theme configuration
- Use Tailwind utility classes; avoid custom CSS unless necessary
- Dark mode: use `dark:` prefix (e.g., `text-black dark:text-white`)
- Custom colors use zinc palette (`zinc-400`, `zinc-500`, `zinc-900`, etc.)
- Custom CSS classes defined in `app/globals.css`

### Naming Conventions
- **Files**: PascalCase for components (`Hero.tsx`, `BlogNavbar.tsx`)
- **Components**: PascalCase (`Hero`, `BlogNavbar`)
- **Functions**: camelCase (`formatDate`, `getDuration`)
- **Constants**: SCREAMING_SNAKE_CASE for globals (`IS_OPEN_TO_WORK`, `DATA`)
- **Types/Interfaces**: PascalCase (`Language`, `BlogPost`, `HeroProps`)
- **Props interfaces**: ComponentName + Props (`HeroProps`, `NavbarProps`)

### Error Handling
- Use TypeScript's strict null checking
- Provide fallback values for optional data
- Handle undefined/null explicitly with optional chaining (`?.`) or nullish coalescing (`??`)
- API routes should export `dynamic = "force-static"` for static builds

### Exports
- Barrel exports via `index.ts` files (see `components/portfolio/index.ts`)
- Named exports for utilities and types
- Default exports for React components
- Re-export wrapped components when needed

## Directory Structure

```
/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with fonts and providers
│   ├── page.tsx            # Home page
│   ├── blog/               # Blog section
│   │   ├── page.tsx        # Blog listing
│   │   ├── [slug]/         # Individual blog posts
│   │   └── layout.tsx      # Blog layout
│   ├── api/search/         # Search API route
│   └── globals.css         # Global styles
├── blog/                   # MDX blog posts (fumadocs-mdx)
│   └── [slug]/             # Each post in its own directory
│       ├── imgs/           # Post-specific images (bundled)
│       ├── en.mdx          # English version
│       └── pt.mdx          # Portuguese version
├── components/
│   ├── portfolio/          # Main site components
│   └── blog/               # Blog-specific components
├── lib/
│   ├── types.ts            # TypeScript type definitions
│   ├── helpers.ts          # Utility functions
│   ├── config.ts           # Site configuration (timezone, etc.)
│   ├── source.ts           # Blog post data fetching
│   ├── data/content.tsx    # Static content (projects, experience, translations)
│   └── useLanguage.ts      # Language hook
└── scripts/                # Build scripts (OG generation, locale HTML)
```

## Path Aliases

Configured in `tsconfig.json`:
- `@/*` → root directory
- `@components/*` → `./components/*`
- `@lib/*` → `./lib/*`
- `fumadocs-mdx:collections/*` → `./.source/*` (auto-generated)

## Key Dependencies

- **Next.js 15**: App Router, static export
- **React 19**: UI framework
- **Tailwind CSS 4**: Styling with custom theme
- **fumadocs-mdx/ui**: Blog documentation system
- **lucide-react**: Icon library
- **react-icons**: Additional icons
- **zod**: Schema validation for MDX frontmatter
- **next-themes**: Dark mode support

## Internationalization

- Supported languages: English (`en`), Portuguese (`pt`)
- Translations stored in `lib/data/content.tsx` under `DATA` object
- Language state managed via `useLanguage` hook
- Blog posts have separate files per language (`blog/slug/en.mdx`, `blog/slug/pt.mdx`)

## Scheduled Blog Posts

- Posts with a future date are considered "scheduled" and displayed differently on the blog listing
- Scheduled posts show a live countdown timer and are not accessible via URL
- Site timezone is configured in `lib/config.ts` (`SITE_TIMEZONE`)
- All dates are interpreted in the configured timezone and displayed in the user's browser timezone
- Use `getDateInTimezone()` and `normalizeToTimezoneMidnight()` from `lib/helpers.ts` for date handling

## Performance Patterns

- Use `React.memo` with custom comparison for scroll-based components
- Apply `will-change` CSS property only when actively animating
- Use `contain: style` for sections with complex layouts
- GPU acceleration via `.gpu-accel` class when needed
- Memoize expensive calculations in scroll handlers
- Use `useMemo` for derived state that depends on scroll position

## Build Notes

- Build requires `bun` runtime
- Postinstall runs `fumadocs-mdx` to process MDX content
- OG images generated at build time via `scripts/generate-og.tsx`
- Static export compatible (no server-side runtime)
- Production deployments use Nix flakes; see `/Users/r3dlust/GitHub/nix/hosts/oracle-2/portfolio.nix`
- Nix build requires `vips` and `stdenv.cc.cc.lib` for sharp (image processing)
- Blog images are bundled with posts via fumadocs-mdx `useImport: true`
