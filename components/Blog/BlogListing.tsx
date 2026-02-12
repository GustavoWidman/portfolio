import Fuse from "fuse.js";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPosts, Language } from "../../utils/markdown";
import { SearchDialog } from "./SearchDialog";

interface BlogListingProps {
  lang: Language;
  isSubdomain?: boolean;
}

const BlogListing: React.FC<BlogListingProps> = ({ lang, isSubdomain }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const allPosts = getAllPosts().filter((post) => post.lang === lang);

  // We only display posts here, actual search logic is delegated to SearchDialog
  // or filtered via query if needed, but since we are moving to a modal UI,
  // the listing page just shows all posts (or filtered by category if we add that later).
  // For now, listing shows all posts.
  const posts = allPosts;

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-4xl mx-auto">
      <div className="mb-16">
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 mb-6 tracking-tight pb-4 leading-tight">
          {lang === "en" ? "Engineering & Thoughts" : "Engenharia & Pensamentos"}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-10">
          {lang === "en" 
            ? "A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research."
            : "Uma coleção de artigos sobre programação de sistemas, infraestrutura NixOS e pesquisa em segurança cibernética."
          }
        </p>
        
        {/* Search Trigger Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="relative w-full max-w-md group flex items-center"
        >
          <div className="absolute left-3 text-zinc-400 group-hover:text-emerald-500 transition-colors z-10">
            <Search size={18} />
          </div>
          <div className="w-full pl-10 pr-20 py-2.5 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-left text-sm text-zinc-500 dark:text-zinc-500 shadow-sm backdrop-blur-sm group-hover:border-emerald-500/50 group-hover:ring-2 group-hover:ring-emerald-500/10 transition-all">
            {lang === "en" ? "Search articles..." : "Buscar artigos..."}
          </div>
          <div className="absolute right-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <kbd className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 font-sans shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              ⌘
            </kbd>
            <kbd className="flex h-5 w-5 items-center justify-center rounded-[4px] border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 font-sans shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              K
            </kbd>
          </div>
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={isSubdomain ? `/${post.slug}` : `/blog/${post.slug}`}
            className="group flex flex-col p-6 bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg dark:hover:shadow-emerald-900/10"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {new Date(post.date).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold mb-3 group-hover:text-emerald-500 transition-colors dark:text-white text-zinc-900">
              {post.title}
            </h2>
            
            <p className="text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 text-sm flex-grow">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
              {post.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 text-[10px] uppercase tracking-wider font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
      
      <SearchDialog 
        open={isSearchOpen} 
        setOpen={setIsSearchOpen} 
        lang={lang} 
      />
    </div>
  );
};

export default BlogListing;
