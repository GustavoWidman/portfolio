import { useCallback, useEffect, useMemo, useState } from "react";
import About from "./components/About";
import ExperienceSection from "./components/Experience";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Intro from "./components/Intro";
import Navbar from "./components/Navbar";
import Projects from "./components/Projects";
import Stack from "./components/Stack";
import type { Language, Theme } from "./types";

function App() {
  const [scrollY, setScrollY] = useState(0);
  const [lang, setLang] = useState<Language>("en");
  const [theme, setTheme] = useState<Theme>("dark");
  const [showIntro, setShowIntro] = useState(true);

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
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

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

        <Hero
          scrollY={scrollY}
          lang={lang}
          theme={theme}
          scrollTo={scrollTo}
          startTerminal={!showIntro}
        />

        {/* Content Container */}
        <div className="relative bg-zinc-50 dark:bg-black z-20 transition-colors duration-300">
          <About lang={lang} />
          <Stack lang={lang} />
          <ExperienceSection lang={lang} />
          <Projects lang={lang} />
          <Footer lang={lang} />
        </div>
      </div>
    </>
  );
}

export default App;
