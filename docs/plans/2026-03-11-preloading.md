# Preloading Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add proper preloading for better UX through font preloading, route prefetching, and image prioritization.

**Architecture:** Leverage Next.js built-in prefetching with targeted enhancements - font preloads in layout, explicit prefetch on key navigation links, and priority on above-fold images.

**Tech Stack:** Next.js 15, React 19, TypeScript

---

### Task 1: Add Font Preloading in Layout

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Add font preload links in head**

The fonts are loaded via `next/font/local`. Add preload by accessing the font CSS URLs. Since `next/font` handles preloading automatically, we need to verify this is working or add explicit preconnect for font sources.

Modify `app/layout.tsx` to add preconnect for better font loading:

```tsx
// In the metadata export, add:
export const metadata: Metadata = {
  // ... existing metadata
  // Add to the metadata object - Next.js 15 supports this pattern
};
```

Actually, since `next/font/local` already handles font optimization and preloading, we should verify this is working. The current setup with `display: "swap"` is good. 

**Alternative approach**: Add preconnect hints in the HTML head. Since Next.js App Router doesn't have a direct `<head>` tag, we need to use the metadata API.

Check if we can add via metadata or create a separate head component.

**Revised Step 1**: Add a `<head>` component with preloads using `next/head` equivalent for App Router.

Since this is App Router, we need to use the `metadata` export or create a client component that injects head tags. The cleanest approach is to use the `viewport` and other metadata exports, but for custom link tags we may need to use the `links` property or inject via a client component.

Let's add preconnect for GitHub:

```tsx
// Add to app/layout.tsx - modify the metadata export to include:
// Note: Next.js 15 doesn't have a direct "links" metadata, so we'll use a different approach
```

For App Router, the cleanest way is to add the links in a client component or use the experimental `unstable_` APIs. 

**Final approach**: Create a simple preload component that injects link tags.

**Step 1: Create PreloadHead component**

Create: `components/shared/PreloadHead.tsx`

```tsx
"use client";

import { useEffect } from "react";

export function PreloadHead() {
  useEffect(() => {
    const links = [
      { rel: "preconnect", href: "https://github.com" },
      { rel: "dns-prefetch", href: "https://github.com" },
    ];

    links.forEach(({ rel, href }) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      if (rel === "preconnect") {
        link.crossOrigin = "anonymous";
      }
      document.head.appendChild(link);
    });

    return () => {
      links.forEach(({ rel, href }) => {
        const link = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
        if (link) link.remove();
      });
    };
  }, []);

  return null;
}
```

**Step 2: Add PreloadHead to layout**

Modify: `app/layout.tsx`

```tsx
import { PreloadHead } from "@/components/shared/PreloadHead";

// In the return statement, add inside <body>:
<body className="font-sans">
  <PreloadHead />
  <PersonJsonLd />
  // ... rest
```

**Step 3: Run dev server to verify**

Run: `bun run dev`
Expected: No errors, page loads normally

**Step 4: Commit**

```bash
jj commit -m "feat(preload): add preconnect for external domains"
```

---

### Task 2: Add Route Prefetching to Navbar

**Files:**
- Modify: `components/portfolio/Navbar.tsx`

**Step 1: Add explicit prefetch to Blog link**

The Blog link in the Navbar already uses Next.js `Link` component. Add explicit `prefetch={true}` for clarity and ensure hover prefetching is active.

Find the Blog link (around line 199-205 for desktop, line 95-102 for mobile):

```tsx
// Desktop - change from:
<Link
  key={key}
  href={isSubdomain ? "/" : "/blog"}
  className="hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
>
  {label}
</Link>

// To:
<Link
  key={key}
  href={isSubdomain ? "/" : "/blog"}
  prefetch={true}
  className="hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
>
  {label}
</Link>
```

Also update the mobile version (around line 95-102):

```tsx
// Mobile - change from:
<Link
  key={key}
  href={isSubdomain ? "/" : "/blog"}
  onClick={() => setIsMenuOpen(false)}
  className="text-2xl font-bold text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
>
  {label}
</Link>

// To:
<Link
  key={key}
  href={isSubdomain ? "/" : "/blog"}
  prefetch={true}
  onClick={() => setIsMenuOpen(false)}
  className="text-2xl font-bold text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
>
  {label}
</Link>
```

**Step 2: Run lint**

Run: `bun run lint`
Expected: No errors

**Step 3: Commit**

```bash
jj commit -m "feat(navbar): add explicit prefetch for blog route"
```

---

### Task 3: Add Route Prefetching to Projects Component

**Files:**
- Modify: `components/portfolio/Projects.tsx`

**Step 1: Add prefetch to "Read Article" links**

Find the blog post link (around line 156-163):

```tsx
// Change from:
{project.blogPostSlug && (
  <Link
    href={`/blog/${project.blogPostSlug}`}
    className="inline-flex items-center gap-2 text-black dark:text-white border-b border-black dark:border-white pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
  >
    <BookOpen size={18} /> {t.projects.readArticle}
  </Link>
)}

// To:
{project.blogPostSlug && (
  <Link
    href={`/blog/${project.blogPostSlug}`}
    prefetch={true}
    className="inline-flex items-center gap-2 text-black dark:text-white border-b border-black dark:border-white pb-1 hover:text-zinc-600 dark:hover:text-zinc-400 hover:border-zinc-600 dark:hover:border-zinc-400 transition-colors"
  >
    <BookOpen size={18} /> {t.projects.readArticle}
  </Link>
)}
```

**Step 2: Run lint**

Run: `bun run lint`
Expected: No errors

**Step 3: Commit**

```bash
jj commit -m "feat(projects): add prefetch for blog post links"
```

---

### Task 4: Add Image Priority for Above-Fold Content

**Files:**
- Modify: `components/portfolio/Projects.tsx`

**Step 1: Add priority to first project image**

The first project image is likely above the fold on desktop. Modify the `ProjectVisual` component to accept a `priority` prop and pass it to the first image.

First, update the `ProjectVisual` interface:

```tsx
interface ProjectVisualProps {
  project: (typeof STATIC_PROJECTS)[0];
  priority?: boolean;
}
```

Then update the component signature and Image component:

```tsx
const ProjectVisual: React.FC<ProjectVisualProps> = ({ project, priority = false }) => {
  // ... existing code

  return (
    <div className={...}>
      {projectImage ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={projectImage}
            alt={project.title}
            width={projectImage.width}
            height={projectImage.height}
            priority={priority}
            className="max-w-full max-h-full w-auto h-auto rounded-lg"
          />
        </div>
      ) : (
        // ... existing fallback
      )}
    </div>
  );
};
```

Now update the usage in the Projects component to pass priority for the first project:

```tsx
// Around line 168, change:
<ProjectVisual project={project} />

// To:
<ProjectVisual project={project} priority={index === 0} />
```

**Step 2: Run lint**

Run: `bun run lint`
Expected: No errors

**Step 3: Commit**

```bash
jj commit -m "feat(projects): add priority loading for first project image"
```

---

### Task 5: Verify and Final Commit

**Step 1: Run build to verify everything works**

Run: `bun run build`
Expected: Build succeeds without errors

**Step 2: Bump version**

Update `package.json` version (patch bump)

Update `flake.nix` version to match

**Step 3: Final commit**

```bash
jj commit -m "chore: bump version for preloading enhancement"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add preconnect for GitHub | `components/shared/PreloadHead.tsx`, `app/layout.tsx` |
| 2 | Add prefetch to Navbar blog link | `components/portfolio/Navbar.tsx` |
| 3 | Add prefetch to Projects blog links | `components/portfolio/Projects.tsx` |
| 4 | Add image priority for first project | `components/portfolio/Projects.tsx` |
| 5 | Verify build and bump version | `package.json`, `flake.nix` |
