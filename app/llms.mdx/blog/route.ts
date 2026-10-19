import { blog } from "fumadocs-mdx:collections/server";
import { formatDateValue, getPublicationDate, isScheduled } from "@/lib/publication-date";

// Evaluate publication gates on every request, including after a scheduled release.
export const dynamic = "force-dynamic";

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
    const dateStr = formatDateValue(entry.date);
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
    .sort((a, b) => getPublicationDate(b.date).getTime() - getPublicationDate(a.date).getTime())
    .map((post) => ({
      ...post,
      url: `https://guswid.com/blog/${post.slug}`,
      markdownUrl: `https://guswid.com/blog/${post.slug}.mdx`,
    }));

  const content = `# Gustavo Widman's Blog

> A collection of articles on Rust systems, edge/CDN infrastructure, NixOS operations, and infrastructure security.
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
      "Cache-Control": "no-store",
    },
  });
}
