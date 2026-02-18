import type { MetadataRoute } from "next";
import { getAllBlogSlugs, getBlogPost } from "@/lib/source";

export const dynamic = "force-static";

const SITE_URL = "https://guswid.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogSlugs = getAllBlogSlugs();

  const blogPosts = blogSlugs
    .map((slug) => {
      const post = getBlogPost(slug, "en") || getBlogPost(slug, "pt");
      if (!post) return null;

      const lastModified = post.date ? new Date(post.date) : new Date();

      return {
        url: `${SITE_URL}/blog/${slug}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      };
    })
    .filter((post): post is NonNullable<typeof post> => post !== null);

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...blogPosts,
  ];
}
