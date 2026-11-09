import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { brotliCompressSync, constants, gzipSync, zstdCompressSync } from "node:zlib";

import { epochFiles } from "../lib/urls";
import { caddySnippet, localCaddyfile } from "./snippet";
import type { CaddyManifest } from "./snippet";

/** Build directories whose files get `.etag` sidecars (see `writeEtagSidecars`). */
const ETAG_DIRS = ["site", "static"] as const;

/**
 * `site/<epoch>/og/` must list exactly the epoch's images (`scripts/check-metadata.ts`), so
 * its PNGs keep Caddy's default ETag (modification time and size).
 */
function skipsEtag(dist: string, dir: string): boolean {
  const parts = relative(dist, dir).split(sep);
  return parts.length === 3 && parts[0] === "site" && parts[2] === epochFiles.ogDir;
}

export function readManifest(dist: string): CaddyManifest {
  return JSON.parse(readFileSync(join(dist, "site", "manifest.json"), "utf8")) as CaddyManifest;
}

/**
 * Writes `<dist>/caddy/portfolio.caddy` and `<dist>/caddy/Caddyfile.local`. The local
 * Caddyfile serves `dist` relative to `base` (the directory Caddy is started from), so the
 * output does not depend on where the build ran.
 */
export function writeCaddyConfig(
  dist: string,
  base: string = process.cwd(),
  manifest: CaddyManifest = readManifest(dist),
): void {
  const dir = join(dist, "caddy");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "portfolio.caddy"), caddySnippet(manifest));
  writeFileSync(join(dir, "Caddyfile.local"), localCaddyfile({ dist: pathFrom(base, dist) }));
}

/** `target` relative to `base` when it lies inside it, else absolute. */
function pathFrom(base: string, target: string): string {
  const path = relative(base, resolve(target));
  if (path === "") return ".";
  return path.startsWith("..") || isAbsolute(path) ? resolve(target) : path;
}

function* walk(dir: string, skip: (dir: string) => boolean): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skip(path)) yield* walk(path, skip);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

/** Files served with precompressed sidecars; everything else is already compressed. */
const COMPRESSIBLE = /\.(html|css|js|json|xml|txt|md|svg)$/;

/** Sidecar extension and encoder per content coding, at each format's highest level. */
const ENCODERS: [ext: string, encode: (raw: Buffer) => Buffer][] = [
  [
    "br",
    (raw) =>
      brotliCompressSync(raw, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
          [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
          [constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
        },
      }),
  ],
  // Level 19 is the highest that keeps the window within the 8 MB browsers accept.
  ["zst", (raw) => zstdCompressSync(raw, { params: { [constants.ZSTD_c_compressionLevel]: 19 } })],
  ["gz", (raw) => gzipSync(raw, { level: constants.Z_BEST_COMPRESSION })],
];

export interface PrecompressStats {
  files: number;
  bytes: Record<"raw" | "br" | "zst" | "gz", number>;
}

/**
 * Writes `.br`, `.zst` and `.gz` sidecars next to every compressible file under `_astro/`,
 * `static/` and the trees in `site/`, so `file_server` sends them without compressing at
 * request time. A sidecar that would not be smaller than its file is not written (and a stale
 * one is removed); such files are compressed on the fly by `encode` when large enough.
 * Rewrites every sidecar on each run, so it is safe to run again on a finished build.
 */
export function writePrecompressed(dist: string): PrecompressStats {
  const stats: PrecompressStats = { files: 0, bytes: { raw: 0, br: 0, zst: 0, gz: 0 } };
  const manifest = join(dist, "site", "manifest.json");
  for (const name of ["_astro", "static", "site"]) {
    for (const file of walk(join(dist, name), () => false)) {
      if (!COMPRESSIBLE.test(file) || file === manifest) continue;
      const raw = readFileSync(file);
      stats.files += 1;
      stats.bytes.raw += raw.length;
      for (const [ext, encode] of ENCODERS) {
        const out = encode(raw);
        const sidecar = `${file}.${ext}`;
        if (out.length < raw.length) {
          writeFileSync(sidecar, out);
          stats.bytes[ext as "br"] += out.length;
        } else {
          rmSync(sidecar, { force: true });
          stats.bytes[ext as "br"] += raw.length;
        }
      }
    }
  }
  return stats;
}

/**
 * Writes `<file>.etag` next to every file under `site/` and `static/` (precompressed
 * variants included, Open Graph images excluded), holding a quoted content hash that Caddy
 * sends as the ETag. Run it after `writePrecompressed`, and again whenever files there
 * change. Returns the number of sidecars written.
 */
export function writeEtagSidecars(dist: string): number {
  let count = 0;
  for (const name of ETAG_DIRS) {
    for (const file of walk(join(dist, name), (dir) => skipsEtag(dist, dir))) {
      if (file.endsWith(".etag")) continue;
      const hash = createHash("sha256").update(readFileSync(file)).digest("base64url");
      writeFileSync(`${file}.etag`, `"${hash.slice(0, 24)}"`);
      count += 1;
    }
  }
  return count;
}
