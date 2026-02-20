import { BreadcrumbJsonLd, JsonLdScript } from "next-seo";

const SITE_URL = "https://guswid.com";

export function PersonJsonLd() {
  return (
    <JsonLdScript
      scriptKey="person"
      id={`${SITE_URL}/#person`}
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Gustavo Widman",
        alternateName: ["guswid", "r3dlust"],
        url: SITE_URL,
        image: `${SITE_URL}/og/portfolio-en.png`,
        jobTitle: "Backend Engineer",
        description:
          "Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity.",
        sameAs: ["https://github.com/GustavoWidman", "https://www.linkedin.com/in/gustavo-widman"],
        knowsAbout: [
          "Systems Programming",
          "Rust",
          "Python",
          "Go",
          "NixOS",
          "Cybersecurity",
          "Reverse Engineering",
          "Backend Development",
        ],
      }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLdScript
      scriptKey="website"
      id={`${SITE_URL}/#website`}
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Gustavo Widman",
        alternateName: ["guswid blog", "r3dlust portfolio"],
        url: SITE_URL,
        description:
          "Personal portfolio and blog of Gustavo Widman - Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity.",
        author: {
          "@type": "Person",
          name: "Gustavo Widman",
        },
        publisher: {
          "@type": "Person",
          name: "Gustavo Widman",
        },
        inLanguage: ["en", "pt"],
      }}
    />
  );
}

interface BlogPostingJsonLdProps {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  tags: string[];
  image?: string;
}

export function BlogPostingJsonLd({
  title,
  excerpt,
  date,
  slug,
  tags,
  image,
}: BlogPostingJsonLdProps) {
  const url = `${SITE_URL}/blog/${slug}`;
  const imageUrl = image || `${SITE_URL}/og/${slug}-en.png`;

  return (
    <JsonLdScript
      scriptKey={`blog-posting-${slug}`}
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: excerpt,
        datePublished: date,
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
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
        url,
        image: imageUrl,
        keywords: tags.join(", "),
        inLanguage: ["en", "pt"],
      }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BlogBreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  return (
    <BreadcrumbJsonLd
      scriptKey="breadcrumb"
      items={items.map((item) => ({
        name: item.name,
        item: item.url,
      }))}
    />
  );
}

export function BlogJsonLd() {
  return (
    <JsonLdScript
      scriptKey="blog"
      id={`${SITE_URL}/blog#blog`}
      data={{
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
      }}
    />
  );
}
