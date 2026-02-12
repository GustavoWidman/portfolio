import type { ReactNode } from "react";
import { blog } from "@/.source";
import type { MDXProps } from "mdx/types";

export interface BlogPost {
	slug: string;
	lang: "en" | "pt";
	title: string;
	date: string;
	excerpt: string;
	tags: string[];
	content: React.ComponentType<MDXProps>;
	toc: { id: string; text: ReactNode; depth: number }[];
}

export interface BlogPostSummary {
	slug: string;
	lang: "en" | "pt";
	title: string;
	date: string;
	excerpt: string;
	tags: string[];
}

// Get all blog posts
export function getBlogPosts(): BlogPost[] {
	return blog.map((entry) => {
		// Extract language from file path (e.g., "terraria-autofish/en.mdx" -> "en")
		const pathParts = entry._file.path.replace(/\.mdx?$/, "").split("/");
		const lang = pathParts[pathParts.length - 1] as "en" | "pt";
		// Slug is the directory name (e.g., "terraria-autofish")
		const slug = pathParts.slice(0, -1).join("/") || pathParts[0];

		return {
			slug,
			lang,
			title: entry.title,
			date: entry.date,
			excerpt: entry.excerpt,
			tags: entry.tags,
			content: entry.body,
			toc: entry.toc.map((item) => ({
				id: item.url.slice(1), // Remove leading #
				text: item.title,
				depth: item.depth,
			})),
		};
	});
}

export function getBlogPostSummaries(): BlogPostSummary[] {
	return blog.map((entry) => {
		const pathParts = entry._file.path.replace(/\.mdx?$/, "").split("/");
		const lang = pathParts[pathParts.length - 1] as "en" | "pt";
		const slug = pathParts.slice(0, -1).join("/") || pathParts[0];

		return {
			slug,
			lang,
			title: entry.title,
			date: entry.date,
			excerpt: entry.excerpt,
			tags: entry.tags,
		};
	});
}

// Get posts filtered by language
export function getBlogPostsByLang(lang: "en" | "pt"): BlogPost[] {
	return getBlogPosts().filter((post) => post.lang === lang);
}

// Get a specific blog post by slug and language
export function getBlogPost(
	slug: string,
	lang: "en" | "pt",
): BlogPost | undefined {
	return getBlogPosts().find(
		(post) => post.slug === slug && post.lang === lang,
	);
}

// Get all unique slugs (for generateStaticParams)
export function getAllBlogSlugs(): string[] {
	const posts = getBlogPosts();
	const slugs = new Set(posts.map((post) => post.slug));
	return Array.from(slugs);
}

// For search indexing
export function getBlogPostsForSearch() {
	return blog.map((entry) => {
		const pathParts = entry._file.path.replace(/\.mdx?$/, "").split("/");
		const lang = pathParts[pathParts.length - 1] as "en" | "pt";
		const slug = pathParts.slice(0, -1).join("/") || pathParts[0];

		return {
			slug,
			lang,
			title: entry.title,
			excerpt: entry.excerpt,
			tags: entry.tags,
			structuredData: entry.structuredData,
		};
	});
}
