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

const searchAPI = createSearchAPI("advanced", {
  indexes: buildIndexes,
});

export const GET = searchAPI.staticGET;
