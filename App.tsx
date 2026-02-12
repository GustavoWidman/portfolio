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

function App() {
  const [scrollY, setScrollY] = useState(0);
  const [lang, setLang] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("dark");
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(() => {
    // Only show intro on home page, skip for blog routes
    return location.pathname === "/";
  });
  const navigate = useNavigate();

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
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.pathname, navigate]);

  const setLangMemo = useCallback((lang: Language) => {
    setLang(lang);
  }, []);

  const setThemeMemo = useCallback((theme: Theme) => {
    setTheme(theme);
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
        />

        <Routes>
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
        </Routes>
      </div>
    </>
  );
}

export default App;
