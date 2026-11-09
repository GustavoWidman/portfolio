import { relative } from "node:path";
import { fileURLToPath } from "node:url";

import type { Loader } from "astro/loaders";

import { readPostSources } from "./source";

/**
 * Content-layer loader for `blog/<slug>/<lang>.mdx`.
 *
 * Entries are keyed `<slug>/<lang>`; `body` is the markdown without frontmatter and
 * `filePath` is the source file relative to the project root. Rendering happens in `src/lib/markdown`, not in
 * Astro's markdown pipeline, so the posts are parsed as CommonMark + GFM exactly once.
 */
export function blogLoader(): Loader {
  return {
    name: "portfolio-blog",
    load: async ({ config, store, parseData, generateDigest, logger }): Promise<void> => {
      const root = fileURLToPath(config.root);
      const sources = readPostSources(root);
      store.clear();
      for (const source of sources) {
        const data = await parseData({
          id: source.id,
          data: source.data,
          filePath: source.filePath,
        });
        store.set({
          id: source.id,
          data,
          body: source.body,
          filePath: relative(root, source.filePath),
          digest: generateDigest(source.raw),
        });
      }
      logger.info(`loaded ${sources.length} posts`);
    },
  };
}
