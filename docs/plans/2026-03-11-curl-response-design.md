# cURL Response Design

## Overview

Add a terminal-friendly response when users run `curl guswid.com` (or `curl r3dlust.com`). The response will be plain text with ANSI color styling, providing a quick introduction and contact information.

## Requirements

- **Content**: Brief intro + contact info (name, title, skills, links)
- **Format**: Fits in <80 chars width, no scrolling needed
- **Title**: "Backend & Systems Engineer"
- **Email**: gustavowidman@gmail.com
- **i18n**: Respect Accept-Language header, cookie, and URL param for en/pt
- **Styling**: ANSI colors (bold name, cyan/blue borders, dim URLs)
- **Cache**: 1 hour

## Approach

Next.js middleware intercepts requests with `User-Agent: curl/*` and returns `text/plain` with ANSI styling. Only cURL is matched; other CLI tools (wget, httpie) receive normal HTML.

## Architecture

```
Request → Middleware (User-Agent check)
              ↓ curl/*
         Build ANSI response → Return text/plain
              ↓ other
         Continue to Next.js routes
```

## Components

### 1. `middleware.ts`

- Intercept all requests at root path
- Check `User-Agent` header for `curl/*` pattern
- If match, build response using `buildCurlResponse(lang)` and return
- Otherwise, continue to Next.js routes
- Set `Cache-Control: public, max-age=3600`

### 2. `lib/curl-response.ts`

- `buildCurlResponse(lang: Language): string`
- ANSI escape codes for styling:
  - `\x1b[1m` - bold
  - `\x1b[36m` - cyan
  - `\x1b[34m` - blue
  - `\x1b[2m` - dim
  - `\x1b[0m` - reset
- Box drawing characters for borders
- Language detection via existing `getLanguage()` helper

### 3. Content Translations

Add to `lib/data/content.tsx`:

```typescript
DATA.en.curl = {
  name: "Gustavo Widman",
  title: "Backend & Systems Engineer",
  skills: "Rust • Go • TypeScript • Linux • Nix",
  github: "github.com/r3dlust",
  linkedin: "linkedin.com/in/gwidman",
  email: "gustavowidman@gmail.com",
  site: "r3dlust.com"
}

DATA.pt.curl = {
  // Portuguese translations
}
```

## Response Format

```
┌──────────────────────────────────────────────────────────────────┐
│  Gustavo Widman                                                  │
│  Backend & Systems Engineer                                      │
│                                                                  │
│  Rust • Go • TypeScript • Linux • Nix                           │
├──────────────────────────────────────────────────────────────────┤
│  github.com/r3dlust                                              │
│  linkedin.com/in/gwidman                                         │
│  gustavowidman@gmail.com                                         │
│  r3dlust.com                                                     │
└──────────────────────────────────────────────────────────────────┘
```

- Name: bold cyan
- Title: normal cyan
- Skills: normal
- Border: blue
- URLs/links: dim

## Files Changed

- `middleware.ts` (new)
- `lib/curl-response.ts` (new)
- `lib/data/content.tsx` (add curl translations)

## Testing

1. `curl -v guswid.com` → see ANSI response with correct headers
2. `curl -H "Accept-Language: pt" guswid.com` → Portuguese response
3. `curl -H "User-Agent: wget/1.21" guswid.com` → normal HTML
4. Browser request → normal HTML page
