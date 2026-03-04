import { blog } from "fumadocs-mdx:collections/server";
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
    {
      title: string;
      slug: string;
      date: string;
      excerpt: string;
      tags: string[];
      lang: string;
    }
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
      slugMap.set(slug, {
        title: entry.title,
        slug,
        date: dateStr,
        excerpt: entry.excerpt,
        tags: entry.tags,
        lang,
      });
    }
  }

  // Convert to array and sort by date descending
  const posts = Array.from(slugMap.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((post) => ({
      ...post,
      url: `https://guswid.com/blog/${post.slug}`,
      markdownUrl: `https://guswid.com/blog/${post.slug}.mdx`,
    }));

  const content = `# Gustavo Widman's Blog

> A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research.
> URL: https://guswid.com/blog
> Generated: ${new Date().toISOString()}

---

## Available Posts

Currently, there are ${posts.length} posts available. Each post includes the title, publication date, tags, an excerpt, and a link to the full markdown content.

---
${posts
  .map(
    (post) => `\n### [${post.title}](${post.markdownUrl})

> Date: ${post.date}
> Tags: ${post.tags.join(", ")}

${post.excerpt}

[read full article](${post.markdownUrl})

---`,
  )
  .join("\n")}

## How to Access

- **Individual posts**: Append \`.mdx\` to any blog URL (e.g., \`/blog/rnn-rust.mdx\`)
- **All posts combined**: \`/llms-full.txt\`
- **URL parameters**: Add \`?format=markdown\` or \`?raw=true\` to any blog URL
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
