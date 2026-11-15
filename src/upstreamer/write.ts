import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { readManifest } from "../caddy/write";
import { HOSTS } from "../lib/config";
import { localUpstreamerConfig, renderFragment, upstreamerFragment } from "./fragment";
import type { FragmentManifest } from "./fragment";

/**
 * Writes `<dist>/upstreamer/main.json` and `<dist>/upstreamer/blog.json`, serving the build
 * from `root` (default: `dist` itself, as an absolute path), and `<dist>/upstreamer/local.json`
 * including them from `root`. A Nix build passes its `$out`, where the files end up.
 */
export function writeUpstreamerFragments(
  dist: string,
  root: string = resolve(dist),
  manifest: FragmentManifest = readManifest(dist),
): void {
  const dir = join(dist, "upstreamer");
  mkdirSync(dir, { recursive: true });
  for (const kind of HOSTS) {
    writeFileSync(
      join(dir, `${kind}.json`),
      renderFragment(upstreamerFragment(manifest, root, kind)),
    );
  }
  writeFileSync(
    join(dir, "local.json"),
    localUpstreamerConfig({ fragments: join(root, "upstreamer") }),
  );
}
