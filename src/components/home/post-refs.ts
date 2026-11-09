import { SITE_TIMEZONE } from "../../lib/config";
import { postHref } from "../../lib/urls";
import type { HostKind } from "../../lib/config";
import type { Post } from "../../lib/posts";

/** What the home page links to a released post: where it is, when it came out, its title. */
export interface PostRef {
  href: string;
  /** `YYYY-MM-DD` in the site timezone. */
  date: string;
  title: string;
}

/** Released posts by slug. A slug that is absent is not released in this epoch, so no link to it is drawn. */
export type PostRefs = ReadonlyMap<string, PostRef>;

export function postRefs(posts: readonly Post[], host: HostKind): PostRefs {
  return new Map(
    posts.map((post) => [
      post.slug,
      {
        href: postHref(host, post.slug),
        date: post.published.toLocaleDateString("en-CA", {
          timeZone: SITE_TIMEZONE,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        title: post.title,
      },
    ]),
  );
}
