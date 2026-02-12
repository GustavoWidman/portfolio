import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ArrowLeft, Calendar, Tag as TagIcon, Clock, X, ChevronRight } from "lucide-react";
import { getPost, Post, Language } from "../../utils/markdown";
import clsx from "clsx";
import GithubSlugger from "github-slugger";
import { Helmet } from "react-helmet-async";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface BlogPostProps {
  lang: Language;
  isSubdomain?: boolean;
}

const BlogPost: React.FC<BlogPostProps> = ({ lang: initialLang, isSubdomain }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt?: string } | null>(null);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const isManualScrolling = useRef(false);

  // Determine current language from URL query parameter or props
  const [lang, setLang] = useState<Language>(initialLang);

  const { lang: paramLang } = useParams<{ lang?: string }>();

  useEffect(() => {
    // 1. Check Route Parameter first (/slug/pt)
    if (paramLang === "pt" || paramLang === "en") {
      setLang(paramLang as Language);
      return;
    }

    // 2. Fallback to URL Query Parameter (?lang=pt)
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (langParam === "pt" || langParam === "en") {
      setLang(langParam);
    } else {
      // 3. Fallback to Props (which defaults to localStorage or system)
      setLang(initialLang);
    }
  }, [initialLang, paramLang, window.location.search]);

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
        if (isManualScrolling.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -80% 0%" },
    );

    const headings = document.querySelectorAll("h1, h2, h3");
    headings.forEach((heading) => observer.observe(heading));

    // Handle detecting the bottom of the page to activate the last item
    const handleScroll = () => {
      if (isManualScrolling.current) return;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 10 // small threshold
      ) {
        if (headings.length > 0) {
          setActiveId(headings[headings.length - 1].id);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in cursor-zoom-out p-0 md:p-4 touch-none"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit={true}
              wheel={{ step: 0.2 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button
                      onClick={() => setLightboxImage(null)}
                      className="p-3 rounded-full bg-zinc-800/80 text-white hover:bg-zinc-700 transition-colors border border-white/10 backdrop-blur-sm"
                      aria-label="Close"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <TransformComponent
                    wrapperClass="!w-full !h-full flex items-center justify-center"
                    contentClass="!w-full !h-full flex items-center justify-center"
                  >
                    <img
                      src={lightboxImage.src}
                      alt={lightboxImage.alt || "Lightbox image"}
                      className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}

      <div className="min-h-screen pt-24 pb-12 px-6 max-w-6xl mx-auto">
        <Link
          to={isSubdomain ? "/" : "/blog"}
          className="inline-flex items-center text-sm text-zinc-500 hover:text-emerald-500 mb-8 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          {lang === "en" ? "Back to blog" : "Voltar ao blog"}
        </Link>

        {/* Mobile TOC Accordion */}
        <div className="lg:hidden mb-8 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50 overflow-hidden">
          <button
            onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
            className="w-full flex items-center justify-between p-4 text-left font-medium text-zinc-900 dark:text-white"
          >
            <span className="uppercase tracking-wider text-sm font-bold">
              {lang === "en" ? "Table of Contents" : "Índice"}
            </span>
            <ChevronRight
              size={16}
              className={clsx(
                "transition-transform duration-200 text-zinc-500",
                isMobileTocOpen && "rotate-90",
              )}
            />
          </button>
          <div
            className={clsx(
              "border-t border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out overflow-hidden",
              isMobileTocOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
            )}
          >
            <nav className="flex flex-col p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900/30 overflow-y-auto max-h-96">
              {toc.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={clsx(
                    "block text-sm transition-colors border-l-2 pl-3 -ml-[1px]",
                    activeId === heading.id
                      ? "border-emerald-500 text-emerald-500 font-medium"
                      : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                  )}
                  style={{
                    marginLeft: heading.level === 3 ? "1rem" : "0",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    // 1. Close menu first to stabilize layout
                    setIsMobileTocOpen(false);

                    // 2. Set manual scrolling flag
                    isManualScrolling.current = true;
                    setActiveId(heading.id); // Immediate update

                    // 3. Wait for layout update/render then scroll
                    setTimeout(() => {
                      const element = document.getElementById(heading.id);
                      if (element) {
                        const offset = 380; // Mobile offset (matches original sweet spot)
                        const bodyRect = document.body.getBoundingClientRect().top;
                        const elementRect = element.getBoundingClientRect().top;
                        const elementPosition = elementRect - bodyRect;
                        const offsetPosition = elementPosition - offset;

                        window.scrollTo({
                          top: offsetPosition,
                          behavior: "smooth",
                        });
                      }

                      // 4. Release lock after animation
                      setTimeout(() => {
                        isManualScrolling.current = false;
                      }, 1500); // Increased from 1000ms to 1500ms
                    }, 10);
                  }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        </div>

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
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700",
                    )}
                    style={{
                      paddingLeft: heading.level === 3 ? "2rem" : undefined,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      isManualScrolling.current = true;
                      setActiveId(heading.id);

                      const element = document.getElementById(heading.id);
                      if (element) {
                        const offset = 100;
                        const bodyRect = document.body.getBoundingClientRect().top;
                        const elementRect = element.getBoundingClientRect().top;
                        const elementPosition = elementRect - bodyRect;
                        const offsetPosition = elementPosition - offset;

                        window.scrollTo({
                          top: offsetPosition,
                          behavior: "smooth",
                        });
                      }
                      setTimeout(() => {
                        isManualScrolling.current = false;
                      }, 1500); // Increased from 1000ms to 1500ms
                    }}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>

              {/* Quick Actions */}
              <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="text-sm text-zinc-500 hover:text-emerald-500 transition-colors flex items-center gap-2 group pl-4"
                >
                  <ArrowLeft
                    size={14}
                    className="rotate-90 group-hover:-translate-y-1 transition-transform"
                  />
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

            <div
              className={clsx(
                "prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-24",
                "prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-zinc-700 dark:prose-pre:border-zinc-800",
                // Clean up default typography issues
                "prose-a:no-underline hover:prose-a:underline", // Remove link underlines generally, add on hover
                "prose-code:before:content-none prose-code:after:content-none", // Remove backticks from inline code
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
                components={{
                  // Image renderer
                  img: ({ node, src, alt, ...props }: any) => {
                    let finalSrc = src;
                    // If image is relative, look it up in our images map
                    if (
                      src &&
                      (src.startsWith("./") || src.startsWith("imgs/") || !src.startsWith("http"))
                    ) {
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
                        {alt && (
                          <figcaption className="text-center text-sm text-zinc-500 mt-2">
                            {alt}
                          </figcaption>
                        )}
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
                            },
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
                          "break-all whitespace-pre-wrap", // Fix mobile scrolling for long inline code
                          className,
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
