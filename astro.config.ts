import { fileURLToPath } from "node:url";

import { defineConfig } from "astro/config";
import type { PluginOption } from "vite";

import { caddyConfig } from "./src/integrations/caddy";
import { devRoutes } from "./src/integrations/dev-routes";
import { distLayout } from "./src/integrations/dist-layout";
import { fontSubsets } from "./src/integrations/font-subsets";
import { openGraphImages } from "./src/integrations/og-images";
import { SITE_URL } from "./src/lib/config";
import { postImagesPlugin } from "./src/lib/markdown/image-refs";

const root = fileURLToPath(new URL(".", import.meta.url));

/**
 * Vite wraps every dynamic `import()` in a helper (about 1.7 KB minified) that preloads the
 * imported chunk's CSS and JS dependencies. The only dynamic import here is the console chunk,
 * whose CSS is inlined and whose one dependency is the client module that imports it, so the
 * helper is replaced by a plain call.
 */
function plainDynamicImports(): PluginOption {
  const id = "\0vite/preload-helper.js";
  return {
    name: "portfolio:plain-dynamic-imports",
    enforce: "pre",
    resolveId: (source) => (source === id ? id : undefined),
    load: (source) =>
      source === id ? "export const __vitePreload = (load) => load();" : undefined,
  };
}

/** Asset names: stylesheets are `site.<name>.<hash>.css`, everything else `<name>.<hash>.<ext>`. */
function assetFileNames(asset: { names?: string[] }): string {
  return asset.names?.[0]?.endsWith(".css")
    ? "_astro/site.[name].[hash][extname]"
    : "_astro/[name].[hash][extname]";
}

export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "ignore",
  build: {
    format: "directory",
    assets: "_astro",
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
  // `openGraphImages` reads the manifest `distLayout` writes, so it must come after it;
  // `caddyConfig` hashes every file in dist/, so it comes after both.
  integrations: [fontSubsets(), distLayout(), openGraphImages(), caddyConfig(), devRoutes()],
  vite: {
    plugins: [postImagesPlugin(root), plainDynamicImports()],
    build: {
      // Never inline scripts or assets: the client module stays one shared, cacheable file.
      assetsInlineLimit: 0,
      rolldownOptions: { output: { assetFileNames } },
    },
    environments: {
      client: {
        build: {
          rolldownOptions: {
            output: {
              entryFileNames: "_astro/client.[hash].js",
              chunkFileNames: "_astro/chunk.[hash].js",
              assetFileNames,
            },
          },
        },
      },
    },
  },
});
