import { useCallback, useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import BlogListing from "./components/Blog/BlogListing";
import BlogPost from "./components/Blog/BlogPost";
import Navbar from "./components/Navbar";
import Portfolio from "./components/Portfolio";
import Intro from "./components/Intro";
import type { Language, Theme } from "./types";

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small timeout to ensure elements are mounted
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

import { Navigate } from "react-router-dom";

function App() {
  const [scrollY, setScrollY] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const isBlogSubdomain = useMemo(() => {
    return window.location.hostname.startsWith("blog.");
  }, []);

  // Initialize lang from URL param or LocalStorage
  const [lang, setLang] = useState<Language>(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang");
    if (langParam === "pt" || langParam === "en") return langParam;
    
    // Check LocalStorage
    const storedLang = localStorage.getItem("lang");
    if (storedLang === "pt" || storedLang === "en") return storedLang;
    
    return "en";
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  
  const [showIntro, setShowIntro] = useState(() => {
    if (window.location.hostname.startsWith("blog.")) return false;
    // Only show intro on home page, skip for blog routes or if explicitly disabled via param
    if (location.pathname !== "/") return false;
    
    const params = new URLSearchParams(window.location.search);
    if (params.get("intro") === "false") return false;
    
    return true;
  });

  // Removed useEffect for redirect since we now handle it via routing structure

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Memoized callbacks to prevent unnecessary re-renders of child components
  const scrollTo = useCallback((id: string) => {
    if (isBlogSubdomain) {
      // If on blog subdomain, redirect to main domain for portfolio sections
      // Assuming main domain is just removing "blog." prefix
      const mainDomain = window.location.hostname.replace(/^blog\./, "");
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : "";
      window.location.href = `${protocol}//${mainDomain}${port}/#${id}`;
      return;
    }

    if (location.pathname !== "/") {
      navigate(`/#${id}`);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.pathname, navigate, isBlogSubdomain]);

  const setLangMemo = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  }, []);

  const setThemeMemo = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  }, []);

  // Memoize the main container className to avoid recalculation
  const containerClassName = useMemo(
    () =>
      `min-h-screen font-sans transition-colors duration-300 ${theme === "dark" ? "bg-black text-white selection:bg-white selection:text-black mesh-bg-dark" : "bg-zinc-50 text-zinc-900 selection:bg-black selection:text-white mesh-bg-light"} ${showIntro ? "opacity-0 h-0 overflow-hidden" : "opacity-100 animate-fade-in"}`,
    [theme, showIntro],
  );

  return (
    <>
      <ScrollToTop />
      {showIntro && <Intro onComplete={() => setShowIntro(false)} />}

      <div className={containerClassName}>
        <Navbar
          scrollY={scrollY}
          lang={lang}
          setLang={setLangMemo}
          theme={theme}
          setTheme={setThemeMemo}
          scrollTo={scrollTo}
          isSubdomain={isBlogSubdomain}
        />

        <Routes>
          {isBlogSubdomain ? (
            <>
              <Route path="/" element={<BlogListing lang={lang} isSubdomain={true} />} />
              <Route path="/:slug" element={<BlogPost lang={lang} isSubdomain={true} />} />
              <Route path="/blog" element={<Navigate to="/" replace />} />
              <Route path="/blog/:slug" element={<Navigate to={`/${location.pathname.split('/').pop()}`} replace />} />
            </>
          ) : (
            <>
              <Route
                path="/"
                element={
                  <Portfolio
                    lang={lang}
                    theme={theme}
                    scrollY={scrollY}
                    scrollTo={scrollTo}
                    showIntro={showIntro}
                    setShowIntro={setShowIntro}
                  />
                }
              />
              <Route path="/blog" element={<BlogListing lang={lang} />} />
              <Route path="/blog/:slug" element={<BlogPost lang={lang} />} />
            </>
          )}
        </Routes>
      </div>
    </>
  );
}

export default App;
