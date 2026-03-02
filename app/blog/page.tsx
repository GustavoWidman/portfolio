import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getBlogPostSummaries } from "@/lib/source";
import { detectLanguage, getLanguageFromParam } from "@/lib/language-server";
import { shouldServeMarkdown } from "@/lib/is-ai-agent";
import BlogListingClient from "@/components/blog/BlogListingClient";
import { BlogBreadcrumbJsonLd, BlogJsonLd } from "@/components/shared/JsonLd";
const SITE_URL = "https://guswid.com";

interface BlogPageProps {
  searchParams: Promise<{ lang?: string; format?: string; raw?: string }>;
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const params = await searchParams;
  const urlLang = await getLanguageFromParam(params.lang || null);
  const lang = urlLang || (await detectLanguage());

  return {
    title: "Blog",
    description:
      "A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research by Gustavo Widman.",
    keywords: [
      "guswid blog",
      "gustavo widman blog",
      "systems programming",
      "NixOS",
      "cybersecurity",
      "rust programming",
      "reverse engineering",
      "backend development",
    ],
    alternates: {
      canonical: `${SITE_URL}/blog`,
      languages: {
        en: `${SITE_URL}/blog`,
        pt: `${SITE_URL}/blog`,
      },
    },
    openGraph: {
      title: "Blog | Gustavo Widman",
      description:
        "A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research.",
      type: "website",
      url: `${SITE_URL}/blog`,
      siteName: "Gustavo Widman",
      images: [
        {
          url: `/og/blog-index-${lang}.png`,
          width: 1200,
          height: 630,
          alt: "Gustavo Widman Blog",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Blog | Gustavo Widman",
      description:
        "A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research.",
      images: [`/og/blog-index-${lang}.png`],
      creator: "@guswid",
    },
  };
}

const blogBreadcrumbItems = [
  { name: "Home", url: SITE_URL },
  { name: "Blog", url: `${SITE_URL}/blog` },
];

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const urlLang = await getLanguageFromParam(params.lang || null);
  const serverLang = urlLang || (await detectLanguage());

  // Check if we should serve markdown (AI agent or explicit request)
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  const acceptHeader = headersList.get("accept");

  if (shouldServeMarkdown(userAgent, params.format, params.raw, acceptHeader)) {
    redirect("/llms.mdx/blog");
  }

  const posts = getBlogPostSummaries();

  return (
    <>
      <BlogBreadcrumbJsonLd items={blogBreadcrumbItems} />
      <BlogJsonLd />
      <BlogListingClient posts={posts} serverLang={serverLang} />
    </>
  );
}
