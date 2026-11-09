import { existsSync, mkdirSync, readdirSync, renameSync, rmdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import { postSchema } from "../content/schema";
import { readPostSources } from "../content/source";
import { buildTime, computeEpochs } from "../lib/epochs";
import { HOSTS, LANGUAGES } from "../lib/config";
import { treeFiles } from "../lib/urls";

/** Contents of `dist/site/manifest.json`, the contract with the web-server config generator. */
export interface SiteManifest {
  buildTime: number;
  epochs: { name: string; start: number }[];
  hosts: readonly string[];
  languages: readonly string[];
  /** Machine file names inside every `site/<epoch>/<host>/<lang>/` tree. */
  files: Record<string, string>;
  /**
   * Open Graph images, added by `openGraphImages()`: `path` is the file pattern for the
   * URL `/og/<file>`, `files` lists the images present in each epoch.
   */
  og?: { path: string; files: Record<string, string[]> };
}

/**
 * Shapes `dist/` after Astro has written it:
 * - files from `public/` move to `dist/static/` (served at `/` by the web server);
 * - every `site/<epoch>/<host>/<lang>/404/index.html` becomes `.../404.html`;
 * - `dist/site/manifest.json` lists the epochs (name, start in unix seconds), hosts,
 *   languages and machine file names, for the web-server config generator.
 */
export function distLayout(): AstroIntegration {
  let publicDir: URL;
  let root: URL;
  return {
    name: "portfolio:dist-layout",
    hooks: {
      "astro:config:done": ({ config }) => {
        publicDir = config.publicDir;
        root = config.root;
      },
      "astro:build:done": ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        const staticDir = join(dist, "static");
        mkdirSync(staticDir, { recursive: true });
        const publicPath = fileURLToPath(publicDir);
        if (existsSync(publicPath)) {
          for (const name of readdirSync(publicPath)) {
            const from = join(dist, name);
            if (existsSync(from)) renameSync(from, join(staticDir, name));
          }
        }

        const sources = readPostSources(fileURLToPath(root));
        const dates = sources.map((source) => postSchema.parse(source.data).date);
        const epochs = computeEpochs(dates);
        for (const epoch of epochs) {
          for (const host of HOSTS) {
            for (const lang of LANGUAGES) {
              const tree = join(dist, "site", epoch.name, host, lang);
              const nested = join(tree, "404", "index.html");
              if (!existsSync(nested)) throw new Error(`missing ${nested}`);
              renameSync(nested, join(tree, treeFiles.notFound));
              rmdirSync(join(tree, "404"));
            }
          }
        }

        const manifest: SiteManifest = {
          buildTime: buildTime(),
          epochs: epochs.map(({ name, start }) => ({ name, start })),
          hosts: HOSTS,
          languages: LANGUAGES,
          files: {
            sitemap: treeFiles.sitemap,
            llms: treeFiles.llms,
            llmsFull: treeFiles.llmsFull,
            curl: treeFiles.curl,
            blogMarkdown: treeFiles.blogMarkdown,
            postMarkdown: treeFiles.postMarkdown("<slug>"),
            feedMain: treeFiles.feed("main"),
            feedBlog: treeFiles.feed("blog"),
            notFound: treeFiles.notFound,
          },
        };
        writeFileSync(
          join(dist, "site", "manifest.json"),
          `${JSON.stringify(manifest, null, 2)}\n`,
        );
        logger.info(
          `${epochs.length} epoch(s): ${epochs.map((e) => `${e.name}@${e.start}`).join(", ")}`,
        );
      },
    },
  };
}
