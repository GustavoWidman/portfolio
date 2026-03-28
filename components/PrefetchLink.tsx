"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, useCallback, useEffect, useRef, useState } from "react";

type LinkProps = ComponentProps<typeof Link>;

// True on touch devices where hover isn't available — a better signal than
// viewport width because a tablet with keyboard shouldn't get viewport prefetch.
function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isTouch;
}

// Fetch the rendered HTML of a page and inject <link rel="prefetch"> hints for
// every image found — both Next.js <Image> tags and preload hints in <head>.
// Runs at low priority so it doesn't compete with user interactions.
const prefetched = new Set<string>();
async function prefetchPageImages(pageUrl: string) {
  if (prefetched.has(pageUrl)) return;
  prefetched.add(pageUrl);
  try {
    const html = await fetch(pageUrl, { priority: "low" } as RequestInit).then((r) => r.text());
    const doc = new DOMParser().parseFromString(html, "text/html");

    const imageUrls = new Set<string>();
    doc.querySelectorAll("img[src]").forEach((el) => {
      const src = (el as HTMLImageElement).getAttribute("src");
      if (src && !src.startsWith("data:")) imageUrls.add(src);
    });
    doc.querySelectorAll('link[rel="preload"][as="image"]').forEach((el) => {
      const href = (el as HTMLLinkElement).getAttribute("href");
      if (href) imageUrls.add(href);
    });

    imageUrls.forEach((href) => {
      if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
    });
  } catch {
    // Best-effort — a failed prefetch is silent
  }
}

export default function PrefetchLink({ href, onMouseEnter, onFocus, ...props }: LinkProps) {
  const router = useRouter();
  const isTouch = useIsTouch();
  const linkRef = useRef<HTMLAnchorElement>(null);

  const url = typeof href === "string" ? href : (href?.pathname ?? "");

  const prefetch = useCallback(() => {
    if (!url) return;
    // PrefetchKind.FULL is not in the public types but is stable — it's what
    // <Link prefetch={true}> passes internally. AUTO (the default) only fetches
    // route metadata; FULL fetches the complete RSC payload.
    (router as any).prefetch(url, { kind: "full" });
    void prefetchPageImages(url);
  }, [router, url]);

  // Touch: RSC is prefetched by Next.js on viewport intersection (prefetch={true}).
  // Images are prefetched via IntersectionObserver so they also load before tap.
  useEffect(() => {
    if (!isTouch || !linkRef.current || !url) return;
    const el = linkRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { void prefetchPageImages(url); observer.disconnect(); } },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isTouch, url]);

  if (isTouch) {
    return <Link ref={linkRef} href={href} prefetch={true} onMouseEnter={onMouseEnter} onFocus={onFocus} {...props} />;
  }

  // Desktop: both RSC + images prefetched on hover/focus only.
  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(e) => { prefetch(); onMouseEnter?.(e); }}
      onFocus={(e) => { prefetch(); onFocus?.(e); }}
      {...props}
    />
  );
}
