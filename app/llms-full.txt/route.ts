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
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return date;
  }
  if (typeof date === "object" && date !== null) {
    const d = date as Date;
    if (typeof d.toISOString === "function") {
      return d.toISOString().split("T")[0];
    }
  }
  return String(date);
}

export async function GET() {
  // Group posts by slug, prefer English over Portuguese
  const slugMap = new Map<
    string,
    { entry: (typeof blog)[number]; lang: string; dateStr: string }
  >();

  for (const entry of blog) {
    const pathParts = entry.info.path.replace(/\.mdx?$/, "").split("/");
    const slug = pathParts.slice(0, -1).join("/") || pathParts[0];
    const lang = pathParts[pathParts.length - 1];

    // Skip scheduled posts
    const dateStr = formatDate(entry.date);
    if (isScheduled(dateStr)) {
      continue;
    }

    // Prefer English over Portuguese
    const existing = slugMap.get(slug);
    if (!existing || (existing.lang === "pt" && lang === "en")) {
      slugMap.set(slug, { entry, lang, dateStr });
    }
  }

  // Sort by date descending and get markdown content
  const sortedEntries = Array.from(slugMap.values())
    .sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime())
    .map((item) => getLLMText(item.entry));

  const posts = await Promise.all(sortedEntries);

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
