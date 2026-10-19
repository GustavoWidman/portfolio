import { blog } from "fumadocs-mdx:collections/server";
import { getLLMText } from "@/lib/get-llm-text";
import { formatDateValue, getPublicationDate, isScheduled } from "@/lib/publication-date";

// Evaluate publication gates on every request, including after a scheduled release.
export const dynamic = "force-dynamic";

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
    const dateStr = formatDateValue(entry.date);
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
    .sort(
      (a, b) => getPublicationDate(b.dateStr).getTime() - getPublicationDate(a.dateStr).getTime(),
    )
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
      "Cache-Control": "no-store",
    },
  });
}
