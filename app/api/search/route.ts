import { createSearchAPI } from "fumadocs-core/search/server";
import { getBlogPostsForSearch } from "@/lib/source";

// Build search indexes from blog posts
function buildIndexes() {
	const posts = getBlogPostsForSearch();

	return posts.map((post) => ({
		id: `${post.slug}-${post.lang}`,
		title: post.title,
		description: post.excerpt,
		url: `/blog/${post.slug}`,
		tag: post.lang, // Use lang as tag for filtering
		structuredData: post.structuredData,
	}));
}

const searchAPI = createSearchAPI("advanced", {
	indexes: buildIndexes,
});

// Use staticGET for fully static export: exports the entire Orama search
// index as a JSON blob at build time. The client downloads it once and
// runs all searches locally via @orama/orama in the browser.
export const GET = searchAPI.staticGET;

// Force this route to be pre-rendered at build time
export const dynamic = "force-static";
