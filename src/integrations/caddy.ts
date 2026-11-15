import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import { writeCaddyConfig, writeEtagSidecars, writePrecompressed } from "../caddy/write";
import { writeUpstreamerFragments } from "../upstreamer/write";

/**
 * Writes the Caddy config (`dist/caddy/portfolio.caddy`, `dist/caddy/Caddyfile.local`), the
 * upstreamer route fragments (`dist/upstreamer/main.json`, `dist/upstreamer/blog.json`, whose
 * file roots are `PORTFOLIO_SERVE_ROOT`, else the absolute path of `dist/`), the
 * precompressed sidecars and the ETag sidecars after the build. Must be the last integration that writes into `dist/`:
 * it reads the manifest from `distLayout()` and hashes every file, the Open Graph images
 * from `openGraphImages()` included.
 */
export function caddyConfig(): AstroIntegration {
  let root: URL;
  return {
    name: "portfolio:caddy",
    hooks: {
      "astro:config:done": ({ config }) => {
        root = config.root;
      },
      "astro:build:done": ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        writeCaddyConfig(dist, fileURLToPath(root));
        writeUpstreamerFragments(dist, process.env.PORTFOLIO_SERVE_ROOT || undefined);
        const { files, bytes } = writePrecompressed(dist);
        const sidecars = writeEtagSidecars(dist);
        const kb = (n: number): string => `${Math.round(n / 1024)} KB`;
        logger.info(
          `caddy/portfolio.caddy, caddy/Caddyfile.local, upstreamer/{main,blog}.json, ` +
            `${files} files precompressed ` +
            `(${kb(bytes.raw)} -> br ${kb(bytes.br)}, zst ${kb(bytes.zst)}, gz ${kb(bytes.gz)}), ` +
            `${sidecars} ETag sidecars`,
        );
      },
    },
  };
}
