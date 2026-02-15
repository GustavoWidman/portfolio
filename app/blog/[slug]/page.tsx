import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAllBlogSlugs, getBlogPost } from "@/lib/source";
import { isScheduled } from "@/lib/helpers";
import BlogPostClient from "@/components/blog/BlogPostClient";
import { getMDXComponents } from "@/mdx-components";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // Use English as the canonical metadata language; client handles switching
  const post = getBlogPost(slug, "en") || getBlogPost(slug, "pt");

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | Gustavo Widman`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [
        {
          url: `/og/${slug}-en.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`/og/${slug}-en.png`],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch both languages to allow client-side switching
  const postEn = getBlogPost(slug, "en");
  const postPt = getBlogPost(slug, "pt");

  // If neither exists, 404
  if (!postEn && !postPt) {
    notFound();
  }

  // If the post is scheduled (future date), return 404
  const postDate = postEn?.date || postPt?.date;
  if (postDate && isScheduled(postDate)) {
    notFound();
  }

  // Prepare content rendering on server to avoid passing functions to client
  const EnContent = postEn ? <postEn.content components={getMDXComponents()} /> : undefined;
  const PtContent = postPt ? <postPt.content components={getMDXComponents()} /> : undefined;

  // Strip the content function from the metadata objects
  const enMeta = postEn
    ? (() => {
        const { content, ...rest } = postEn;
        return rest;
      })()
    : undefined;
  const ptMeta = postPt
    ? (() => {
        const { content, ...rest } = postPt;
        return rest;
      })()
    : undefined;

  return (
    <Suspense>
      <BlogPostClient enPost={enMeta} ptPost={ptMeta} enContent={EnContent} ptContent={PtContent} />
    </Suspense>
  );
}
