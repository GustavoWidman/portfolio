# Preloading Enhancement Design

**Date**: 2026-03-11
**Status**: Approved
**Approach**: Minimal Enhancement (Approach 1)

## Overview

Add proper preloading for better UX on the portfolio site using Next.js built-in features with targeted enhancements. Focus on route prefetching and critical asset preloading.

## Goals

- Faster perceived page loads through font preloading
- Instant navigation between portfolio and blog
- Prioritized loading of above-fold content

## Non-Goals

- Service worker / PWA caching
- Custom prefetch hooks
- Offline capability

## Design

### 1. Font Preloading

Add `<link rel="preload">` tags in `layout.tsx` for critical font files.

**Files to modify**: `app/layout.tsx`

**Implementation**:
```tsx
// Inside <head> via Next.js metadata or direct head tags
<link rel="preload" href="path/to/jetbrains-mono-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
<link rel="preload" href="path/to/jetbrains-mono-700.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
```

**Note**: Fonts are loaded from `node_modules/@fontsource/jetbrains-mono/files/`. May need to use `next/font` preload feature or copy to public.

### 2. Route Prefetching

Enhance navigation links with explicit prefetching.

**Files to modify**: 
- `components/portfolio/Navbar.tsx`
- `components/portfolio/Projects.tsx`

**Implementation**:
- Blog link in Navbar: Ensure `prefetch={true}` (explicit)
- "Read Article" links in Projects: Add `prefetch={true}`

### 3. Image Priority

Add `priority` prop to above-fold images.

**Files to modify**:
- `components/portfolio/Projects.tsx`

**Implementation**:
- First project image: Add `priority` prop to `next/image`

### 4. DNS Prefetch / Preconnect

Preconnect to external domains used for links.

**Files to modify**: `app/layout.tsx`

**Implementation**:
```tsx
<link rel="preconnect" href="https://github.com" />
<link rel="dns-prefetch" href="https://github.com" />
```

## Files Changed

| File | Change |
|------|--------|
| `app/layout.tsx` | Add font preloads, DNS prefetch |
| `components/portfolio/Navbar.tsx` | Explicit prefetch on Blog link |
| `components/portfolio/Projects.tsx` | Prefetch on blog post links, priority on first image |

## Success Criteria

- Lighthouse Performance score improvement
- Fonts render without FOUT (flash of unstyled text)
- Blog navigation feels instant on hover/click
