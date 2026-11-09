import { createHighlighter } from "shiki";
import type { Element, ElementContent } from "hast";
import type { HighlighterGeneric, ThemeRegistration } from "shiki";

/**
 * Syntax colours of code listings. Every colour is a `--t-*` token of `global.css`, which
 * has a light and a dark value, so one theme serves both colour schemes. Scopes not listed
 * (operators, punctuation, plain identifiers) keep the text colour.
 */
const TOKEN_COLORS: readonly (readonly [scopes: string[], color: string])[] = [
  [["keyword", "storage", "variable.language", "constant.language.bool"], "var(--t-kw)"],
  [["keyword.operator", "punctuation"], "var(--fg)"],
  [["keyword.operator.word", "keyword.operator.new"], "var(--t-kw)"],
  [
    ["entity.name.type", "support.type", "support.class", "entity.other.inherited-class"],
    "var(--t-ty)",
  ],
  [["entity.name.function", "support.function", "entity.name.command"], "var(--t-fn)"],
  [["string", "punctuation.definition.string"], "var(--t-str)"],
  [
    ["constant.numeric", "constant.character", "constant.other.caps", "constant.language.register"],
    "var(--t-num)",
  ],
  [
    [
      "meta.attribute",
      "punctuation.definition.attribute",
      "punctuation.brackets.attribute",
      "entity.other.attribute-name",
      "entity.name.type.lifetime",
      "punctuation.definition.lifetime",
      "storage.modifier.lifetime",
      "constant.other.option",
    ],
    "var(--t-attr)",
  ],
  [["comment", "punctuation.definition.comment"], "var(--t-com)"],
];

const CODE_THEME: ThemeRegistration = {
  name: "instrument",
  type: "light",
  colors: { "editor.foreground": "var(--fg)", "editor.background": "var(--bg-code)" },
  tokenColors: TOKEN_COLORS.map(([scope, foreground]) => ({ scope, settings: { foreground } })),
};

/** Languages used by the posts. Anything else falls back to plain text with a warning. */
const LANGUAGES = ["rust", "bash", "asm", "nix", "gherkin"] as const;
const PLAIN = new Set(["text", "plaintext", "txt", ""]);

let highlighter: Promise<HighlighterGeneric<string, string>> | undefined;

function getHighlighter(): Promise<HighlighterGeneric<string, string>> {
  highlighter ??= createHighlighter({
    themes: [CODE_THEME],
    langs: [...LANGUAGES],
  }) as Promise<HighlighterGeneric<string, string>>;
  return highlighter;
}

/** Parses the fence meta string. Only `title="…"` (free text) is used by the posts. */
export function parseCodeMeta(meta: string | undefined): { title?: string } {
  if (!meta) return {};
  const match = /(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(meta);
  if (!match) return {};
  return { title: match[1] ?? match[2] ?? match[3] };
}

export interface CodeBlockOptions {
  code: string;
  lang: string | undefined;
  title: string | undefined;
  copyLabel: string;
  copiedLabel: string;
  warn?: (message: string) => void;
}

/**
 * Highlights one fenced block and wraps it as a listing:
 * `<figure class="code-block"><figcaption>title? language copy</figcaption><pre class="shiki">…</pre></figure>`.
 * The listing number (`L1`, `L2`, …) is a CSS counter. The copy button is inert markup;
 * `src/scripts/features/code.ts` implements it by event delegation.
 */
export async function renderCodeBlock(options: CodeBlockOptions): Promise<Element> {
  const shiki = await getHighlighter();
  const requested = (options.lang ?? "").toLowerCase();
  let lang = PLAIN.has(requested) ? "text" : requested;
  if (lang !== "text" && !shiki.getLoadedLanguages().includes(lang)) {
    options.warn?.(`unknown code language "${requested}", rendering as plain text`);
    lang = "text";
  }
  const root = shiki.codeToHast(options.code, { lang, theme: CODE_THEME });
  const pre = root.children.find(
    (node): node is Element => node.type === "element" && node.tagName === "pre",
  );
  if (!pre) throw new Error("shiki returned no <pre>");

  const caption: ElementContent[] = [];
  if (options.title) {
    caption.push({
      type: "element",
      tagName: "span",
      properties: { className: ["code-block-title"] },
      children: [{ type: "text", value: options.title }],
    });
  }
  caption.push(
    {
      type: "element",
      tagName: "span",
      properties: { className: ["code-block-lang"] },
      children: [{ type: "text", value: lang }],
    },
    {
      type: "element",
      tagName: "button",
      properties: {
        type: "button",
        className: ["code-block-copy"],
        dataCopyCode: "",
        dataCopiedLabel: options.copiedLabel,
      },
      children: [{ type: "text", value: options.copyLabel }],
    },
  );

  return {
    type: "element",
    tagName: "figure",
    properties: {
      className: ["code-block"],
      dataLanguage: lang,
      ...(options.title ? { dataTitled: "" } : {}),
    },
    children: [
      {
        type: "element",
        tagName: "figcaption",
        properties: { className: ["code-block-cap"] },
        children: caption,
      },
      pre,
    ],
  };
}
