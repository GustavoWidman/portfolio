"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { Intro, Portfolio, VersionFooter } from "@/components/portfolio";
import type { Language } from "@/lib/types";

const INTRO_KEY = "portfolio_intro_last_seen";
const INTRO_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours

interface HomeClientProps {
  lang?: Language;
  skipIntro?: boolean;
}

export default function HomeClient({ lang = "en", skipIntro = false }: HomeClientProps) {
  const [showIntro, setShowIntro] = useState(() => {
    // Skip intro if explicitly disabled
    if (skipIntro) return false;
    return true;
  });
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check URL params for intro=false on mount and localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const shouldSkipParams = params.get("intro") === "false";

      const lastSeen = localStorage.getItem(INTRO_KEY);
      const shouldSkipStorage = lastSeen
        ? Date.now() - parseInt(lastSeen, 10) < INTRO_COOLDOWN
        : false;

      if (shouldSkipParams || shouldSkipStorage) {
        setShowIntro(false);
      }
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    localStorage.setItem(INTRO_KEY, Date.now().toString());
  };

  // Use dark as default during SSR to avoid flash
  const theme = mounted ? resolvedTheme || "dark" : "dark";

  // Memoize the main container className to match old Vite app structure
  const containerClassName = useMemo(
    () =>
      `min-h-screen font-sans transition-colors duration-300 ${
        theme === "dark"
          ? "bg-black text-white selection:bg-white selection:text-black mesh-bg-dark"
          : "bg-zinc-50 text-zinc-900 selection:bg-black selection:text-white mesh-bg-light"
      } ${showIntro ? "opacity-0 h-0 overflow-hidden" : "opacity-100 animate-fade-in"}`,
    [theme, showIntro],
  );

  return (
    <>
      {showIntro && <Intro onComplete={handleIntroComplete} />}

      <div className={containerClassName}>
        <Portfolio lang={lang} />
      </div>

      <VersionFooter />
    </>
  );
}
