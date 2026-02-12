import { Command } from "cmdk";
import { Search, FileText, X } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { getAllPosts, PostMetadata } from "../../utils/markdown";

interface SearchDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  lang: "en" | "pt";
}

// Highlight helper component
const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="text-emerald-500 font-bold bg-emerald-500/10 rounded px-0.5">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
};

export const SearchDialog: React.FC<SearchDialogProps> = ({ open, setOpen, lang }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(false);
  
  const posts = useMemo(() => getAllPosts().filter((p) => p.lang === lang), [lang]);
  
  const fuse = useMemo(() => {
    return new Fuse(posts, {
      keys: ["title", "excerpt", "tags"],
      threshold: 0.3,
      includeMatches: true,
    });
  }, [posts]);

  const results = useMemo(() => {
    if (!search) return posts.slice(0, 5); 
    return fuse.search(search).map((r) => r.item);
  }, [search, posts, fuse]);

  // Handle visibility state for exit animations
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) {
      setVisible(true);
      // Small delay to allow mount then trigger animation
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
      const timer = setTimeout(() => setVisible(false), 200); // Wait for animation
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle ESC key manually since we replaced Command.Dialog
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // If not visible (and animation finished), unmount
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 pointer-events-auto ${mounted ? 'opacity-100' : 'opacity-0'}`} 
        aria-hidden="true" 
        onClick={() => setOpen(false)} 
      />
      
      {/* Dialog Wrapper */}
      <div className={`pointer-events-auto relative w-full max-w-2xl transition-all duration-200 ease-out origin-top ${mounted ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'}`}>
        <Command 
          label="Global Search"
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-4">
            <Search className="w-5 h-5 text-zinc-500 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={lang === "en" ? "Search articles..." : "Buscar artigos..."}
              className="w-full h-14 bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 text-base"
              autoFocus // Ensure input is focused when rendered
            />
            <button 
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-1.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 font-sans">
                ESC
              </kbd>
            </button>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2">
            <Command.Empty className="py-6 text-center text-sm text-zinc-500">
              {lang === "en" ? "No results found." : "Nenhum resultado encontrado."}
            </Command.Empty>

            {results.map((post) => (
              <Command.Item
                key={post.slug}
                value={post.title}
                onSelect={() => {
                  setOpen(false);
                  const isSubdomain = window.location.hostname.startsWith("blog.");
                  const path = isSubdomain ? `/${post.slug}` : `/blog/${post.slug}`;
                  navigate(path);
                }}
                className="group flex items-center gap-4 p-3 rounded-lg cursor-pointer aria-selected:bg-zinc-100 dark:aria-selected:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-aria-selected:text-emerald-500 group-aria-selected:bg-emerald-500/10 transition-colors">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    <HighlightedText text={post.title} highlight={search} />
                  </span>
                  <span className="text-xs text-zinc-500 truncate">
                    <HighlightedText text={post.excerpt} highlight={search} />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {post.tags.slice(0, 1).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500 uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </Command.Item>
            ))}
          </Command.List>
          
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
             <span className="text-[10px] text-zinc-400">
               {results.length} {lang === "en" ? "posts found" : "posts encontrados"}
             </span>
             <div className="flex gap-2">
               <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                 <kbd className="font-sans border border-zinc-300 dark:border-zinc-700 rounded px-1">↑</kbd>
                 <kbd className="font-sans border border-zinc-300 dark:border-zinc-700 rounded px-1">↓</kbd>
                 to navigate
               </span>
               <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                 <kbd className="font-sans border border-zinc-300 dark:border-zinc-700 rounded px-1">↵</kbd>
                 to select
               </span>
             </div>
          </div>
        </Command>
      </div>
    </div>
  );
};
