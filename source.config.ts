import { defineCollections, defineConfig } from "fumadocs-mdx/config";
import type { ShikiTransformer } from "@shikijs/types";
import { z } from "zod";
import { formatDateValue, getPublicationDate } from "./lib/publication-date";

export const blog = defineCollections({
  type: "doc",
  dir: "./blog",
  schema: z.object({
    title: z.string(),
    // Quote timed releases with an explicit UTC offset; legacy YAML dates stay date-only.
    date: z.preprocess(
      formatDateValue,
      z
        .string()
        .refine(
          (value) => Number.isFinite(getPublicationDate(value).getTime()),
          "Use YYYY-MM-DD or a quoted ISO timestamp with an explicit timezone",
        ),
    ),
    excerpt: z.string(),
    tags: z.array(z.string()),
  }),
  postprocess: {
    includeProcessedMarkdown: true,
  },
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
      const icon = String(node.properties.icon).replace(/"/g, "'").replace(/\s+/g, " ").trim();
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
