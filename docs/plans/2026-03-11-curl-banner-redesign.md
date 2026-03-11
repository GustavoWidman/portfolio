# cURL Banner Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the curl response from a simple box to an elaborate ASCII art banner with figlet logo, side-by-side boxes, and blog posts.

**Architecture:** Update the data model (types + translations), then rewrite the response builder to produce the new layout. The proxy layer stays unchanged.

**Tech Stack:** TypeScript, Next.js, fumadocs-mdx (blog data)

---

### Task 1: Update Types and Translations

**Files:**
- Modify: `lib/types.ts:85-93` (curl interface)
- Modify: `lib/data/content.tsx:202-210` (English curl content)
- Modify: `lib/data/content.tsx:402-410` (Portuguese curl content)

**Step 1: Update the curl interface in types.ts**

Replace lines 85-93 with:

```typescript
curl: {
  name: string;
  title: string;
  sites: string;
  source: string;
  aboutHeader: string;
  aboutText: string[];
  socialsHeader: string;
  github: string;
  linkedin: string;
  email: string;
  site: string;
  blogHeader: string;
};
```

**Step 2: Update English curl content in content.tsx**

Replace lines 202-210 with:

```typescript
curl: {
  name: "Gustavo Widman",
  title: "Backend & Systems Engineer",
  sites: "https://guswid.com | https://r3dlust.com",
  source: "src: https://github.com/GustavoWidman/portfolio",
  aboutHeader: "About",
  aboutText: [
    "Backend & Systems",
    "Engineer passionate",
    "about low-level systems",
    "and infrastructure.",
  ],
  socialsHeader: "Socials",
  github: "https://github.com/GustavoWidman",
  linkedin: "https://linkedin.com/in/gustavo-widman",
  email: "gustavowidman@gmail.com",
  site: "https://guswid.com",
  blogHeader: "Blog Posts",
},
```

**Step 3: Update Portuguese curl content in content.tsx**

Replace lines 402-410 with:

```typescript
curl: {
  name: "Gustavo Widman",
  title: "Engenheiro de Backend & Sistemas",
  sites: "https://guswid.com | https://r3dlust.com",
  source: "src: https://github.com/GustavoWidman/portfolio",
  aboutHeader: "Sobre",
  aboutText: [
    "Engenheiro de Backend &",
    "Sistemas apaixonado",
    "por sistemas de baixo",
    "nível e infraestrutura.",
  ],
  socialsHeader: "Social",
  github: "https://github.com/GustavoWidman",
  linkedin: "https://linkedin.com/in/gustavo-widman",
  email: "gustavowidman@gmail.com",
  site: "https://guswid.com",
  blogHeader: "Posts do Blog",
},
```

**Step 4: Verify lint passes**

Run: `bun run lint`
Expected: 0 warnings, 0 errors

**Step 5: Commit**

```bash
jj commit -m "feat(curl): update types and translations for banner redesign"
```

---

### Task 2: Rewrite cURL Response Builder

**Files:**
- Rewrite: `lib/curl-response.ts`

**Step 1: Rewrite the entire curl-response.ts**

The new file should:

1. **ANSI constants** - Add magenta (`\x1b[35m`) to the existing color set
2. **BOX constants** - Replace with rounded corners (╭╮╰╯) and add connectors (┬┴┤├)
3. **Logo** - Hardcoded 4-line "GusWid" figlet rectangles ASCII art:
   ```
    _____         _ _ _ _   _
   |   __|_ _ ___| | | |_|_| |
   |  |  | | |_ -| | | | | . |
   |_____|___|___|_____|_|___|
   ```
4. **Header section** - Logo on left, info panel on right (name, title, sites, source)
5. **About box** - Rounded corners, header in top border
6. **Socials box** - Rounded corners, header in top border, two-column table with ┬/┴ connectors
7. **Blog section** - Header + horizontal rule + date-sorted posts from fumadocs-mdx
8. **Blog data** - Import `blog` from `fumadocs-mdx:collections/server`, parse entries, filter by language, exclude scheduled, sort by date descending
9. **Helper functions** - Keep `visibleLength` and `padLine`, add new helpers as needed

**Key layout constants:**
- About box inner width: 26 chars
- Socials label column: 9 chars
- Socials value column: 40 chars
- Gap between boxes: 2 spaces
- Total width: ~86 chars

**Step 2: Verify lint passes**

Run: `bun run lint`
Expected: 0 warnings, 0 errors

**Step 3: Verify build succeeds**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
jj commit -m "feat(curl): rewrite response builder with ASCII art banner"
```

---

### Task 3: Bump Version

**Files:**
- Modify: `package.json` (version field)

**Step 1: Bump version**

Change version from `2.6.2` to `2.7.0` (minor bump for new feature redesign).

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
jj commit -m "chore: bump version to 2.7.0"
```
