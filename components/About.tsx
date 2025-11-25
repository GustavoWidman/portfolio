import React from "react";
import { DATA, IS_OPEN_TO_WORK } from "../data/content";
import type { Language } from "../types";

interface AboutProps {
  lang: Language;
}

const About: React.FC<AboutProps> = ({ lang }) => {
  const t = DATA[lang];

  return (
    <section
      id="about"
      className="py-24 px-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between w-full mb-12">
          <h3 className="text-xs font-mono text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">
            {t.about.title}
          </h3>
          {IS_OPEN_TO_WORK && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-fade-in transition-colors duration-300">
              <span className="relative flex h-2 w-2" style={{ contain: "layout style paint" }}>
                <span
                  className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50"
                  style={{
                    contain: "layout style paint",
                  }}
                ></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600 dark:text-zinc-300">
                {t.about.openToWork}
              </span>
            </div>
          )}
        </div>

        <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8 text-black dark:text-white">
          {t.about.heading}
        </h2>
        <div className="space-y-6 text-zinc-600 dark:text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl font-mono">
          <p>{t.about.p1}</p>
          <p>{t.about.p2}</p>
          <p>{t.about.p3}</p>
        </div>
      </div>
    </section>
  );
};

export default React.memo(About);
