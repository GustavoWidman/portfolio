import { Suspense } from "react";
import type { Metadata } from "next";
import { getBlogPostSummaries } from "@/lib/source";
import BlogListingClient from "@/components/blog/BlogListingClient";
import { JsonLd, breadcrumbSchema } from "@/components/shared/JsonLd";

const SITE_URL = "https://guswid.com";

export const metadata: Metadata = {
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
        url: "/og/blog-index-en.png",
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
    images: ["/og/blog-index-en.png"],
    creator: "@guswid",
  },
};

const blogBreadcrumbData = breadcrumbSchema([
  { name: "Home", url: SITE_URL },
  { name: "Blog", url: `${SITE_URL}/blog` },
]);

const blogCollectionSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Gustavo Widman's Blog",
  description:
    "Technical articles on systems programming, NixOS infrastructure, and cybersecurity research.",
  url: `${SITE_URL}/blog`,
  author: {
    "@type": "Person",
    name: "Gustavo Widman",
    url: SITE_URL,
  },
  publisher: {
    "@type": "Person",
    name: "Gustavo Widman",
    url: SITE_URL,
  },
  inLanguage: ["en", "pt"],
};

export default function BlogPage() {
  const posts = getBlogPostSummaries();

  return (
    <Suspense>
      <JsonLd data={blogBreadcrumbData} />
      <JsonLd data={blogCollectionSchema} />
      <BlogListingClient posts={posts} />
    </Suspense>
  );
}
