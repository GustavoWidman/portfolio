"use client";

import { ArrowRight, ChevronDown, Download } from "lucide-react";
import React, { useMemo } from "react";
import { DATA } from "@/lib/data/content";
import type { Language } from "@/lib/types";
import Terminal from "./Terminal";
import ResumeButton from "./ResumeButton";

interface HeroProps {
  scrollY: number;
  lang: Language;
  theme: string;
  scrollTo: (id: string) => void;
  startTerminal?: boolean;
}

const Hero: React.FC<HeroProps> = ({ scrollY, lang, theme, scrollTo, startTerminal = true }) => {
  const t = DATA[lang];

  const heroTextStyle = useMemo(() => {
    const base = {
      opacity: Math.max(0, 1 - scrollY / 500),
      transform: `translateY(${scrollY * -0.2}px)`,
    };
    return scrollY > 0 ? { ...base, willChange: "transform, opacity" as const } : base;
  }, [scrollY]);

  const terminalStyle = useMemo(() => {
    const base = {
      opacity: Math.max(0, 1 - scrollY / 1500),
      transform: `translateY(${scrollY * 0.1}px) scale(${1 - scrollY * 0.0002})`,
    };
    return scrollY > 0 ? { ...base, willChange: "transform, opacity" as const } : base;
  }, [scrollY]);

  const chevronStyle = useMemo(
    () => ({
      opacity: Math.max(0, 1 - scrollY / 200),
    }),
    [scrollY],
  );

  return (
    <div className="relative min-h-screen lg:h-[140vh]" id="home">
      {/* Grid Background Layer */}
      <div
        className={`absolute inset-0 z-0 ${theme === "dark" ? "bg-grid-dark" : "bg-grid-light"} mask-[linear-gradient(to_bottom,black_60%,transparent)]`}
      ></div>

      <div className="relative md:sticky md:top-0 w-full flex flex-col items-center justify-center pt-20 md:pt-28 pb-20 min-h-screen md:h-screen overflow-hidden">
        <div className="relative z-10 max-w-7xl w-full px-6 grid lg:grid-cols-2 gap-12 lg:gap-12 items-center">
          {/* Typography */}
          <div
            className="space-y-6 md:space-y-8 sm:space-y-8 text-center lg:!text-left"
            style={heroTextStyle}
          >
            <div>
              <h2 className="text-zinc-500 dark:text-zinc-500 font-mono mb-4 tracking-widest text-xs uppercase">
                {t.hero.subtitle}
              </h2>
              <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-8xl font-bold tracking-tighter leading-none text-black dark:text-white mb-2">
                {t.hero.title1}
                <br />
                {t.hero.title2}
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-lg text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed mx-auto lg:!mx-0 font-mono">
              {t.hero.desc}
            </p>

            <div className="flex flex-col sm:flex-row md:flex-row gap-4 justify-center lg:!justify-start">
              <button
                type="button"
                onClick={() => scrollTo("work")}
                className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                {t.hero.cta} <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => window.open("https://github.com/GustavoWidman", "_blank")}
                className="px-8 py-3 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full font-medium hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors"
              >
                {t.hero.github}
              </button>

              <ResumeButton align="center" position="bottom">
                <div className="px-8 py-3 h-full border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full font-medium hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors flex items-center gap-2 justify-center">
                  <Download size={18} /> CV
                </div>
              </ResumeButton>
            </div>
          </div>

          {/* Terminal Overlay */}
          <div
            className="hidden md:block min-h-[350px] md:min-h-0 h-[350px] lg:h-[400px] w-full max-w-2xl mx-auto lg:max-w-none shadow-2xl rounded-xl animate-fade-in gpu-accel"
            style={terminalStyle}
          >
            <Terminal startBoot={startTerminal} />
          </div>
        </div>

        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-400 dark:text-zinc-700 animate-bounce"
          style={chevronStyle}
        >
          <ChevronDown size={24} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(Hero, (prev, next) => {
  return (
    Math.floor(prev.scrollY / 10) === Math.floor(next.scrollY / 10) &&
    prev.lang === next.lang &&
    prev.theme === next.theme &&
    prev.startTerminal === next.startTerminal
  );
});
