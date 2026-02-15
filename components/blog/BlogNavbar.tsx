"use client";

import { FileText, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { DATA } from "@/lib/data/content";
import type { Language } from "@/lib/types";
import { ResumeButton } from "@/components/portfolio";
import { SearchTrigger } from "@/components/blog/SearchTrigger";

interface BlogNavbarProps {
  lang: Language;
  setLang: (lang: Language) => void;
  isSubdomain?: boolean;
}

const BlogNavbar: React.FC<BlogNavbarProps> = ({ lang, setLang, isSubdomain = false }) => {
  const t = DATA[lang];
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
  }, [isMenuOpen]);

  const navbarClass = useMemo(
    () =>
      "fixed top-0 w-full z-40 transition-all duration-300 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5",
    [],
  );

  const getMainDomainUrl = (hash: string) => {
    if (typeof window === "undefined") return `/#${hash}`;
    const protocol = window.location.protocol;
    const host = window.location.hostname.replace(/^blog\./, "");
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${protocol}//${host}${port}/${hash ? `#${hash}` : ""}`;
  };

  const currentTheme = mounted ? resolvedTheme : "dark";

  const mobileOverlay = (
    <div
      className={`fixed inset-0 bg-white dark:bg-black z-[60] flex flex-col items-center justify-center transition-all duration-300 ease-in-out md:hidden ${
        isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
      aria-hidden={!isMenuOpen}
      style={{ paddingTop: "80px" }}
    >
      <button
        type="button"
        className="absolute top-6 right-6 p-2 text-black dark:text-white"
        onClick={() => setIsMenuOpen(false)}
        aria-label="Close Menu"
      >
        <X size={24} />
      </button>
      <div className="flex flex-col items-center gap-8 mb-12 overflow-y-auto max-h-[calc(100vh-200px)] w-full px-4">
        <Link
          href={isSubdomain ? getMainDomainUrl("") : "/"}
          onClick={() => setIsMenuOpen(false)}
          className="text-2xl font-bold text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
        >
          Portfolio
        </Link>
        <Link
          href="/blog"
          onClick={() => setIsMenuOpen(false)}
          className="text-2xl font-bold text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
        >
          Blog
        </Link>

        {/* Mobile Resume Button */}
        <ResumeButton align="center" position="bottom">
          <span className="text-xl font-bold text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer">
            <FileText size={20} /> {t.hero.resume}
          </span>
        </ResumeButton>
      </div>

      <div className="flex items-center gap-8 mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8 w-64 justify-center">
        {/* Lang Toggle */}
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "pt" : "en")}
          className="flex flex-col items-center gap-2 text-zinc-600 dark:text-zinc-400"
          aria-label="Toggle Language"
        >
          <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-900">
            <span className="font-mono text-sm font-bold">{lang.toUpperCase()}</span>
          </div>
          <span className="text-xs font-mono uppercase">Language</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
          className="flex flex-col items-center gap-2 text-zinc-600 dark:text-zinc-400"
          aria-label="Toggle Theme"
        >
          <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-900">
            {mounted ? (
              currentTheme === "light" ? (
                <Moon size={20} />
              ) : (
                <Sun size={20} />
              )
            ) : (
              <Moon size={20} />
            )}
          </div>
          <span className="text-xs font-mono uppercase">Theme</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <nav className={navbarClass}>
        <div
          className="absolute inset-0 backdrop-blur-md opacity-0 transition-opacity pointer-events-none"
          style={{
            opacity: scrollY > 20 ? 1 : 0,
            contain: "layout style paint",
          }}
        />
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            {isSubdomain ? (
              <a
                href={getMainDomainUrl("")}
                className="font-mono text-xl font-bold tracking-tighter hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1 text-black dark:text-white z-50 relative"
                aria-label="Gustavo Widman - Go to home"
              >
                WW
              </a>
            ) : (
              <Link
                href="/"
                className="font-mono text-xl font-bold tracking-tighter hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1 text-black dark:text-white z-50 relative"
                aria-label="Gustavo Widman - Go to home"
              >
                WW
              </Link>
            )}

            <div className="hidden md:flex items-center gap-6">
              <div className="w-[260px] max-w-[32vw]">
                <SearchTrigger
                  placeholder={lang === "en" ? "Search articles..." : "Buscar artigos..."}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-center gap-4">
                  <Link
                    href={isSubdomain ? getMainDomainUrl("") : "/"}
                    className="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Portfolio
                  </Link>
                  <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />

                  <ResumeButton align="center" position="bottom">
                    <div className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 group relative">
                      <FileText size={18} />
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-[10px] bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {t.hero.resume}
                      </span>
                    </div>
                  </ResumeButton>

                  <button
                    type="button"
                    onClick={() => setLang(lang === "en" ? "pt" : "en")}
                    className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 w-[34px] h-[34px] flex items-center justify-center"
                    aria-label="Toggle Language"
                  >
                    <span className="font-mono text-xs font-bold leading-none">
                      {lang.toUpperCase()}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
                    className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                    aria-label="Toggle Theme"
                  >
                    {mounted ? (
                      currentTheme === "light" ? (
                        <Moon size={18} />
                      ) : (
                        <Sun size={18} />
                      )
                    ) : (
                      <Moon size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="md:hidden p-2 text-black dark:text-white z-50 relative"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {mounted ? createPortal(mobileOverlay, document.body) : null}
    </>
  );
};

export default BlogNavbar;
