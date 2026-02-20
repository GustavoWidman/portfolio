"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Hero, About, Stack, Experience, Projects, Footer, Navbar } from "@/components/portfolio";
import type { Language } from "@/lib/types";
import { useLanguage } from "@/lib/useLanguage";
import { useMounted } from "@/lib/useMounted";

interface PortfolioProps {
  lang?: Language;
  isSubdomain?: boolean;
}

export default function Portfolio({
  lang: serverLang = "en",
  isSubdomain = false,
}: PortfolioProps) {
  const { lang, setLang } = useLanguage(serverLang);
  const [scrollY, setScrollY] = useState(0);
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  // Throttled scroll handler using RAF
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

  const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const navbarHeight = 80; // h-20 = 5rem = 80px
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Use dark as default during SSR to avoid flash
  const theme = mounted ? resolvedTheme || "dark" : "dark";

  return (
    <>
      <Navbar
        scrollY={scrollY}
        lang={lang}
        setLang={setLang}
        scrollTo={scrollTo}
        isSubdomain={isSubdomain}
      />
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
        <Hero
          scrollY={scrollY}
          lang={lang}
          theme={theme}
          scrollTo={scrollTo}
          startTerminal={mounted}
        />
        <About lang={lang} />
        <Stack lang={lang} />
        <Experience lang={lang} />
        <Projects lang={lang} />
        <Footer lang={lang} />
      </main>
    </>
  );
}
