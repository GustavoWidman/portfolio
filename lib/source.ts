import type { ReactNode } from "react";
import { blog } from "fumadocs-mdx:collections/server";
import type { MDXProps } from "mdx/types";
import { isScheduled } from "@/lib/helpers";

export interface BlogPost {
  slug: string;
  lang: "en" | "pt";
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  content: React.ComponentType<MDXProps>;
  toc: { id: string; text: ReactNode; depth: number }[];
}

export interface BlogPostSummary {
  slug: string;
  lang: "en" | "pt";
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  scheduled: boolean;
}

function parseEntryPath(path: string): { slug: string; lang: "en" | "pt" } {
  const pathParts = path.replace(/\.mdx?$/, "").split("/");
  const lang = pathParts[pathParts.length - 1] as "en" | "pt";
  const slug = pathParts.slice(0, -1).join("/") || pathParts[0];
  return { slug, lang };
}

function formatDateValue(date: unknown): string {
  if (!date) {
    return "";
  }
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return date;
  }
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }
  return String(date);
}

export function getBlogPosts(): BlogPost[] {
  return blog.map((entry) => {
    const { slug, lang } = parseEntryPath(entry.info.path);
    const date = formatDateValue(entry.date);

    return {
      slug,
      lang,
      title: entry.title,
      date,
      excerpt: entry.excerpt,
      tags: entry.tags,
      content: entry.body,
      toc: entry.toc.map((item) => ({
        id: item.url.slice(1),
        text: item.title,
        depth: item.depth,
      })),
    };
  });
}

export function getBlogPostSummaries(): BlogPostSummary[] {
  return blog.map((entry) => {
    const { slug, lang } = parseEntryPath(entry.info.path);
    const date = formatDateValue(entry.date);

    return {
      slug,
      lang,
      title: entry.title,
      date,
      excerpt: entry.excerpt,
      tags: entry.tags,
      scheduled: isScheduled(date),
    };
  });
}

export function getBlogPostsByLang(lang: "en" | "pt"): BlogPost[] {
  return getBlogPosts().filter((post) => post.lang === lang);
}

export function getBlogPost(slug: string, lang: "en" | "pt"): BlogPost | undefined {
  return getBlogPosts().find((post) => post.slug === slug && post.lang === lang);
}

export function getAllBlogSlugs(): string[] {
  const posts = getBlogPosts();
  const slugs = new Set(posts.map((post) => post.slug));
  return Array.from(slugs);
}

export function getBlogPostsForSearch() {
  return blog.map((entry) => {
    const { slug, lang } = parseEntryPath(entry.info.path);

    return {
      slug,
      lang,
      title: entry.title,
      excerpt: entry.excerpt,
      tags: entry.tags,
      structuredData: entry.structuredData,
    };
  });
}
