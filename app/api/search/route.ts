import { createSearchAPI } from "fumadocs-core/search/server";
import { getBlogPostsForSearch } from "@/lib/source";

function buildIndexes() {
  const posts = getBlogPostsForSearch();

  return posts.map((post) => ({
    id: `${post.slug}-${post.lang}`,
    title: post.title,
    description: post.excerpt,
    url: `/blog/${post.slug}`,
    tag: post.lang,
    structuredData: post.structuredData,
  }));
}

function buildSubdomainIndexes() {
  const posts = getBlogPostsForSearch();

  return posts.map((post) => ({
    id: `${post.slug}-${post.lang}`,
    title: post.title,
    description: post.excerpt,
    url: `/${post.slug}`,
    tag: post.lang,
    structuredData: post.structuredData,
  }));
}

const searchAPI = createSearchAPI("advanced", {
  indexes: buildIndexes,
});

const searchAPISubdomain = createSearchAPI("advanced", {
  indexes: buildSubdomainIndexes,
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isSubdomain =
    url.searchParams.get("subdomain") === "true" ||
    (request.headers.get("host")?.startsWith("blog.") ?? false);

  if (isSubdomain) {
    return searchAPISubdomain.staticGET();
  }

  return searchAPI.staticGET();
}
