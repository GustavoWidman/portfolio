import { fileURLToPath } from "node:url";

import type { AstroIntegration } from "astro";

import { postSchema } from "../content/schema";
import { readPostSources } from "../content/source";
import { computeEpochs } from "../lib/epochs";
import { isLanguage } from "../lib/config";

const PUBLIC_PATH =
  /^\/(?:blog(?:\/[^/.]+)?|blog\/rss\.xml|llms\.txt|llms-full\.txt|sitemap\.xml|console\.json)?\/?$/;

/**
 * `astro dev` only: serves the main-host URLs (`/`, `/blog`, `/blog/<slug>`, `/sitemap.xml`,
 * `/llms.txt`, …) from the `site/<epoch>/main/<lang>` routes, so links work while
 * developing. The epoch is the newest one already started; the language follows
 * `?lang`, then the `portfolio_lang` cookie, then `Accept-Language`. Production routing
 * is done by the web server, not by this.
 */
export function devRoutes(): AstroIntegration {
  let root: URL;
  return {
    name: "portfolio:dev-routes",
    hooks: {
      "astro:config:done": ({ config }) => {
        root = config.root;
      },
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, _res, next) => {
          const url = new URL(req.url ?? "/", "http://localhost");
          if (!PUBLIC_PATH.test(url.pathname)) return next();
          const dates = readPostSources(fileURLToPath(root)).map(
            (source) => postSchema.parse(source.data).date,
          );
          const now = Math.floor(Date.now() / 1000);
          const epoch =
            computeEpochs(dates)
              .filter((e) => e.start <= now)
              .at(-1)?.name ?? "e0";
          const query = url.searchParams.get("lang");
          const cookie = /(?:^|;\s*)portfolio_lang=(en|pt)/.exec(req.headers.cookie ?? "")?.[1];
          const accept = (req.headers["accept-language"] ?? "").trim().toLowerCase();
          const lang = isLanguage(query)
            ? query
            : (cookie ?? (accept.startsWith("pt") ? "pt" : "en"));
          const path = url.pathname.replace(/\/+$/, "");
          req.url = `/site/${epoch}/main/${lang}${path}${url.search}`;
          next();
        });
      },
    },
  };
}
