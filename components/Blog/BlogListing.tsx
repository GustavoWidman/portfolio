import Fuse from "fuse.js";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllPosts, Language } from "../../utils/markdown";

interface BlogListingProps {
  lang: Language;
  isSubdomain?: boolean;
}

const BlogListing: React.FC<BlogListingProps> = ({ lang, isSubdomain }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const allPosts = getAllPosts().filter((post) => post.lang === lang);

  const fuse = useMemo(() => {
    return new Fuse(allPosts, {
      keys: ["title", "excerpt", "tags"],
      threshold: 0.3,
    });
  }, [allPosts]);

  const posts = useMemo(() => {
    if (!searchQuery) return allPosts;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, allPosts, fuse]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <h1 className="text-4xl font-bold dark:text-white text-zinc-900">
          {lang === "en" ? "Blog" : "Blog"}
        </h1>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder={lang === "en" ? "Search posts..." : "Buscar posts..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>
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
      
      {posts.length === 0 && (
        <div className="text-center py-24">
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            {lang === "en" ? "No posts found matching your criteria." : "Nenhum post encontrado com seus critérios."}
          </p>
          {searchQuery && (
             <button 
               onClick={() => setSearchQuery("")}
               className="mt-4 text-emerald-500 hover:underline text-sm"
             >
               {lang === "en" ? "Clear search" : "Limpar busca"}
             </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogListing;
