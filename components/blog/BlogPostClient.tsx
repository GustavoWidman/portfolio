"use client";

import { ArrowLeft, Calendar, Clock, Tag as TagIcon } from "lucide-react";
import PrefetchLink from "@/components/PrefetchLink";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { normalizeToTimezoneMidnight } from "@/lib/helpers";
import { BlogTOC } from "./BlogTOC";
import type { BlogPost } from "@/lib/source";
import { useLanguage } from "@/lib/useLanguage";

type BlogPostMetadata = Omit<BlogPost, "content">;

interface BlogPostClientProps {
  enPost?: BlogPostMetadata;
  ptPost?: BlogPostMetadata;
  enContent?: ReactNode;
  ptContent?: ReactNode;
  serverLang?: "en" | "pt";
}

export default function BlogPostClient({
  enPost,
  ptPost,
  enContent,
  ptContent,
  serverLang = "en",
}: BlogPostClientProps) {
  const { lang } = useLanguage(serverLang);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const sidebarSpacerRef = useRef<HTMLDivElement>(null);
  const [sidebarStyle, setSidebarStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const post = lang === "en" ? enPost || ptPost : ptPost || enPost;
  const content = lang === "en" ? enContent || ptContent : ptContent || enContent;

  const updateSidebarPosition = useCallback(() => {
    if (sidebarSpacerRef.current) {
      const rect = sidebarSpacerRef.current.getBoundingClientRect();
      setSidebarStyle({ left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSubdomain(window.location.hostname.startsWith("blog."));
    }
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateSidebarPosition);
    updateSidebarPosition();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateSidebarPosition);
    };
  }, [updateSidebarPosition]);

  if (!post || !content) {
    notFound();
  }

  const readingTime = 5;
  const blogHref = isSubdomain ? "/" : "/blog";

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-6xl mx-auto">
      {/* Back to blog (mobile only — desktop version is in the sticky sidebar) */}
      <PrefetchLink
        href={blogHref}
        className="blog-post-mobile-back-link blog-post-mobile-toc group inline-flex items-center text-sm text-zinc-500 hover:text-emerald-500 mb-8 transition-colors"
      >
        <ArrowLeft
          size={16}
          className="mr-2 transition-all group-hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.6)] group-hover:-translate-x-0.5"
        />
        {lang === "en" ? "Back to blog" : "Voltar ao blog"}
      </PrefetchLink>
      <div className="blog-post-mobile-toc mb-8">
        <BlogTOC toc={post.toc} lang={lang} variant="mobile" />
      </div>

      <div className="blog-post-grid">
        {/* Spacer to reserve grid column width for the fixed sidebar */}
        <div ref={sidebarSpacerRef} className="blog-post-sidebar" aria-hidden />

        {/* Fixed Sidebar TOC (Desktop) */}
        {sidebarStyle.width > 0 && (
          <aside
            className="blog-post-sidebar-fixed"
            style={{ left: sidebarStyle.left, width: sidebarStyle.width }}
          >
            <PrefetchLink
              href={blogHref}
              className="group inline-flex items-center text-sm text-zinc-500 hover:text-emerald-500 mb-6 transition-colors shrink-0"
            >
              <ArrowLeft
                size={16}
                className="mr-2 transition-all group-hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.6)] group-hover:-translate-x-0.5"
              />
              {lang === "en" ? "Back to blog" : "Voltar ao blog"}
            </PrefetchLink>
            <BlogTOC toc={post.toc} lang={lang} variant="desktop" />

            {/* Quick Actions */}
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className={`text-sm text-zinc-500 hover:text-emerald-500 transition-all duration-300 flex items-center gap-2 group pl-4 ${
                  showScrollTop ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <ArrowLeft
                  size={14}
                  className="rotate-90 group-hover:-translate-y-1 transition-transform"
                />
                {lang === "en" ? "Scroll to top" : "Voltar ao topo"}
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <article className="min-w-0">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-zinc-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-zinc-500 dark:text-zinc-400 text-sm font-mono border-b border-zinc-200 dark:border-zinc-800 pb-8">
              <span className="flex items-center">
                <Calendar size={14} className="mr-2" />
                {normalizeToTimezoneMidnight(post.date).toLocaleDateString(
                  lang === "en" ? "en-US" : "pt-BR",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </span>
              <span className="flex items-center">
                <Clock size={14} className="mr-2" />
                {readingTime} min read
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-medium uppercase">
                {lang}
              </span>

              {post.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <TagIcon size={14} />
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="hover:text-emerald-500 transition-colors">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:text-zinc-900 dark:prose-headings:text-white prose-a:text-emerald-500 hover:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline">
            {content}
          </div>
        </article>
      </div>
    </div>
  );
}
