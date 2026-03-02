import { blog } from "fumadocs-mdx:collections/server";
import { getLLMText } from "@/lib/get-llm-text";
import { isScheduled } from "@/lib/helpers";

// Cache forever - content is static
export const revalidate = false;

function formatDate(date: unknown): string {
  if (!date) {
    return "";
  }
  if (typeof date === "string") {
    // Already a string, check if it's in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Try to parse it
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return date;
  }
  // Handle Date objects and objects with toISOString
  if (typeof date === "object" && date !== null) {
    const d = date as Date;
    if (typeof d.toISOString === "function") {
      return d.toISOString().split("T")[0];
    }
  }
  return String(date);
}

export async function GET() {
  // Get all non-scheduled posts, prefer English versions
  const seenSlugs = new Set<string>();
  const posts: string[] = [];

  for (const entry of blog) {
    const pathParts = entry.info.path.replace(/\.mdx?$/, "").split("/");
    const slug = pathParts.slice(0, -1).join("/") || pathParts[0];
    const lang = pathParts[pathParts.length - 1];

    // Skip scheduled posts
    const dateStr = formatDate(entry.date);
    if (isScheduled(dateStr)) {
      continue;
    }

    // Prefer English, but include Portuguese if no English version
    if (lang === "en") {
      seenSlugs.add(slug);
      posts.push(await getLLMText(entry));
    } else if (lang === "pt" && !seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      posts.push(await getLLMText(entry));
    }
  }

  const content = `# Gustavo Widman's Blog

> This file contains all blog posts in markdown format for LLM consumption.
> URL: https://guswid.com/blog
> Generated: ${new Date().toISOString()}

---

${posts.join("\n\n---\n\n")}`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
