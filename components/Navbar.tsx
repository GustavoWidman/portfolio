import { FileText, Menu, Moon, Sun, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { DATA } from "../data/content";
import type { Language, Theme } from "../types";
import ResumeButton from "./ResumeButton";
import { SearchDialog } from "./Blog/SearchDialog";

interface NavbarProps {
  scrollY: number;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  scrollTo: (id: string) => void;
  isSubdomain?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ scrollY, lang, setLang, theme, setTheme, scrollTo, isSubdomain }) => {
  const t = DATA[lang];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  // Handle Cmd+K globally for Search Dialog (only on blog routes)
  useEffect(() => {
    // Only enable on blog pages
    const isBlog = isSubdomain || location.pathname.startsWith("/blog");
    if (!isBlog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubdomain, location.pathname]);

  // Memoize the navbar className to prevent unnecessary recalculations
  const navbarClass = useMemo(
    () =>
      `fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 20 || location.pathname !== "/"
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5"
          : "bg-white/0 dark:bg-black/0 border-b border-transparent"
      }`,
    [scrollY, location.pathname],
  );

  // Memoize mobile nav click handler to prevent unnecessary re-renders
  const handleMobileNavClick = useCallback(
    (id: string) => {
      setIsMenuOpen(false);
      // Small delay to allow menu to close before scrolling
      if (id === 'blog') {
        // Navigation handled by Link
      } else {
        setTimeout(() => scrollTo(id), 300);
      }
    },
    [scrollTo],
  );

  const getMainDomainUrl = (hash: string) => {
    if (typeof window === 'undefined') return `/#${hash}`;
    const protocol = window.location.protocol;
    const host = window.location.hostname.replace(/^blog\./, "");
    const port = window.location.port ? `:${window.location.port}` : "";
    return `${protocol}//${host}${port}/#${hash}`;
  };

  return (
    <>
      <nav className={navbarClass} style={{ transform: "translateZ(0)" }}>
        {/* Isolated backdrop blur element - only repaints when crossing threshold */}
        <div
          className="absolute inset-0 backdrop-blur-md opacity-0 transition-opacity pointer-events-none"
          style={{
            opacity: scrollY > 20 || location.pathname !== "/" ? 1 : 0,
            contain: "layout style paint",
          }}
        />
        {/* Content layer above blur */}
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
                to="/"
                className="font-mono text-xl font-bold tracking-tighter hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1 text-black dark:text-white z-50 relative"
                onClick={() => window.scrollTo(0, 0)}
                aria-label="Gustavo Widman - Go to home"
              >
                WW
              </Link>
            )}

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {Object.entries(t.nav).map(([key, label]) => (
                  key === 'blog' ? (
                    <Link
                      key={key}
                      to={isSubdomain ? "/" : "/blog"}
                      className="hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
                    >
                      {label}
                    </Link>
                  ) : (
                    isSubdomain ? (
                      <a
                        key={key}
                        href={getMainDomainUrl(key)}
                        className="hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
                      >
                        {label}
                      </a>
                    ) : (
                      <button
                        type="button"
                        key={key}
                        onClick={() => scrollTo(key)}
                        className="hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
                      >
                        {label}
                      </button>
                    )
                  )
                ))}
              </div>

              <div className="flex items-center gap-4 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                {/* Resume Button Dropdown */}
                <ResumeButton align="center" position="bottom">
                  <div className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 group relative">
                    <FileText size={18} />
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-[10px] bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {t.hero.resume}
                    </span>
                  </div>
                </ResumeButton>

                {/* Lang Toggle */}
                <button
                  type="button"
                  onClick={() => setLang(lang === "en" ? "pt" : "en")}
                  className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 w-[34px] h-[34px] flex items-center justify-center"
                  aria-label="Toggle Language"
                >
                  <span className="font-mono text-xs font-bold leading-none">{lang.toUpperCase()}</span>
                </button>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
                  aria-label="Toggle Theme"
                >
                  {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 text-black dark:text-white z-50 relative"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <nav
        className={`fixed inset-0 bg-white dark:bg-black z-40 flex flex-col items-center justify-center transition-all duration-300 ease-in-out lg:hidden ${
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        aria-hidden={!isMenuOpen}
        style={{ paddingTop: "80px" }} // Add padding to avoid clipping under the fixed navbar header
      >
        <div className="flex flex-col items-center gap-8 mb-12 overflow-y-auto max-h-[calc(100vh-200px)] w-full px-4">
          {Object.entries(t.nav).map(([key, label]) => (
             key === 'blog' ? (
              <Link
                key={key}
                to={isSubdomain ? "/" : "/blog"}
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl font-bold text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
              >
                {label}
              </Link>
             ) : (
              isSubdomain ? (
                <a
                  key={key}
                  href={getMainDomainUrl(key)}
                  className="text-2xl font-bold text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
                >
                  {label}
                </a>
              ) : (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleMobileNavClick(key)}
                  className="text-2xl font-bold text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
                >
                  {label}
                </button>
              )
             )
          ))}

          {/* Mobile Resume Button with Language Selection */}
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
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex flex-col items-center gap-2 text-zinc-600 dark:text-zinc-400"
            aria-label="Toggle Theme"
          >
            <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-900">
              {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <span className="text-xs font-mono uppercase">Theme</span>
          </button>
        </div>
      </nav>
      
      {/* Global Search Dialog */}
      <SearchDialog 
        open={isSearchOpen} 
        setOpen={setIsSearchOpen} 
        lang={lang} 
      />
    </>
  );
};

// Optimize with React.memo and custom comparison
// Only re-render when scrollY crosses the 20px threshold, lang/theme changes, or path changes
export default React.memo(Navbar, (prev, next) => {
  const prevScrolled = prev.scrollY > 20;
  const nextScrolled = next.scrollY > 20;
  // Note: We can't easily check path change here without passing location as prop, 
  // but since we use useLocation hook inside, the component will re-render anyway regardless of props.
  // Actually React.memo only prevents re-renders from PARENT.
  // So internal state/hooks will still trigger re-render.
  // But we should ensure we don't block it if props change.
  return prevScrolled === nextScrolled && prev.lang === next.lang && prev.theme === next.theme;
});
