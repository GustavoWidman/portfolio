# cURL Response Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Return terminal-friendly ANSI-styled plain text when users curl the portfolio site.

**Architecture:** Next.js middleware intercepts `curl/*` User-Agent requests, builds ANSI response via helper module, returns `text/plain`. Respects existing i18n system.

**Tech Stack:** Next.js middleware, TypeScript, ANSI escape codes

---

### Task 1: Add cURL Content Translations

**Files:**
- Modify: `lib/data/content.tsx`

**Step 1: Add English cURL content**

Find the `DATA.en` object in `lib/data/content.tsx` and add a `curl` property:

```typescript
curl: {
  name: "Gustavo Widman",
  title: "Backend & Systems Engineer",
  skills: "Rust • Go • TypeScript • Linux • Nix",
  github: "github.com/r3dlust",
  linkedin: "linkedin.com/in/gwidman",
  email: "gustavowidman@gmail.com",
  site: "r3dlust.com",
},
```

**Step 2: Add Portuguese cURL content**

Find the `DATA.pt` object and add a `curl` property:

```typescript
curl: {
  name: "Gustavo Widman",
  title: "Engenheiro de Backend & Sistemas",
  skills: "Rust • Go • TypeScript • Linux • Nix",
  github: "github.com/r3dlust",
  linkedin: "linkedin.com/in/gwidman",
  email: "gustavowidman@gmail.com",
  site: "r3dlust.com",
},
```

**Step 3: Update types**

In `lib/types.ts`, add the curl content type to the `ContentType` interface:

```typescript
curl: {
  name: string;
  title: string;
  skills: string;
  github: string;
  linkedin: string;
  email: string;
  site: string;
};
```

**Step 4: Verify build**

Run: `bun run build`
Expected: Build succeeds with no type errors

**Step 5: Commit**

```bash
jj commit -m "feat(curl): add curl response content translations"
```

---

### Task 2: Create cURL Response Builder

**Files:**
- Create: `lib/curl-response.ts`

**Step 1: Create the response builder module**

Create `lib/curl-response.ts`:

```typescript
import { DATA } from "@/lib/data/content";
import type { Language } from "@/lib/types";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
} as const;

const BOX = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  leftTee: "├",
  rightTee: "┤",
} as const;

const WIDTH = 66;

function repeat(char: string, count: number): string {
  return char.repeat(count);
}

function padLine(text: string, width: number): string {
  const padding = width - text.length;
  return text + repeat(" ", Math.max(0, padding));
}

export function buildCurlResponse(lang: Language): string {
  const content = DATA[lang].curl;
  const lines: string[] = [];

  const innerWidth = WIDTH - 2;

  lines.push(
    ANSI.blue +
      BOX.topLeft +
      repeat(BOX.horizontal, innerWidth) +
      BOX.topRight +
      ANSI.reset
  );

  const nameLine = `  ${ANSI.bold}${ANSI.cyan}${content.name}${ANSI.reset}`;
  lines.push(
    ANSI.blue +
      BOX.vertical +
      ANSI.reset +
      padLine(nameLine, innerWidth) +
      ANSI.blue +
      BOX.vertical +
      ANSI.reset
  );

  const titleLine = `  ${ANSI.cyan}${content.title}${ANSI.reset}`;
  lines.push(
    ANSI.blue +
      BOX.vertical +
      ANSI.reset +
      padLine(titleLine, innerWidth) +
      ANSI.blue +
      BOX.vertical +
      ANSI.reset
  );

  lines.push(
    ANSI.blue +
      BOX.vertical +
      ANSI.reset +
      padLine("", innerWidth) +
      ANSI.blue +
      BOX.vertical +
      ANSI.reset
  );

  const skillsLine = `  ${content.skills}`;
  lines.push(
    ANSI.blue +
      BOX.vertical +
      ANSI.reset +
      padLine(skillsLine, innerWidth) +
      ANSI.blue +
      BOX.vertical +
      ANSI.reset
  );

  lines.push(
    ANSI.blue +
      BOX.leftTee +
      repeat(BOX.horizontal, innerWidth) +
      BOX.rightTee +
      ANSI.reset
  );

  const links = [
    content.github,
    content.linkedin,
    content.email,
    content.site,
  ];

  for (const link of links) {
    const linkLine = `  ${ANSI.dim}${link}${ANSI.reset}`;
    lines.push(
      ANSI.blue +
        BOX.vertical +
        ANSI.reset +
        padLine(linkLine, innerWidth) +
        ANSI.blue +
        BOX.vertical +
        ANSI.reset
    );
  }

  lines.push(
    ANSI.blue +
      BOX.bottomLeft +
      repeat(BOX.horizontal, innerWidth) +
      BOX.bottomRight +
      ANSI.reset
  );

  return lines.join("\n");
}
```

**Step 2: Verify linting**

Run: `bun run lint`
Expected: No errors

**Step 3: Commit**

```bash
jj commit -m "feat(curl): add curl response builder with ANSI styling"
```

---

### Task 3: Create Middleware for cURL Detection

**Files:**
- Create: `middleware.ts`

**Step 1: Create the middleware**

Create `middleware.ts` at the project root:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildCurlResponse } from "@/lib/curl-response";
import { getLanguage } from "@/lib/language-server";

const CURL_PATTERN = /^curl\//;

export function middleware(request: NextRequest): NextResponse {
  const userAgent = request.headers.get("user-agent") || "";

  if (CURL_PATTERN.test(userAgent)) {
    const lang = getLanguage(request.cookies, request.headers);
    const response = buildCurlResponse(lang);

    return new NextResponse(response, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/index"],
};
```

**Step 2: Verify build**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Test locally**

Run: `bun run dev`
Then in another terminal: `curl -v http://localhost:3000`
Expected: ANSI-formatted plain text response with correct headers

**Step 4: Commit**

```bash
jj commit -m "feat(curl): add middleware to intercept curl requests"
```

---

### Task 4: Update Version

**Files:**
- Modify: `package.json`
- Modify: `flake.nix`

**Step 1: Bump version in package.json**

Update the `version` field to the next version number.

**Step 2: Bump version in flake.nix**

Update the version in `flake.nix` to match `package.json`.

**Step 3: Commit**

```bash
jj commit -m "chore: bump version for curl response feature"
```

---

### Verification Checklist

- [ ] `curl guswid.com` shows ANSI-formatted response
- [ ] `curl -H "Accept-Language: pt" guswid.com` shows Portuguese
- [ ] `curl -H "User-Agent: wget/1.21" guswid.com` returns HTML
- [ ] Browser requests show normal HTML page
- [ ] `bun run lint` passes
- [ ] `bun run build` succeeds
