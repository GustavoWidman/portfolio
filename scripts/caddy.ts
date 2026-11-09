/**
 * Regenerates `<dist>/caddy/*`, the precompressed sidecars and the ETag sidecars of a build
 * directory (default `dist`). `astro build` already does all three; run this after changing
 * files in a finished build.
 *
 * Usage: bun scripts/caddy.ts [distDir]
 */
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { writeCaddyConfig, writeEtagSidecars, writePrecompressed } from "../src/caddy/write";

const dist = resolve(process.argv[2] ?? "dist");
if (!existsSync(join(dist, "site", "manifest.json"))) {
  console.error(`${dist}/site/manifest.json not found; run \`bun run build\` first`);
  process.exit(1);
}
writeCaddyConfig(dist);
const { files } = writePrecompressed(dist);
const sidecars = writeEtagSidecars(dist);
console.log(
  `wrote ${dist}/caddy/portfolio.caddy, Caddyfile.local, ${files} precompressed files and ${sidecars} ETag sidecars`,
);
