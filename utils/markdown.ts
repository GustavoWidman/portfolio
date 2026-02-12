import matter from "gray-matter";

export type Language = "en" | "pt";

export interface PostMetadata {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  lang: Language;
  tags: string[];
}

export interface Post extends PostMetadata {
  content: string; // Markdown content
  images: Record<string, string>; // Map of relative paths to resolved URLs
}

// Load all markdown files
const modules = import.meta.glob("../posts/**/*.md", {
  query: "?raw",
  eager: true,
  import: "default",
});

// Load all image files
const postImages = import.meta.glob("../posts/**/*.{png,jpg,jpeg,gif,webp,svg}", {
  eager: true,
  import: "default",
});

export const getAllPosts = (): PostMetadata[] => {
  const posts: PostMetadata[] = [];

  for (const path in modules) {
    const content = modules[path] as string;
    const { data } = matter(content);
    
    // Extract slug and language from path
    // path example: "../posts/my-first-post/en.md"
    const parts = path.split("/");
    const filename = parts.pop() || "";
    const slug = parts.pop() || "";
    const lang = filename.replace(".md", "") as Language;

    if (lang !== "en" && lang !== "pt") continue;

    posts.push({
      slug,
      title: data.title || slug,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      excerpt: data.excerpt || "",
      lang,
      tags: Array.isArray(data.tags) ? data.tags : [],
    });
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getPost = async (slug: string, lang: Language): Promise<Post | null> => {
  const path = `../posts/${slug}/${lang}.md`;
  const contentRaw = modules[path] as string;

  if (!contentRaw) return null;

  const { data, content } = matter(contentRaw);

  // Find images for this post
  const images: Record<string, string> = {};
  const postDir = `../posts/${slug}/`;
  
  for (const imgPath in postImages) {
    if (imgPath.startsWith(postDir)) {
      // Create a relative key, e.g., "./imgs/icon.svg" or "imgs/icon.svg"
      // The markdown likely references relative to the md file.
      // md file is at ../posts/slug/lang.md
      // image is at ../posts/slug/imgs/icon.svg
      // relative path from md to img is ./imgs/icon.svg
      
      const relativePath = imgPath.replace(postDir, "./");
      images[relativePath] = postImages[imgPath] as string;
      
      // Also support non-dot-slash versions just in case
      images[relativePath.replace("./", "")] = postImages[imgPath] as string;
    }
  }

  return {
    slug,
    title: data.title || slug,
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    excerpt: data.excerpt || "",
    lang,
    tags: Array.isArray(data.tags) ? data.tags : [],
    content: content,
    images,
  };
};
