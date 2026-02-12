import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ArrowLeft, Calendar, Tag as TagIcon, Clock, X } from "lucide-react";
import { getPost, Post, Language } from "../../utils/markdown";
import clsx from "clsx";
import GithubSlugger from "github-slugger";
import { Helmet } from "react-helmet-async";

interface BlogPostProps {
  lang: Language;
}

const BlogPost: React.FC<BlogPostProps> = ({ lang: initialLang }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt?: string } | null>(null);

  // Determine current language from URL query parameter or props
  const [lang, setLang] = useState<Language>(initialLang);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (langParam === "pt" || langParam === "en") {
      setLang(langParam);
    } else {
      setLang(initialLang);
    }
  }, [initialLang, window.location.search]);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;
      setLoading(true);
      const data = await getPost(slug, lang);
      if (data) {
        setPost(data);
      } else {
        setPost(null);
      }
      setLoading(false);
    };
    loadPost();
  }, [slug, lang]);

  // Generate Table of Contents from markdown content
  const toc = useMemo(() => {
    if (!post?.content) return [];
    
    // Regex to match headers: # Header, ## Header, etc.
    const regex = /^(#{1,3})\s+(.+)$/gm;
    const headings = [];
    let match;
    const slugger = new GithubSlugger();
    
    while ((match = regex.exec(post.content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = slugger.slug(text);
      
      headings.push({ id, text, level });
    }
    
    return headings;
  }, [post?.content]);

  // Setup Intersection Observer for TOC highlighting
  useEffect(() => {
    if (loading || !post) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -80% 0%" }
    );

    const headings = document.querySelectorAll("h1, h2, h3");
    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [loading, post]);

  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">Post not found</h1>
        <Link to="/blog" className="text-emerald-500 hover:underline">
          Return to blog
        </Link>
      </div>
    );
  }

  // Calculate reading time
  const wordsPerMinute = 200;
  const wordCount = post.content.split(/\s+/g).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);

  return (
    <>
      <Helmet>
        <title>{post.title} | Gustavo Widman</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={`/og/${post.slug}-${post.lang}.png`} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta name="twitter:image" content={`/og/${post.slug}-${post.lang}.png`} />
      </Helmet>

      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in cursor-zoom-out p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img 
              src={lightboxImage.src} 
              alt={lightboxImage.alt || "Lightbox image"} 
              className="w-full h-full object-contain rounded-lg shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself? Spec says "allow closing by clicking anywhere outside of the image but also on the x"
              // Re-reading spec: "allow closing by clicking anywhere outside of the image but also on the x"
              // Usually clicking the image doesn't close it, but if it's convenient... 
              // Standard behavior: clicking image does nothing or zooms more. 
              // Clicking background closes.
              // I will keep stopPropagation on image to prevent accidental close.
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen pt-24 pb-12 px-6 max-w-6xl mx-auto">
      <Link
        to="/blog"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-emerald-500 mb-8 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        {lang === "en" ? "Back to blog" : "Voltar ao blog"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-32">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white mb-4 pl-4 border-l-2 border-transparent">
              {lang === "en" ? "On this page" : "Nesta página"}
            </h3>
            <nav className="flex flex-col space-y-1">
              {toc.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={clsx(
                    "block py-1 text-sm transition-all duration-200 border-l-2 pl-4 -ml-[2px]",
                    activeId === heading.id
                      ? "border-emerald-500 text-emerald-500 font-medium bg-emerald-500/5 dark:bg-emerald-500/10"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                  style={{
                    paddingLeft: heading.level === 3 ? "2rem" : undefined,
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                    setActiveId(heading.id);
                  }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
            
            {/* Quick Actions */}
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
               <button 
                 onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                 className="text-sm text-zinc-500 hover:text-emerald-500 transition-colors flex items-center gap-2 group pl-4"
               >
                 <ArrowLeft size={14} className="rotate-90 group-hover:-translate-y-1 transition-transform" />
                 {lang === "en" ? "Scroll to top" : "Voltar ao topo"}
               </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <article className="lg:col-span-3">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-zinc-900 dark:text-white leading-tight">
              {post.title}
            </h1>
            
            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-zinc-500 dark:text-zinc-400 text-sm font-mono border-b border-zinc-200 dark:border-zinc-800 pb-8">
              <span className="flex items-center">
                <Calendar size={14} className="mr-2" />
                {new Date(post.date).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center">
                <Clock size={14} className="mr-2" />
                {readingTime} min read
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-medium uppercase">
                {post.lang}
              </span>
              
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <TagIcon size={14} />
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="hover:text-emerald-500 transition-colors">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>

          <div className={clsx(
            "prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-24",
            "prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-zinc-700 dark:prose-pre:border-zinc-800",
            // Clean up default typography issues
            "prose-a:no-underline hover:prose-a:underline", // Remove link underlines generally, add on hover
            "prose-code:before:content-none prose-code:after:content-none" // Remove backticks from inline code
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeSlug,
                [rehypeAutolinkHeadings, { behavior: "wrap" }]
              ]}
              components={{
                // Image renderer
                img: ({ node, src, alt, ...props }: any) => {
                  let finalSrc = src;
                  // If image is relative, look it up in our images map
                  if (src && (src.startsWith("./") || src.startsWith("imgs/") || !src.startsWith("http"))) {
                    // Normalize key to check both with and without ./ prefix
                    const key = src.startsWith("./") ? src : `./${src}`;
                    if (post.images && post.images[key]) {
                      finalSrc = post.images[key];
                    }
                  }
                  
                  return (
                    <figure className="my-8">
                      <img 
                        src={finalSrc} 
                        alt={alt} 
                        className="rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 mx-auto w-full cursor-zoom-in hover:brightness-110 transition-all"
                        onClick={() => setLightboxImage({ src: finalSrc, alt })}
                        {...props} 
                      />
                      {alt && <figcaption className="text-center text-sm text-zinc-500 mt-2">{alt}</figcaption>}
                    </figure>
                  );
                },
                // Blockquote renderer (optional enhancement)
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-emerald-500 bg-zinc-50 dark:bg-zinc-900/50 pl-4 py-2 italic rounded-r text-zinc-700 dark:text-zinc-300 not-italic">
                    {children}
                  </blockquote>
                ),
                pre: React.Fragment,
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <div className="relative group not-prose my-6 rounded-lg overflow-hidden border border-zinc-700 bg-[#1e1e1e]">
                      <div className="absolute right-4 top-3 text-xs font-mono text-zinc-400 select-none z-10 px-2 py-1 bg-zinc-800/50 rounded backdrop-blur-sm border border-zinc-700/50">
                        {match[1]}
                      </div>
                      <SyntaxHighlighter
                        // @ts-ignore
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        codeTagProps={{
                          style: {
                            backgroundColor: "transparent",
                            textShadow: "none", 
                          }
                        }}
                        showLineNumbers={true}
                        wrapLines={true}
                        customStyle={{
                          margin: 0,
                          padding: "1.5rem",
                          backgroundColor: "transparent",
                          fontSize: "0.875rem",
                          lineHeight: "1.6",
                        }}
                        lineNumberStyle={{
                          minWidth: "2.5em",
                          paddingRight: "1em",
                          color: "#52525b", // zinc-600
                          textAlign: "right",
                          userSelect: "none",
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code 
                      className={clsx(
                        "bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50", // background and border
                        "rounded px-1.5 py-0.5", // sizing
                        "text-sm font-mono font-medium", // typography
                        "text-emerald-600 dark:text-emerald-400", // color
                        className
                      )} 
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* Sidebar TOC was here, but moved above */}
      </div>
      </div>
    </>
  );
};

export default BlogPost;
