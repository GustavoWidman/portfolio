// source.config.ts
import { defineCollections, defineConfig } from "fumadocs-mdx/config";
import { z } from "zod";
var blog = defineCollections({
  type: "doc",
  dir: "./content/blog",
  schema: z.object({
    title: z.string(),
    // YAML parses dates as Date objects, so we coerce to string
    date: z.coerce.string(),
    excerpt: z.string(),
    tags: z.array(z.string())
  })
});
var addCodeMeta = {
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
  }
};
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      // Use themes that match our zinc-950 dark background
      themes: {
        light: "catppuccin-latte",
        dark: "dark-plus"
      },
      transformers: [addCodeMeta]
    },
    // Disable image imports - use plain src strings instead
    // This prevents [object Object] issues with our custom img component
    remarkImageOptions: {
      useImport: false
    }
  }
});
export {
  blog,
  source_config_default as default
};
