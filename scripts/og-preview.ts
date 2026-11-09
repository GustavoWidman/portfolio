/**
 * Renders every Open Graph card (scheduled posts included) into one flat directory for
 * reviewing the template in `src/og/template.ts` without a full build.
 *
 *   bun scripts/og-preview.ts [out-dir]     (default: dist-og/)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { ogImageList } from "../src/og/images";
import { createOgRenderer } from "../src/og/render";

const root = process.cwd();
const out = resolve(root, process.argv[2] ?? "dist-og");
mkdirSync(out, { recursive: true });

const render = createOgRenderer(root);
const started = performance.now();
const images = ogImageList(root);
await Promise.all(
  images.map(async (image) => writeFileSync(join(out, image.file), await render(image.card))),
);
console.log(`${images.length} images in ${Math.round(performance.now() - started)} ms -> ${out}`);
