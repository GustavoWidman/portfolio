import { FileText, Menu, Moon, Sun, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DATA } from "../data/content";
import type { Language, Theme } from "../types";
import ResumeButton from "./ResumeButton";

interface NavbarProps {
  scrollY: number;
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  scrollTo: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ scrollY, lang, setLang, theme, setTheme, scrollTo }) => {
  const t = DATA[lang];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const resumeUrl = lang === "pt" ? "/resume-pt.pdf" : "/resume-en.pdf";

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  // Memoize the navbar className to prevent unnecessary recalculations
  const navbarClass = useMemo(
    () =>
      `fixed top-0 w-full z-50 transition-all duration-300 ${
        scrollY > 20
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5"
          : "bg-white/0 dark:bg-black/0 border-b border-transparent"
      }`,
    [scrollY],
  );

  // Memoize mobile nav click handler to prevent unnecessary re-renders
  const handleMobileNavClick = useCallback(
    (id: string) => {
      setIsMenuOpen(false);
      // Small delay to allow menu to close before scrolling
      setTimeout(() => scrollTo(id), 300);
    },
    [scrollTo],
  );

  return (
    <>
      <nav className={navbarClass} style={{ transform: "translateZ(0)" }}>
        {/* Isolated backdrop blur element - only repaints when crossing threshold */}
        <div
          className="absolute inset-0 backdrop-blur-md opacity-0 transition-opacity pointer-events-none"
          style={{
            opacity: scrollY > 20 ? 1 : 0,
            contain: "layout style paint",
          }}
        />
        {/* Content layer above blur */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <button
              type="button"
              className="font-mono text-xl font-bold tracking-tighter hover:opacity-70 transition-opacity cursor-pointer flex items-center gap-1 text-black dark:text-white z-50 relative"
              onClick={() => window.scrollTo(0, 0)}
              aria-label="Gustavo Widman - Go to home"
            >
              WW
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {Object.entries(t.nav).map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => scrollTo(key)}
                    className="hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest text-xs"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                {/* Resume Button Dropdown */}
                <ResumeButton align="right" position="bottom">
                  <div
                    className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 group relative"
                    aria-label="Download CV"
                  >
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
                  className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400 pb-2"
                  aria-label="Toggle Language"
                >
                  <span className="font-mono text-xs font-bold">{lang.toUpperCase()}</span>
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
      >
        <div className="flex flex-col items-center gap-8 mb-12">
          {Object.entries(t.nav).map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => handleMobileNavClick(key)}
              className="text-2xl font-bold text-black dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
            >
              {label}
            </button>
          ))}
          {/* Mobile Resume Link (Direct to current Lang PDF for simplicity on mobile) */}
          <a
            href={resumeUrl}
            target="_blank"
            className="text-xl font-bold text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
          >
            <FileText size={20} /> {t.hero.resume}
          </a>
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
    </>
  );
};

// Optimize with React.memo and custom comparison
// Only re-render when scrollY crosses the 20px threshold or lang/theme changes
export default React.memo(Navbar, (prev, next) => {
  const prevScrolled = prev.scrollY > 20;
  const nextScrolled = next.scrollY > 20;
  return prevScrolled === nextScrolled && prev.lang === next.lang && prev.theme === next.theme;
});
