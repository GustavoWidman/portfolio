import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllBlogSlugs, getBlogPost } from "@/lib/source";
import { isScheduled } from "@/lib/helpers";
import { detectLanguage, getLanguageFromParam } from "@/lib/language-server";
import BlogPostClient from "@/components/blog/BlogPostClient";
import { JsonLd, blogPostingSchema, breadcrumbSchema } from "@/components/shared/JsonLd";
import { getMDXComponents } from "@/mdx-components";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

const SITE_URL = "https://guswid.com";

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const searchParamsObj = await searchParams;
  const post = getBlogPost(slug, "en") || getBlogPost(slug, "pt");

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const urlLang = await getLanguageFromParam(searchParamsObj.lang || null);
  const lang = urlLang || (await detectLanguage());
  const localizedPost = getBlogPost(slug, lang) || post;

  const postKeywords = [...localizedPost.tags, "guswid", "gustavo widman", "blog"].join(", ");
  const postUrl = `${SITE_URL}/blog/${slug}`;

  return {
    title: localizedPost.title,
    description: localizedPost.excerpt,
    keywords: postKeywords,
    authors: [{ name: "Gustavo Widman", url: SITE_URL }],
    alternates: {
      canonical: postUrl,
      languages: {
        en: postUrl,
        pt: postUrl,
      },
    },
    openGraph: {
      title: localizedPost.title,
      description: localizedPost.excerpt,
      type: "article",
      url: postUrl,
      siteName: "Gustavo Widman",
      publishedTime: localizedPost.date,
      authors: ["Gustavo Widman"],
      tags: localizedPost.tags,
      images: [
        {
          url: `/og/${slug}-${lang}.png`,
          width: 1200,
          height: 630,
          alt: localizedPost.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: localizedPost.title,
      description: localizedPost.excerpt,
      images: [`/og/${slug}-${lang}.png`],
      creator: "@guswid",
    },
  };
}

export default async function BlogPostPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const searchParamsObj = await searchParams;

  const postEn = getBlogPost(slug, "en");
  const postPt = getBlogPost(slug, "pt");

  if (!postEn && !postPt) {
    notFound();
  }

  const postDate = postEn?.date || postPt?.date;
  if (postDate && isScheduled(postDate)) {
    notFound();
  }

  const urlLang = await getLanguageFromParam(searchParamsObj.lang || null);
  const serverLang = urlLang || (await detectLanguage());

  const EnContent = postEn ? <postEn.content components={getMDXComponents()} /> : undefined;
  const PtContent = postPt ? <postPt.content components={getMDXComponents()} /> : undefined;

  const enMeta = postEn
    ? (() => {
        const { content: _, ...rest } = postEn;
        return rest;
      })()
    : undefined;
  const ptMeta = postPt
    ? (() => {
        const { content: _, ...rest } = postPt;
        return rest;
      })()
    : undefined;

  const structuredPost = postEn || postPt;
  const postStructuredData = structuredPost
    ? blogPostingSchema({
        title: structuredPost.title,
        excerpt: structuredPost.excerpt,
        date: structuredPost.date,
        slug,
        tags: structuredPost.tags,
      })
    : null;

  const breadcrumbData = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: structuredPost?.title || "Post", url: `${SITE_URL}/blog/${slug}` },
  ]);

  return (
    <>
      {postStructuredData && <JsonLd data={postStructuredData} />}
      <JsonLd data={breadcrumbData} />
      <BlogPostClient
        enPost={enMeta}
        ptPost={ptMeta}
        enContent={EnContent}
        ptContent={PtContent}
        serverLang={serverLang}
      />
    </>
  );
}
