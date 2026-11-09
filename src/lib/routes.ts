import { HOSTS, LANGUAGES } from "./config";
import { getEpochs, getPosts } from "./posts";
import { scheduledPosts, servedPosts } from "./release";
import type { HostKind, Language } from "./config";
import type { Epoch } from "./epochs";
import type { Post } from "./posts";

/**
 * Every HTML page of the build. Pages are emitted per release epoch, host tree and
 * language under `site/<epoch>/<host>/<lang>/`, following the public URL layout of the
 * host: the main tree has `/`, `/blog`, `/blog/<slug>`; the blog tree has `/`, `/<slug>`.
 * A tree lists and serves the posts `servedPosts()` picks for its language; a post page
 * renders in the language of the version it shows.
 */
export type PageRoute =
  | { kind: "home"; latest: Post[]; releasedSlugs: string[] }
  | { kind: "blog"; released: Post[]; scheduled: Post[] }
  | { kind: "post"; post: Post; newer?: Post; older?: Post }
  | { kind: "not-found" };

export interface RouteContext {
  epoch: Epoch;
  host: HostKind;
  lang: Language;
}

export interface StaticRoute<T> {
  params: { epoch: string; host: HostKind; lang: Language; path: string | undefined };
  props: RouteContext & T;
}

/** Number of posts listed on the home page. */
const HOME_LATEST = 5;

function pagesFor(
  posts: Post[],
  ctx: RouteContext,
): { path: string | undefined; page: PageRoute }[] {
  const released = servedPosts(posts, ctx.epoch, ctx.lang);
  const scheduled = scheduledPosts(posts, ctx.epoch, ctx.lang);
  const prefix = ctx.host === "main" ? "blog/" : "";
  const pages: { path: string | undefined; page: PageRoute }[] = [];

  if (ctx.host === "main") {
    pages.push({
      path: undefined,
      page: {
        kind: "home",
        latest: released.slice(0, HOME_LATEST),
        releasedSlugs: released.map((post) => post.slug),
      },
    });
  }
  pages.push({
    path: ctx.host === "main" ? "blog" : undefined,
    page: { kind: "blog", released, scheduled },
  });
  released.forEach((post, index) => {
    pages.push({
      path: `${prefix}${post.slug}`,
      page: { kind: "post", post, newer: released[index - 1], older: released[index + 1] },
    });
  });
  // Written to `404/index.html`, moved to `404.html` after the build.
  pages.push({ path: "404", page: { kind: "not-found" } });
  return pages;
}

export async function htmlRoutes(): Promise<StaticRoute<{ page: PageRoute }>[]> {
  const posts = await getPosts();
  const routes: StaticRoute<{ page: PageRoute }>[] = [];
  for (const epoch of await getEpochs()) {
    for (const host of HOSTS) {
      for (const lang of LANGUAGES) {
        const ctx = { epoch, host, lang };
        for (const { path, page } of pagesFor(posts, ctx)) {
          routes.push({ params: { epoch: epoch.name, host, lang, path }, props: { ...ctx, page } });
        }
      }
    }
  }
  return routes;
}
