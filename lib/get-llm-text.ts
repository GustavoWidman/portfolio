import { blog } from "fumadocs-mdx:collections/server";

export interface LLMBlogPost {
  slug: string;
  lang: "en" | "pt";
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  url: string;
  markdown: string;
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

/**
 * Get processed markdown content for a blog post
 * Requires includeProcessedMarkdown: true in source.config.ts
 */
export async function getLLMText(entry: (typeof blog)[number]): Promise<string> {
  const { slug, lang } = parseEntryPath(entry.info.path);
  const date = formatDateValue(entry.date);
  const url = `https://guswid.com/blog/${slug}`;

  // Get processed markdown content (method is on entry itself)
  const markdown = await entry.getText("processed");

  // Format with metadata header for LLM consumption
  return `# ${entry.title}

> Date: ${date}
> Language: ${lang.toUpperCase()}
> Tags: ${entry.tags.join(", ")}
> URL: ${url}

${entry.excerpt}

---

${markdown}`;
}

/**
 * Get all blog posts as LLM-friendly content
 */
export async function getAllLLMPosts(): Promise<LLMBlogPost[]> {
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
      url: `https://guswid.com/blog/${slug}`,
      markdown: "", // Will be populated asynchronously
    };
  });
}

/**
 * Get all unique slugs for static generation
 */
export function getAllLLMSlugs(): string[] {
  const slugs = new Set(blog.map((entry) => parseEntryPath(entry.info.path).slug));
  return Array.from(slugs);
}

/**
 * Get blog entry by slug and language
 */
export function getBlogEntry(slug: string, lang: "en" | "pt"): (typeof blog)[number] | undefined {
  return blog.find((entry) => {
    const { slug: entrySlug, lang: entryLang } = parseEntryPath(entry.info.path);
    return entrySlug === slug && entryLang === lang;
  });
}
