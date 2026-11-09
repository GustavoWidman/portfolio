/**
 * Markdown negotiation rules, shared with the web-server config generator.
 *
 * `/blog` and `/blog/<slug>` (and the blog-host equivalents) serve the post markdown
 * instead of HTML when any of these hold:
 * - `?format=markdown` or `?raw=true`;
 * - `Accept` starts with `text/markdown` or `text/plain`, or contains one of them and
 *   no `*\/*`;
 * - the User-Agent contains one of `AI_USER_AGENTS` (case-insensitive).
 */

/** Known AI crawler and agent User-Agent tokens (substring match, case-insensitive). */
export const AI_USER_AGENTS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Common Crawl
  "CCBot",
  // Meta
  "FacebookBot",
  // ByteDance
  "Bytespider",
  // Amazon
  "Amazonbot",
  // Others
  "AI2Bot",
  "Diffbot",
  "ImagesiftBot",
  "Magpie-Crawler",
  "Omgili",
  "Omgilibot",
  "Webzio-Extended",
  "YouBot",
] as const;

/** RE2-compatible pattern (usable in Caddy `header_regexp`) matching any AI User-Agent. */
export function aiUserAgentPattern(): string {
  const tokens = AI_USER_AGENTS.map((token) =>
    token.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  return `(?i)(${tokens.join("|")})`;
}

/**
 * Reference implementation of the negotiation rules above. `scripts/check-routes.ts` checks
 * it and the generated Caddy config against the same table of requests.
 */
export function wantsMarkdown(request: {
  userAgent?: string | null;
  accept?: string | null;
  format?: string | null;
  raw?: string | null;
}): boolean {
  if (request.format === "markdown" || request.raw === "true") return true;
  const accept = (request.accept ?? "").toLowerCase();
  if (accept.includes("text/markdown") || accept.includes("text/plain")) {
    if (
      !accept.includes("*/*") ||
      accept.startsWith("text/markdown") ||
      accept.startsWith("text/plain")
    ) {
      return true;
    }
  }
  const ua = (request.userAgent ?? "").toLowerCase();
  return AI_USER_AGENTS.some((token) => ua.includes(token.toLowerCase()));
}
