/**
 * AI Agent / Crawler Detection
 * Detects known AI crawlers and tools by their User-Agent strings
 */

/**
 * Known AI crawler user-agent patterns
 * Sources: Official robots.txt files and documentation from each provider
 */
const AI_USER_AGENTS = [
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

  // Google AI
  "Google-Extended",

  // Common Crawl
  "CCBot",

  // Facebook/Meta
  "FacebookBot",

  // ByteDance
  "Bytespider",

  // Amazon
  "Amazonbot",

  // Other known AI scrapers
  "AI2Bot",
  "Applebot-Extended",
  "Diffbot",
  "ImagesiftBot",
  "Magpie-Crawler",
  "Omgili",
  "Omgilibot",
  "Webzio-Extended",
  "YouBot",
] as const;

/**
 * Patterns for partial matching (for user-agents that include version numbers)
 */
const AI_USER_AGENT_PATTERNS: RegExp[] = [
  /GPTBot\/\d+/i,
  /OAI-SearchBot\/\d+/i,
  /ClaudeBot\/\d+/i,
  /PerplexityBot\/\d+/i,
  /Perplexity-User\/\d+/i,
  /CCBot\/\d+/i,
];

/**
 * Check if a User-Agent string belongs to a known AI crawler/bot
 * @param userAgent - The User-Agent header value
 * @returns true if the user-agent matches a known AI crawler
 */
export function isAIAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }

  const normalizedUA = userAgent.toLowerCase();

  // Check exact matches (case-insensitive)
  for (const aiAgent of AI_USER_AGENTS) {
    if (normalizedUA.includes(aiAgent.toLowerCase())) {
      return true;
    }
  }

  // Check pattern matches
  for (const pattern of AI_USER_AGENT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if the request prefers markdown content
 * Can be triggered by:
 * 1. URL parameter: ?format=markdown or ?raw=true
 * 2. Accept header: text/markdown or text/plain
 * 3. AI user-agent detection
 *
 * @param userAgent - The User-Agent header value
 * @param formatParam - The value of the 'format' URL parameter
 * @param rawParam - The value of the 'raw' URL parameter
 * @param acceptHeader - The Accept header value
 * @returns true if markdown content should be served
 */
export function shouldServeMarkdown(
  userAgent: string | null | undefined,
  formatParam: string | null | undefined,
  rawParam: string | null | undefined,
  acceptHeader: string | null | undefined
): boolean {
  // Check URL parameters
  if (formatParam === "markdown" || rawParam === "true") {
    return true;
  }

  // Check Accept header for markdown preference
  if (acceptHeader) {
    const normalizedAccept = acceptHeader.toLowerCase();
    if (normalizedAccept.includes("text/markdown") || normalizedAccept.includes("text/plain")) {
      // Only serve markdown if it's explicitly requested (not as part of */*)
      if (!normalizedAccept.includes("*/*") || normalizedAccept.startsWith("text/markdown") || normalizedAccept.startsWith("text/plain")) {
        return true;
      }
    }
  }

  // Check AI user-agent
  return isAIAgent(userAgent);
}
