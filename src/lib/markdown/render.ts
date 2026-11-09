import GithubSlugger from "github-slugger";
import { toHtml } from "hast-util-to-html";
import { toString } from "hast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { Element, ElementContent, Root, RootContent } from "hast";

import { READING_WPM } from "../config";
import { parseCodeMeta, renderCodeBlock } from "./code";

/** One heading of the table of contents. `html` keeps inline code as `<code>`. */
export interface TocEntry {
  depth: number;
  id: string;
  text: string;
  html: string;
  /** Section number from document order (`2`, `2.1`); h1 has none. */
  number?: string;
}

/** A local image referenced by the post, resolved later by `images.ts`. */
export interface PostImageRef {
  /** Project-relative path, e.g. `blog/iris/imgs/camera-swatch-pass.jpg`. */
  path: string;
  alt: string;
}

export interface RenderedMarkdown {
  /** Body as HAST. Local `<img>` elements carry `data-local-image` until images are resolved. */
  tree: Root;
  /** Headings h1–h3, in document order. */
  toc: TocEntry[];
  /** Every heading id (h1–h6), in document order. */
  headingIds: { depth: number; id: string; text: string }[];
  images: PostImageRef[];
  /** Words of prose (fenced code excluded). */
  words: number;
  readingMinutes: number;
}

export interface RenderOptions {
  /** Directory holding the post, relative to the project root (`blog/<slug>`); `./` paths resolve against it. */
  postDir: string;
  labels: { copyCode: string; copiedCode: string };
  warn?: (message: string) => void;
}

const EXTERNAL_HREF = /^\w+:|^\/\//;
/** `hamming-rust/pt.mdx` links `./imgs/https://github.com/…`; the intended target is the URL. */
const IMAGE_DIR_URL = /^\.\/imgs\/(\w+:\/\/.+)$/;
const HEADING = /^h([1-6])$/;

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);

function isElement(node: RootContent | ElementContent | Root, tagName?: string): node is Element {
  return node.type === "element" && (tagName === undefined || node.tagName === tagName);
}

function isBlankText(node: ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

/** Inline HTML for a TOC label: text and inline `<code>`, other markup flattened. */
function tocLabelHtml(children: ElementContent[]): string {
  let html = "";
  for (const child of children) {
    if (child.type === "text") {
      html += toHtml(child);
    } else if (child.type === "element" && child.tagName === "code") {
      html += toHtml({
        type: "element",
        tagName: "code",
        properties: {},
        children: [{ type: "text", value: toString(child) }],
      });
    } else if (child.type === "element") {
      html += tocLabelHtml(child.children);
    }
  }
  return html;
}

/** Caption of a post image: the markdown title, else the alt text, else none. */
function figureCaption(img: Element): string {
  return String(img.properties.title ?? "") || String(img.properties.alt ?? "");
}

const LINE_END = /\n[ \t]*$/;
const LINE_START = /^[ \t]*\n/;

/**
 * Splits a paragraph around images that sit on a line of their own, so each becomes
 * `figure.post-image` and the text before and after stays in its own paragraph.
 * Returns undefined when the paragraph has no such image.
 */
function splitStandaloneImages(p: Element): Element[] | undefined {
  const children = p.children;
  const startsLine = (i: number): boolean => {
    const before = children[i - 1];
    if (!before) return true;
    if (isElement(before, "br")) return true;
    if (before.type !== "text") return false;
    return LINE_END.test(before.value) || (i === 1 && before.value.trim() === "");
  };
  const endsLine = (i: number): boolean => {
    const after = children[i + 1];
    if (!after) return true;
    if (isElement(after, "br")) return true;
    if (after.type !== "text") return false;
    return LINE_START.test(after.value) || (i === children.length - 2 && after.value.trim() === "");
  };
  const alone = (i: number): boolean => startsLine(i) && endsLine(i);
  if (!children.some((child, i) => isElement(child, "img") && alone(i))) return undefined;

  const parts: Element[] = [];
  let run: ElementContent[] = [];
  const flush = (): void => {
    const first = run[0];
    if (first?.type === "text") first.value = first.value.replace(/^\s+/, "");
    const last = run[run.length - 1];
    if (last?.type === "text") last.value = last.value.replace(/\s+$/, "");
    if (run.some((node) => !isBlankText(node))) {
      parts.push({ type: "element", tagName: "p", properties: {}, children: run });
    }
    run = [];
  };
  children.forEach((child, i) => {
    if (isElement(child, "img") && alone(i)) {
      flush();
      parts.push({
        type: "element",
        tagName: "figure",
        properties: { className: ["post-image"] },
        children: [child],
      });
    } else {
      run.push(child.type === "text" ? { ...child } : child);
    }
  });
  flush();
  return parts;
}

/** Advances the h2/h3 counters for a heading and returns its number; other depths have none. */
function sectionNumber(counters: number[], depth: number): string | undefined {
  if (depth === 2) {
    counters[0] += 1;
    counters[1] = 0;
    return String(counters[0]);
  }
  if (depth === 3) {
    counters[1] += 1;
    return `${counters[0]}.${counters[1]}`;
  }
  return undefined;
}

function countWords(text: string): number {
  const matches = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’_\-./]*/gu);
  return matches ? matches.length : 0;
}

/**
 * Renders a post body (CommonMark + GFM, no MDX expressions, no math) to HAST.
 *
 * - h1–h6 get github-slugger ids (text incl. inline code, per-document `-1` dedupe). h2 and
 *   h3 are numbered in document order (`2`, `2.1`); the number is an empty
 *   `<a class="heading-number" href="#id" data-number aria-label>` before the heading text,
 *   drawn by CSS and named by `aria-label` (generated content is not a dependable name), so
 *   the heading's text stays exactly the post's. h4–h6 wrap their content in
 *   `<a class="heading-anchor" href="#id">`.
 * - Fenced code becomes a Shiki `figure.code-block` (see `code.ts`).
 * - An image on a line of its own becomes `figure.post-image` (splitting its paragraph)
 *   with a caption from the image title, else its alt text; no caption when alt is empty.
 * - External links (`^\w+:` or `//`) open in a new tab.
 * - Tables are wrapped in `div.table-wrap` for horizontal scrolling.
 */
export async function renderMarkdown(
  body: string,
  options: RenderOptions,
): Promise<RenderedMarkdown> {
  const mdast = processor.parse(body);
  const tree = (await processor.run(mdast)) as Root;
  const slugger = new GithubSlugger();
  const toc: TocEntry[] = [];
  const headingIds: RenderedMarkdown["headingIds"] = [];
  const images: PostImageRef[] = [];
  const section = [0, 0];
  let proseText = "";

  const localImage = (img: Element): void => {
    const src = String(img.properties.src ?? "");
    const alt = String(img.properties.alt ?? "");
    if (src.startsWith("./")) {
      const path = `${options.postDir}/${src.slice(2)}`;
      img.properties.dataLocalImage = path;
      images.push({ path, alt });
    }
  };

  const transform = async (parent: Root | Element): Promise<void> => {
    const next: (RootContent | ElementContent)[] = [];
    for (const child of parent.children) {
      if (child.type === "text") {
        proseText += ` ${child.value}`;
        next.push(child);
        continue;
      }
      if (!isElement(child)) {
        next.push(child);
        continue;
      }

      if (
        child.tagName === "pre" &&
        child.children.length === 1 &&
        isElement(child.children[0], "code")
      ) {
        const code = child.children[0];
        const className = (code.properties.className as string[] | undefined) ?? [];
        const lang = className
          .find((name) => name.startsWith("language-"))
          ?.slice("language-".length);
        const meta = (code.data as { meta?: string } | undefined)?.meta;
        // mdast-util-to-hast appends a newline to every fenced block; the block has none.
        const value = toString(code).replace(/\n$/, "");
        next.push(
          await renderCodeBlock({
            code: value,
            lang,
            title: parseCodeMeta(meta).title,
            copyLabel: options.labels.copyCode,
            copiedLabel: options.labels.copiedCode,
            warn: options.warn,
          }),
        );
        continue;
      }

      const heading = HEADING.exec(child.tagName);
      if (heading) {
        const depth = Number(heading[1]);
        const text = toString(child);
        const id = slugger.slug(text);
        await transform(child);
        headingIds.push({ depth, id, text });
        const number = sectionNumber(section, depth);
        if (depth <= 3) {
          toc.push({ depth, id, text, html: tocLabelHtml(child.children), number });
        }
        child.properties = { ...child.properties, id };
        if (number) {
          child.children = [
            {
              type: "element",
              tagName: "a",
              properties: {
                className: ["heading-number"],
                href: `#${id}`,
                dataNumber: number,
                ariaLabel: number,
              },
              children: [],
            },
            ...child.children,
          ];
        } else if (depth > 3) {
          child.children = [
            {
              type: "element",
              tagName: "a",
              properties: { className: ["heading-anchor"], href: `#${id}` },
              children: child.children,
            },
          ];
        }
        next.push(child);
        continue;
      }

      if (child.tagName === "p") {
        const parts = splitStandaloneImages(child);
        if (parts) {
          for (const part of parts) {
            if (part.tagName === "figure") {
              const img = part.children[0] as Element;
              localImage(img);
              const caption = figureCaption(img);
              if (caption) {
                proseText += ` ${caption}`;
                part.children.push({
                  type: "element",
                  tagName: "figcaption",
                  properties: {},
                  children: [{ type: "text", value: caption }],
                });
              }
            } else {
              await transform(part);
            }
            next.push(part);
          }
          continue;
        }
      }

      if (child.tagName === "img") localImage(child);

      if (child.tagName === "a") {
        let href = String(child.properties.href ?? "");
        const misplaced = IMAGE_DIR_URL.exec(href);
        if (misplaced) {
          href = misplaced[1];
          child.properties.href = href;
        }
        if (EXTERNAL_HREF.test(href)) {
          child.properties.target = "_blank";
          child.properties.rel = ["noreferrer", "noopener"];
        }
      }

      await transform(child);

      if (child.tagName === "table") {
        next.push({
          type: "element",
          tagName: "div",
          properties: { className: ["table-wrap"] },
          children: [child],
        });
        continue;
      }
      next.push(child);
    }
    parent.children = next as typeof parent.children;
  };

  await transform(tree);
  const words = countWords(proseText);
  return {
    tree,
    toc,
    headingIds,
    images,
    words,
    readingMinutes: Math.max(1, Math.ceil(words / READING_WPM)),
  };
}

/**
 * Serializes a rendered body for one host tree. On the blog host the blog lives at `/`,
 * so root-relative `/blog/...` links lose their prefix.
 */
export function bodyHtml(tree: Root, host: "main" | "blog"): string {
  if (host === "main") return toHtml(tree);
  const clone = structuredClone(tree);
  const rewrite = (node: Root | Element): void => {
    for (const child of node.children) {
      if (!isElement(child)) continue;
      if (child.tagName === "a") {
        const href = String(child.properties.href ?? "");
        const match = /^\/blog(?=$|[/?#])(.*)$/.exec(href);
        if (match) child.properties.href = match[1].startsWith("/") ? match[1] : `/${match[1]}`;
      }
      rewrite(child);
    }
  };
  rewrite(clone);
  return toHtml(clone);
}
