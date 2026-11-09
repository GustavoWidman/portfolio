import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { renderAsync } from "@resvg/resvg-js";
import satori from "satori";

import { OG_FONTS, OG_HEIGHT, OG_WIDTH, ogTemplate } from "./template";
import type { OgCard } from "./template";

export type OgRenderer = (card: OgCard) => Promise<Buffer>;

/**
 * Returns a function that renders a card to PNG: satori lays the template out as SVG
 * (text becomes outlines), resvg rasterizes it without system fonts, so the output only
 * depends on the template, the card and the bundled font files.
 *
 * `root` is the project root; font files are resolved from its node_modules.
 */
export function createOgRenderer(root: string): OgRenderer {
  const require = createRequire(join(root, "package.json"));
  const fonts = OG_FONTS.map((font) => ({
    name: font.name,
    weight: font.weight,
    style: "normal" as const,
    data: readFileSync(require.resolve(font.file)),
  }));

  return async (card) => {
    const svg = await satori(ogTemplate(card), { width: OG_WIDTH, height: OG_HEIGHT, fonts });
    const image = await renderAsync(svg, {
      fitTo: { mode: "original" },
      font: { loadSystemFonts: false },
    });
    return image.asPng();
  };
}
