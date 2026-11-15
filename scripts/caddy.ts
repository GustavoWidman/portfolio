/**
 * Regenerates `<dist>/caddy/*`, `<dist>/upstreamer/*`, the precompressed sidecars and the ETag
 * sidecars of a build directory (default `dist`). `astro build` already does all of them; run
 * this after changing files in a finished build. The upstreamer fragments serve the build from
 * `PORTFOLIO_SERVE_ROOT`, else from the build directory.
 *
 * Usage: bun scripts/caddy.ts [distDir]
 */
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { writeCaddyConfig, writeEtagSidecars, writePrecompressed } from "../src/caddy/write";
import { writeUpstreamerFragments } from "../src/upstreamer/write";

const dist = resolve(process.argv[2] ?? "dist");
if (!existsSync(join(dist, "site", "manifest.json"))) {
  console.error(`${dist}/site/manifest.json not found; run \`bun run build\` first`);
  process.exit(1);
}
writeCaddyConfig(dist);
writeUpstreamerFragments(dist, process.env.PORTFOLIO_SERVE_ROOT || undefined);
const { files } = writePrecompressed(dist);
const sidecars = writeEtagSidecars(dist);
console.log(
  `wrote ${dist}/caddy/portfolio.caddy, Caddyfile.local, upstreamer/{main,blog}.json, ${files} precompressed files and ${sidecars} ETag sidecars`,
);
