import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import harfbuzz from "harfbuzzjs";
import { compress, decompress } from "wawoff2";
import type { AstroIntegration } from "astro";

import { LANGUAGES } from "../lib/config";
import { formatDate, formatDateTime, formatMonth } from "../i18n";

/** The web fonts of the site (`@font-face` in global.css, preloaded by Head.astro). */
const FONTS = [
  "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
];

/** Text sources: everything the pages render comes from these files or from Intl. */
const TEXT_DIRS = ["src", "blog"];
const TEXT_FILES = /\.(astro|ts|css|mdx?|json)$/;

/** HB_SUBSET_SETS_LAYOUT_FEATURE_TAG in hb-subset.h. */
const LAYOUT_FEATURES = 6;

/** Built files whose text can reach the screen. */
const OUTPUT_FILES = /\.(html|css|js|json)$/;

function* textFiles(dir: string, pattern = TEXT_FILES): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* textFiles(path, pattern);
    else if (pattern.test(entry.name)) yield path;
  }
}

/** Code points of every built page, stylesheet and script, entities decoded. */
function outputCodepoints(dist: string): Set<number> {
  const points = new Set<number>();
  for (const file of textFiles(dist, OUTPUT_FILES)) {
    const text = readFileSync(file, "utf8")
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
      .replace(/\\u([0-9a-f]{4})/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
    for (const char of text) points.add(char.codePointAt(0)!);
  }
  return points;
}

/**
 * Code points the site can render: printable ASCII (typed into the console), every
 * character of the text sources, and what Intl writes for dates in both languages.
 */
function siteCodepoints(root: string): Set<number> {
  const points = new Set<number>();
  const add = (text: string): void => {
    for (const char of text) points.add(char.codePointAt(0)!);
  };
  for (let c = 0x20; c < 0x7f; c++) points.add(c);
  for (const dir of TEXT_DIRS) {
    for (const file of textFiles(join(root, dir))) add(readFileSync(file, "utf8"));
  }
  for (const lang of LANGUAGES) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(Date.UTC(2026, month, 15, 15));
      add(formatDate(date, lang) + formatMonth(date, lang) + formatDateTime(date, lang));
    }
  }
  return points;
}

interface HarfBuzz {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): void;
  hb_blob_create(data: number, length: number, mode: number, user: number, destroy: number): number;
  hb_blob_destroy(blob: number): void;
  hb_blob_get_data(blob: number, length: number): number;
  hb_blob_get_length(blob: number): number;
  hb_face_create(blob: number, index: number): number;
  hb_face_destroy(face: number): void;
  hb_face_reference_blob(face: number): number;
  hb_set_add(set: number, codepoint: number): void;
  hb_set_clear(set: number): void;
  hb_set_invert(set: number): void;
  hb_subset_input_create_or_fail(): number;
  hb_subset_input_destroy(input: number): void;
  hb_subset_input_set(input: number, kind: number): number;
  hb_subset_input_unicode_set(input: number): number;
  hb_subset_or_fail(face: number, input: number): number;
}

/** Subsets an OpenType font to `codepoints`, keeping every layout feature (tnum and the rest). */
function subset(hb: HarfBuzz, font: Uint8Array, codepoints: Set<number>): Uint8Array {
  const ptr = hb.malloc(font.byteLength);
  new Uint8Array(hb.memory.buffer).set(font, ptr);
  const blob = hb.hb_blob_create(ptr, font.byteLength, 2, 0, 0);
  const face = hb.hb_face_create(blob, 0);
  hb.hb_blob_destroy(blob);
  const input = hb.hb_subset_input_create_or_fail();
  const unicodes = hb.hb_subset_input_unicode_set(input);
  for (const point of codepoints) hb.hb_set_add(unicodes, point);
  const features = hb.hb_subset_input_set(input, LAYOUT_FEATURES);
  hb.hb_set_clear(features);
  hb.hb_set_invert(features);
  const result = hb.hb_subset_or_fail(face, input);
  hb.hb_subset_input_destroy(input);
  hb.hb_face_destroy(face);
  if (!result) {
    hb.free(ptr);
    throw new Error("hb_subset_or_fail failed");
  }
  const out = hb.hb_face_reference_blob(result);
  const data = hb.hb_blob_get_data(out, 0);
  const bytes = new Uint8Array(hb.memory.buffer).slice(data, data + hb.hb_blob_get_length(out));
  hb.hb_blob_destroy(out);
  hb.hb_face_destroy(result);
  hb.free(ptr);
  return bytes;
}

/**
 * Serves the two web fonts subset to the characters the site renders (about a third
 * smaller than the Latin files). The subsets are written to Astro's cache directory before
 * Vite runs and replace the package files through an alias, so the stylesheet, the preload
 * links and the hashed file names all refer to them. After the build, every character in
 * the output that the full fonts cover is checked against the subset; a miss fails the
 * build instead of rendering in a fallback font.
 */
export function fontSubsets(): AstroIntegration {
  let codepoints: Set<number>;
  let root: string;
  return {
    name: "portfolio:font-subsets",
    hooks: {
      "astro:config:setup": async ({ config, updateConfig, logger }) => {
        root = fileURLToPath(config.root);
        const dir = join(fileURLToPath(config.cacheDir), "font-subsets");
        mkdirSync(dir, { recursive: true });
        codepoints = siteCodepoints(root);
        const wasm = readFileSync(join(root, "node_modules/harfbuzzjs/hb-subset.wasm"));
        const { instance } = await WebAssembly.instantiate(wasm);
        const hb = instance.exports as unknown as HarfBuzz;
        const alias: { find: RegExp; replacement: string }[] = [];
        let before = 0;
        let after = 0;
        for (const spec of FONTS) {
          const source = readFileSync(join(root, "node_modules", spec));
          const font = await decompress(source);
          const woff2 = await compress(subset(hb, font, codepoints));
          const target = join(dir, basename(spec));
          writeFileSync(target, woff2);
          alias.push({ find: new RegExp(`^${spec.replaceAll(".", "\\.")}`), replacement: target });
          before += source.length;
          after += woff2.length;
        }
        logger.info(`${codepoints.size} code points, fonts ${before} -> ${after} bytes`);
        updateConfig({ vite: { resolve: { alias } } });
      },
      "astro:build:done": async ({ dir }) => {
        const hb = await harfbuzz;
        const rendered = outputCodepoints(fileURLToPath(dir));
        const missing = new Set<number>();
        for (const spec of FONTS) {
          const font = await decompress(readFileSync(join(root, "node_modules", spec)));
          const face = hb.createFace(hb.createBlob(font), 0);
          for (const point of face.collectUnicodes()) {
            if (rendered.has(point) && !codepoints.has(point)) missing.add(point);
          }
          face.destroy();
        }
        if (missing.size > 0) {
          const list = [...missing].map(
            (p) => `U+${p.toString(16).toUpperCase().padStart(4, "0")}`,
          );
          throw new Error(
            `the output uses characters missing from the font subsets: ${list.join(" ")}`,
          );
        }
      },
    },
  };
}
