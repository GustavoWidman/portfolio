"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Intro, Portfolio, VersionFooter } from "@/components/portfolio";
import type { Language } from "@/lib/types";
import { useMounted, useSkipIntro } from "@/lib/useMounted";

interface HomeClientProps {
  lang?: Language;
  skipIntro?: boolean;
}

export default function HomeClient({ lang = "en", skipIntro = false }: HomeClientProps) {
  const shouldSkip = useSkipIntro();
  const [showIntro, setShowIntro] = useState(!skipIntro && !shouldSkip);
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const handleIntroComplete = () => {
    setShowIntro(false);
    localStorage.setItem("portfolio_intro_last_seen", Date.now().toString());
  };

  const theme = mounted ? resolvedTheme || "dark" : "dark";

  const containerClassName = `min-h-screen font-sans transition-colors duration-300 ${
    theme === "dark"
      ? "bg-black text-white selection:bg-white selection:text-black mesh-bg-dark"
      : "bg-zinc-50 text-zinc-900 selection:bg-black selection:text-white mesh-bg-light"
  } ${showIntro ? "opacity-0 h-0 overflow-hidden" : "opacity-100 animate-fade-in"}`;

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
