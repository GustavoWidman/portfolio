import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import remarkGfm from "remark-gfm";
import sharp from "sharp";
import remarkParse from "remark-parse";
import { unified } from "unified";
import type { ViteUserConfig } from "astro";
import type { Nodes } from "mdast";

import { readPostSources } from "../../content/source";

/** A Vite plugin object, typed through Astro's config so `vite` needs no direct dependency. */
type VitePlugin = Extract<NonNullable<ViteUserConfig["plugins"]>[number], { name: string }>;

const parser = unified().use(remarkParse).use(remarkGfm);

/** Project-relative paths of the local images (`./…`) a post body references. */
export function localImagePaths(body: string, postDir: string): string[] {
  const paths: string[] = [];
  const walk = (node: Nodes): void => {
    if (node.type === "image" && node.url.startsWith("./")) {
      paths.push(`${postDir}/${node.url.slice(2)}`);
    }
    if ("children" in node) for (const child of node.children) walk(child);
  };
  walk(parser.parse(body));
  return paths;
}

const MODULE_ID = "virtual:post-images";
const RESOLVED_ID = `\0${MODULE_ID}`;
/** Prefix of the modules whose default export is the URL of a GIF's animated WebP. */
const WEBP_PREFIX = "animated-webp:";
/** Ends the resolved id, so no plugin takes the module for a `.gif` import. */
const WEBP_SUFFIX = ".webp-url";

/**
 * Lossless animated WebP of a GIF: the same frames, pixel for pixel, with the same delays
 * and loop count, about 30% smaller. Cached by content under Vite's cache directory, since
 * encoding the larger GIFs takes seconds.
 */
async function animatedWebp(gif: Buffer, cacheDir: string): Promise<Buffer> {
  const options = { lossless: true, effort: 4 } as const;
  const key = createHash("sha256").update(gif).update(JSON.stringify(options)).digest("hex");
  const cached = join(cacheDir, "animated-webp", `${key.slice(0, 32)}.webp`);
  if (existsSync(cached)) return readFileSync(cached);
  const webp = await sharp(gif, { animated: true, limitInputPixels: false })
    .webp(options)
    .toBuffer();
  mkdirSync(join(cacheDir, "animated-webp"), { recursive: true });
  writeFileSync(cached, webp);
  return webp;
}

/**
 * Vite plugin exposing `virtual:post-images`: a map from project-relative image path to
 * the Astro image metadata of every image referenced by a post, and `animatedWebp`, a map
 * from the path of each referenced GIF to the URL of its animated WebP (undefined when the
 * WebP would not be smaller). Only referenced
 * files are imported, so unused files in `blog/<slug>/imgs/` never reach the build output.
 */
export function postImagesPlugin(root: string): VitePlugin {
  let build = false;
  let cacheDir = join(root, "node_modules", ".vite");
  return {
    name: "portfolio:post-images",
    enforce: "pre",
    configResolved(config) {
      build = config.command === "build";
      cacheDir = config.cacheDir;
    },
    resolveId(id) {
      if (id === MODULE_ID) return RESOLVED_ID;
      if (id.startsWith(WEBP_PREFIX)) return `\0${id}${WEBP_SUFFIX}`;
      return undefined;
    },
    async load(id) {
      if (id.startsWith(`\0${WEBP_PREFIX}`)) {
        const path = id.slice(WEBP_PREFIX.length + 1, -WEBP_SUFFIX.length);
        const gif = readFileSync(join(root, path));
        const webp = await animatedWebp(gif, cacheDir);
        // Some GIFs (few colours, small changes between frames) are smaller than any WebP.
        if (webp.length >= gif.length) return "export default undefined;";
        if (!build) {
          const file = join(cacheDir, "animated-webp", `${basename(path, ".gif")}.webp`);
          writeFileSync(file, webp);
          return `export default ${JSON.stringify(`/@fs${file}`)};`;
        }
        const ref = this.emitFile({
          type: "asset",
          name: `${basename(path, ".gif")}.webp`,
          source: webp,
        });
        return `export default import.meta.ROLLUP_FILE_URL_${ref};`;
      }
      if (id !== RESOLVED_ID) return undefined;
      const paths = new Set<string>();
      for (const source of readPostSources(root)) {
        for (const path of localImagePaths(source.body, `blog/${source.slug}`)) paths.add(path);
      }
      const sorted = [...paths].sort();
      const gifs = sorted.filter((path) => path.endsWith(".gif"));
      const imports = [
        ...sorted.map((path, i) => `import i${i} from ${JSON.stringify(`/${path}`)};`),
        ...gifs.map((path, i) => `import w${i} from ${JSON.stringify(`${WEBP_PREFIX}${path}`)};`),
      ];
      const entries = sorted.map((path, i) => `  ${JSON.stringify(path)}: i${i},`);
      const webps = gifs.map((path, i) => `  ${JSON.stringify(path)}: w${i},`);
      return [
        imports.join("\n"),
        `export const animatedWebp = {\n${webps.join("\n")}\n};`,
        `export default {\n${entries.join("\n")}\n};\n`,
      ].join("\n");
    },
  };
}
