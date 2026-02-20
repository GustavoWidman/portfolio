import Script from "next/script";

interface JsonLdProps {
  data: object;
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonStr = JSON.stringify(data);
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{ __html: jsonStr }}
    />
  );
}

const SITE_URL = "https://guswid.com";

export const personSchema = {
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
};

export const websiteSchema = {
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
};

export function blogPostingSchema(options: {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  tags: string[];
  image?: string;
}) {
  const { title, excerpt, date, slug, tags, image } = options;

  return {
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
      "@id": `${SITE_URL}/blog/${slug}`,
    },
    url: `${SITE_URL}/blog/${slug}`,
    image: image || `${SITE_URL}/og/${slug}-en.png`,
    keywords: tags.join(", "),
    inLanguage: ["en", "pt"],
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
