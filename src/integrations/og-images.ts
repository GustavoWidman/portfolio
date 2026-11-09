import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import { writeOgImages } from "../og/images";
import { epochFiles } from "../lib/urls";
import type { SiteManifest } from "./dist-layout";

/**
 * Renders the Open Graph images after the build into `dist/site/<epoch>/og/` and records
 * them in `dist/site/manifest.json` under `og`. Must run after `distLayout()`, which
 * writes the manifest and its epoch list.
 */
export function openGraphImages(): AstroIntegration {
  let root: URL;
  return {
    name: "portfolio:og-images",
    hooks: {
      "astro:config:done": ({ config }) => {
        root = config.root;
      },
      "astro:build:done": async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const manifestPath = join(dist, "site", "manifest.json");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as SiteManifest;
        const started = performance.now();
        const files = await writeOgImages(fileURLToPath(root), dist, manifest.epochs);

        manifest.og = { path: `site/<epoch>/${epochFiles.ogImage("<file>")}`, files };
        writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
        const counts = Object.entries(files).map(([epoch, names]) => `${epoch}: ${names.length}`);
        logger.info(
          `og images in ${Math.round(performance.now() - started)} ms (${counts.join(", ")})`,
        );
      },
    },
  };
}
