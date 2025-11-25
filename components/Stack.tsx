import React, { cloneElement } from "react";
import { DATA, SKILL_ICONS } from "../data/content";
import type { Language } from "../types";

interface StackProps {
  lang: Language;
}

const Stack: React.FC<StackProps> = ({ lang }) => {
  const t = DATA[lang];

  return (
    <section
      id="stack"
      className="py-24 px-6 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300"
    >
      <div className="max-w-5xl mx-auto">
        <h3 className="text-xs font-mono text-zinc-500 dark:text-zinc-600 uppercase tracking-widest mb-16">
          {t.stack.title}
        </h3>

        <div className="flex flex-col">
          {SKILL_ICONS.map((category, idx) => {
            const isLast = idx === SKILL_ICONS.length - 1;
            return (
              <div
                key={category.id}
                className={`py-12 md:grid md:grid-cols-12 gap-8 md:gap-12 items-start ${!isLast ? "border-b border-dashed border-zinc-200 dark:border-zinc-800" : ""}`}
              >
                {/* Left Column: Category Info */}
                <div className="md:col-span-5 lg:col-span-4 mb-8 md:mb-0">
                  <div className="flex items-center gap-3 mb-4 text-black dark:text-white">
                    <span className="p-2 bg-white dark:bg-zinc-900 rounded-md text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                      {cloneElement(category.icon as React.ReactElement<{ size?: number | string }>, {
                        size: 18,
                      })}
                    </span>
                    <h4 className="text-lg font-bold tracking-tight">{t.stack.categories[idx].title}</h4>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-500 font-mono text-xs leading-relaxed max-w-sm">
                    {t.stack.categories[idx].description}
                  </p>
                </div>

                {/* Right Column: Skills List */}
                <div className="md:col-span-7 lg:col-span-8">
                  <div className="flex flex-wrap gap-3 md:justify-end">
                    {category.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group cursor-default"
                      >
                        <span className="text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {cloneElement(skill.icon as React.ReactElement<{ size?: number | string }>, {
                            size: 14,
                          })}
                        </span>
                        <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                          {skill.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default React.memo(Stack);
