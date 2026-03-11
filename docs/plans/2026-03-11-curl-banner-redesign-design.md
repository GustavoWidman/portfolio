# cURL Banner Redesign Design

## Goal

Redesign the `curl guswid.com` response from a simple box layout to an elaborate ASCII art banner inspired by `curl ysap.sh`, featuring a figlet "rectangles" logo, side-by-side info boxes, and a blog posts section.

## Architecture

The existing curl response system (proxy.ts → curl-response.ts → content.tsx) stays intact. Only the response builder and data model change. The proxy layer and language detection remain unchanged.

## Visual Design

### Color Scheme (Dracula-inspired Purple/Pink)

- **Logo:** Magenta (`\x1b[35m`) + Bold
- **Borders:** Purple (`\x1b[35m`)
- **Headers:** Bold White (`\x1b[1m`)
- **URLs:** Cyan (`\x1b[36m`)
- **Blog dates:** Dim (`\x1b[2m`)
- **General text:** Default (no color)

### Layout Structure

```
 _____         _ _ _ _   _            Gustavo Widman
|   __|_ _ ___| | | |_|_| |           Backend & Systems Engineer
|  |  | | |_ -| | | | | . |
|_____|___|___|_____|_|___|           https://guswid.com | https://r3dlust.com
                                      src: https://github.com/GustavoWidman/portfolio


╭─About─────────────────────╮  ╭─Socials───┬──────────────────────────────────────────╮
│                            │  │           │                                          │
│  Backend & Systems         │  │  GitHub   │  https://github.com/GustavoWidman        │
│  Engineer passionate       │  │  LinkedIn │  https://linkedin.com/in/gustavo-widman  │
│  about low-level systems   │  │  Email    │  gustavowidman@gmail.com                 │
│  and infrastructure.       │  │  Site     │  https://guswid.com                      │
│                            │  │           │                                          │
╰────────────────────────────╯  ╰───────────┴──────────────────────────────────────────╯

  Blog Posts
  ──────────────────────────────────────────────────────────────────────────────────
  2026-03-08  Hamming Distance in Rust
  2026-02-15  NixOS Infrastructure
  2026-01-20  Zero-Dependency RNN in Rust
```

### Key Specifications

- **Logo:** "GusWid" in figlet "rectangles" font (4 lines, hardcoded)
- **Rounded box corners:** ╭ ╮ ╰ ╯
- **Box connectors:** ┬ ┴ for the Socials table column divider
- **All URLs:** Full with `https://` prefix
- **Padding:** 2+ whitespace from right box edge
- **Spacing:** Extra blank line between header area and boxes
- **Blog posts:** Dynamically pulled from blog source data, filtered by language, sorted by date, excluding scheduled posts
- **i18n:** en/pt support for all text content

## Data Model Changes

### `lib/types.ts` - curl interface

Replace current flat structure with:

```typescript
curl: {
  name: string;
  title: string;
  sites: string;        // "https://guswid.com | https://r3dlust.com"
  source: string;       // "src: https://github.com/GustavoWidman/portfolio"
  aboutHeader: string;  // "About"
  aboutText: string[];  // Multi-line about text
  socialsHeader: string; // "Socials"
  github: string;       // Full URL
  linkedin: string;     // Full URL
  email: string;        // Email address
  site: string;         // Full URL
  blogHeader: string;   // "Blog Posts"
};
```

### Content Translations

URLs stay the same in both languages. Translated fields: `title`, `aboutHeader`, `aboutText`, `socialsHeader`, `blogHeader`.

## Blog Posts Integration

The `buildCurlResponse` function imports blog post data directly from the fumadocs-mdx collections (same as `getBlogPostSummaries`). It filters by language, excludes scheduled posts, sorts by date descending, and renders each as `YYYY-MM-DD  Title`.

## Files Changed

- `lib/types.ts` - Update `curl` interface
- `lib/data/content.tsx` - Update curl translations (en + pt)
- `lib/curl-response.ts` - Complete rewrite with new layout
- `proxy.ts` - No changes needed
