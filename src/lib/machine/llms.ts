import { AUTHOR, SITE_URL } from "../config";
import { canonical } from "../urls";
import type { Epoch } from "../epochs";
import type { Post } from "../posts";

/**
 * Markdown outputs for agents and LLMs:
 * - `blogIndexMarkdown`: `/llms.mdx/blog` and `/blog.mdx` (also served for negotiated `/blog`)
 * - `postMarkdown`: `/blog/<slug>.mdx` and `/llms.mdx/blog/<slug>` (header, excerpt, raw file)
 * - `llmsFull`: `/llms-full.txt`, every released post in one file
 * - `llmsTxt`: `/llms.txt` (llmstxt.org)
 * `Generated:` is the epoch's reference time, so a file only changes with its content.
 */

function generated(epoch: Epoch): string {
  return new Date(epoch.now).toISOString();
}

/** `# title`, a metadata quote block, the excerpt, `---`, then the source file verbatim. */
export function postMarkdown(post: Post, raw: string): string {
  return `# ${post.title}

> Date: ${post.date}
> Language: ${post.lang.toUpperCase()}
> Tags: ${post.tags.join(", ")}
> URL: ${canonical.post(post.slug)}

${post.excerpt}

---

${raw}`;
}

/** Index of released posts (English preferred per slug), newest first. */
export function blogIndexMarkdown(posts: Post[], epoch: Epoch): string {
  const entries = posts
    .map((post) => {
      const url = canonical.postMarkdown(post.slug);
      return `\n### [${post.title}](${url})

> Date: ${post.date}
> Tags: ${post.tags.join(", ")}

${post.excerpt}

[read full article](${url})

---`;
    })
    .join("\n");

  return `# Gustavo Widman's Blog

> A collection of articles on Rust systems, edge/CDN infrastructure, NixOS operations, and infrastructure security.
> URL: ${canonical.blog()}
> Generated: ${generated(epoch)}

---

## Available Posts

Currently, there are ${posts.length} posts available. Each post includes the title, publication date, tags, an excerpt, and a link to the full markdown content.

---
${entries}

## How to Access

- **Individual posts**: Append \`.mdx\` to any blog URL (e.g., \`/blog/rnn-rust.mdx\`)
- **All posts combined**: \`/llms-full.txt\`
- **URL parameters**: Add \`?format=markdown\` or \`?raw=true\` to any blog URL
`;
}

/** Every released post (English preferred per slug) in the per-post markdown format. */
export function llmsFull(posts: { post: Post; raw: string }[], epoch: Epoch): string {
  return `# Gustavo Widman's Blog

> This file contains all blog posts in markdown format for LLM consumption.
> URL: ${canonical.blog()}
> Generated: ${generated(epoch)}

---

${posts.map(({ post, raw }) => postMarkdown(post, raw)).join("\n\n---\n\n")}`;
}

/** `/llms.txt` per https://llmstxt.org: title, summary, then link lists. */
export function llmsTxt(posts: Post[]): string {
  const blog = posts
    .map((post) => `- [${post.title}](${canonical.postMarkdown(post.slug)}): ${post.excerpt}`)
    .join("\n");
  return `# ${AUTHOR.name}

> Software engineer writing Rust for Azion's edge/CDN platform, based in São Paulo, Brazil. This site is his portfolio and blog: network stacks built from raw sockets up, a benchmarked reverse proxy, a bare-metal kernel, NixOS infrastructure, and research on autonomous coding agents.

Every page is available in English and Portuguese at the same URL (\`?lang=en\` or \`?lang=pt\`). Blog posts are available as markdown by appending \`.mdx\` to their URL; each one starts with a metadata header followed by the original source file.

## Blog

${blog}

## Optional

- [All posts in one file](${SITE_URL}/llms-full.txt): every post above, concatenated
- [Blog index](${SITE_URL}/llms.mdx/blog): titles, dates, tags and excerpts
- [Résumé (English)](${SITE_URL}/resume-en.pdf)
- [Résumé (Portuguese)](${SITE_URL}/resume-pt.pdf)
- [Source code](${AUTHOR.source})
`;
}
