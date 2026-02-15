import { defineCollections, defineConfig } from "fumadocs-mdx/config";
import type { ShikiTransformer } from "@shikijs/types";
import { z } from "zod";

export const blog = defineCollections({
	type: "doc",
	dir: "./blog",
	schema: z.object({
		title: z.string(),
		// YAML parses dates as Date objects, so we coerce to string
		date: z.coerce.string(),
		excerpt: z.string(),
		tags: z.array(z.string()),
	}),
});

const addCodeMeta: ShikiTransformer = {
	name: "add-code-meta",
	pre(node) {
		const lang = this.options.lang;
		if (!lang) return;
		node.properties = node.properties || {};
		node.properties["data-language"] = lang;
		node.properties["data-line-numbers"] = true;
		if (node.properties.icon) {
			const icon = String(node.properties.icon)
				.replace(/"/g, "'")
				.replace(/\s+/g, " ")
				.trim();
			const encoded = encodeURIComponent(icon);
			const style = String(node.properties.style ?? "");
			node.properties.style = `${style} --fd-code-icon: url("data:image/svg+xml;utf8,${encoded}");`;
		}
		if (node.properties.title) {
			node.properties["data-file"] = node.properties.title;
		}
	},
};

export default defineConfig({
	mdxOptions: {
		rehypeCodeOptions: {
			// Use themes that match our zinc-950 dark background
			themes: {
				light: "catppuccin-latte",
				dark: "dark-plus",
			},
			transformers: [addCodeMeta],
		},
		// Enable image imports for bundling images with blog posts
		remarkImageOptions: {
			useImport: true,
		},
	},
});
