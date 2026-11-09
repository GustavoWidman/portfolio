import { t } from "../i18n";
import { EXPERIENCE } from "../data/experience";
import { PROFILE } from "../data/profile";
import { pick } from "../data/types";
import { OG_HEIGHT, OG_WIDTH } from "../og/template";
import { AUTHOR, SITE_URL, htmlLang } from "./config";
import { blogMarkdownHref, canonical, ogImageFile } from "./urls";
import type { Language } from "./config";
import type { Post } from "./posts";

/** A JSON-LD object, serialized as-is into `<script type="application/ld+json">`. */
export type JsonLd = Record<string, unknown>;

/**
 * Everything `src/components/Head.astro` emits besides the static tags. Pages build one
 * of these with the helpers below.
 */
export interface PageMeta {
  /** Full document title. */
  title: string;
  description: string;
  /** Absent on pages that must not be indexed (404). */
  canonical?: string;
  ogType: "website" | "article";
  /** Open Graph image: absolute URL of `/og/<file>` and its alt text. */
  ogImage: { url: string; alt: string };
  /** `<link rel="alternate" type="text/markdown">` target, if the page has a markdown twin. */
  markdownHref?: string;
  article?: { publishedTime: string; tags: string[] };
  jsonLd: JsonLd[];
  noindex?: boolean;
}

/** Size of every Open Graph image (rendered by `src/og/template.ts`). */
export const OG_IMAGE_SIZE = { width: OG_WIDTH, height: OG_HEIGHT } as const;

const SCHEMA = "https://schema.org";
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const BLOG_ID = `${canonical.blog()}#blog`;

/** The author as referenced from other entities. */
const personRef = (): JsonLd => ({
  "@type": "Person",
  "@id": PERSON_ID,
  name: AUTHOR.name,
  url: SITE_URL,
});

function person(lang: Language): JsonLd {
  const current = EXPERIENCE.find((item) => item.end === undefined);
  return {
    "@context": SCHEMA,
    ...personRef(),
    alternateName: [...AUTHOR.aliases],
    description: t(lang).site.description,
    jobTitle: current ? pick(current.role, lang) : pick(PROFILE.shortRole, lang),
    ...(current ? { worksFor: { "@type": "Organization", name: current.company } } : {}),
    sameAs: [AUTHOR.github, AUTHOR.linkedin],
  };
}

function ogImage(page: string, lang: Language, alt: string): PageMeta["ogImage"] {
  return { url: canonical.ogImage(ogImageFile(page, lang)), alt };
}

const breadcrumbs = (items: { name: string; url: string }[]): JsonLd => ({
  "@context": SCHEMA,
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export function homeMeta(lang: Language): PageMeta {
  const dict = t(lang);
  const title = `${PROFILE.name} · ${pick(PROFILE.shortRole, lang)}`;
  return {
    title,
    description: dict.site.description,
    canonical: canonical.home(),
    ogType: "website",
    ogImage: ogImage("portfolio", lang, title),
    jsonLd: [
      person(lang),
      {
        "@context": SCHEMA,
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: PROFILE.name,
        description: dict.site.description,
        url: SITE_URL,
        inLanguage: ["en", "pt-BR"],
        author: personRef(),
        publisher: personRef(),
      },
    ],
  };
}

/** Blog index; `posts` are the released posts listed on the page. */
export function blogMeta(lang: Language, posts: Post[]): PageMeta {
  const dict = t(lang);
  const title = `${dict.blog.title} · ${PROFILE.name}`;
  return {
    title,
    description: dict.blog.description,
    canonical: canonical.blog(),
    ogType: "website",
    ogImage: ogImage("blog-index", lang, title),
    markdownHref: blogMarkdownHref(),
    jsonLd: [
      {
        "@context": SCHEMA,
        "@type": "Blog",
        "@id": BLOG_ID,
        name: title,
        description: dict.blog.description,
        url: canonical.blog(),
        inLanguage: htmlLang(lang),
        author: personRef(),
        publisher: personRef(),
        blogPost: posts.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          url: canonical.post(post.slug),
          datePublished: post.published.toISOString(),
        })),
      },
      breadcrumbs([
        { name: dict.nav.home, url: canonical.home() },
        { name: dict.blog.title, url: canonical.blog() },
      ]),
    ],
  };
}

export function postMeta(post: Post, markdownHref: string): PageMeta {
  const dict = t(post.lang);
  const url = canonical.post(post.slug);
  const image = ogImage(post.slug, post.lang, post.title);
  return {
    title: `${post.title} · ${PROFILE.name}`,
    description: post.excerpt,
    canonical: url,
    ogType: "article",
    ogImage: image,
    markdownHref,
    article: { publishedTime: post.published.toISOString(), tags: post.tags },
    jsonLd: [
      {
        "@context": SCHEMA,
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.published.toISOString(),
        inLanguage: htmlLang(post.lang),
        keywords: post.tags,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        image: { "@type": "ImageObject", url: image.url, ...OG_IMAGE_SIZE },
        author: personRef(),
        publisher: personRef(),
        isPartOf: { "@type": "Blog", "@id": BLOG_ID, url: canonical.blog() },
      },
      breadcrumbs([
        { name: dict.nav.home, url: canonical.home() },
        { name: dict.blog.title, url: canonical.blog() },
        { name: post.title, url },
      ]),
    ],
  };
}

export function notFoundMeta(lang: Language): PageMeta {
  const dict = t(lang);
  const title = `${dict.notFound.title} · ${PROFILE.name}`;
  return {
    title,
    description: dict.notFound.message,
    ogType: "website",
    ogImage: ogImage("portfolio", lang, PROFILE.name),
    jsonLd: [],
    noindex: true,
  };
}

/**
 * JSON-LD serialized for an inline `<script>`: `<` is escaped so no string value can
 * close the element or open a comment.
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
