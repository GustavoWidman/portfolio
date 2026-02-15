"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { normalizeToTimezoneMidnight } from "@/lib/helpers";
import type { BlogPostSummary } from "../../lib/source";
import { useLanguage } from "../../lib/useLanguage";
import { SearchTrigger } from "./SearchTrigger";
import ScheduledPostCard from "./ScheduledPostCard";

import type { Language } from "../../lib/types";

interface BlogListingClientProps {
  posts: BlogPostSummary[];
  initialLang?: Language;
}

export default function BlogListingClient({ posts, initialLang = "en" }: BlogListingClientProps) {
  const { lang } = useLanguage(initialLang);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const filtered = posts.filter((post) => post.lang === lang);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSubdomain(window.location.hostname.startsWith("blog."));
    }
  }, []);

  const getPostHref = (slug: string) => (isSubdomain ? `/${slug}` : `/blog/${slug}`);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 mb-6 tracking-tight pb-4 leading-tight">
          {lang === "en" ? "Engineering & Thoughts" : "Engenharia & Pensamentos"}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-6">
          {lang === "en"
            ? "A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research."
            : "Uma coleção de artigos sobre programação de sistemas, infraestrutura NixOS e pesquisa em segurança cibernética."}
        </p>

        <div className="md:hidden">
          <SearchTrigger placeholder={lang === "en" ? "Search articles..." : "Buscar artigos..."} />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {filtered.map((post) => {
          if (post.scheduled) {
            return (
              <ScheduledPostCard
                key={`${post.slug}-${post.lang}`}
                title={post.title}
                date={post.date}
                tags={post.tags}
                lang={lang}
              />
            );
          }

          return (
            <Link
              key={`${post.slug}-${post.lang}`}
              href={getPostHref(post.slug)}
              className="group flex flex-col p-6 bg-white dark:bg-black/70 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg dark:hover:shadow-emerald-900/10"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  {normalizeToTimezoneMidnight(post.date).toLocaleDateString(
                    lang === "en" ? "en-US" : "pt-BR",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-3 group-hover:text-emerald-500 transition-colors dark:text-white text-zinc-900">
                {post.title}
              </h2>

              <p className="text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 text-sm flex-grow">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap gap-2 mt-auto">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-[10px] uppercase tracking-wider font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
