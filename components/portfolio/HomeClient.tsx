"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { Intro, Portfolio, VersionFooter } from "@/components/portfolio";
import type { Language } from "@/lib/types";

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
  const [introComplete, setIntroComplete] = useState(skipIntro);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check URL params for intro=false on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("intro") === "false") {
        setShowIntro(false);
        setIntroComplete(true);
      }
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    // Small delay before showing portfolio with animation
    setTimeout(() => {
      setIntroComplete(true);
    }, 100);
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
