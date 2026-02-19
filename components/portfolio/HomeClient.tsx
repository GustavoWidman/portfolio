"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Intro, Portfolio, VersionFooter } from "@/components/portfolio";
import type { Language } from "@/lib/types";
import { useMounted } from "@/lib/useMounted";

interface HomeClientProps {
  lang?: Language;
  skipIntro?: boolean;
}

const INTRO_COOKIE = "portfolio_intro_last_seen";

function setIntroCookie() {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${INTRO_COOKIE}=${Date.now()};path=/;expires=${expires};SameSite=Lax`;
}

export default function HomeClient({ lang = "en", skipIntro = false }: HomeClientProps) {
  const [showIntro, setShowIntro] = useState(!skipIntro);
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroCookie();
    localStorage.setItem(INTRO_COOKIE, Date.now().toString());
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
