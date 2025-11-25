import { Building2, CheckCircle2 } from "lucide-react";
import React from "react";
import { DATA, STATIC_EXPERIENCE } from "../data/content";
import type { Language } from "../types";
import { formatDate, getDuration } from "../utils/helpers";

interface ExperienceProps {
  lang: Language;
}

const ExperienceSection: React.FC<ExperienceProps> = ({ lang }) => {
  const t = DATA[lang];

  return (
    <section
      id="exp"
      className="py-24 px-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto">
        <h3 className="text-xs font-mono text-zinc-500 dark:text-zinc-600 mb-16 uppercase tracking-widest">
          {t.experience.title}
        </h3>

        {STATIC_EXPERIENCE.map((companyData, companyIdx) => {
          const localizedCompany = t.experience.jobs[companyIdx];

          return (
            <div key={companyData.id} className="relative pb-24 last:pb-0">
              {/* Company Header */}
              <div className="flex items-center gap-4 mb-8">
                {/* Logo Container: Unopinionated, fits whatever is passed */}
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-black/5 ring-1 ring-zinc-900/5 dark:ring-white/10 shrink-0">
                  {companyData.logo || (
                    <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Building2 className="text-zinc-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-black dark:text-white leading-tight">
                    {localizedCompany.company}
                  </h4>
                </div>
              </div>

              {/* Roles Container */}
              <div className="pl-6 border-l-2 border-zinc-100 dark:border-zinc-900 ml-6 space-y-16">
                {companyData.positions.map((position) => {
                  const localizedPos =
                    localizedCompany.positions[companyData.positions.indexOf(position)];
                  const dateRange = `${formatDate(position.startDate, lang)} — ${position.endDate ? formatDate(position.endDate, lang) : t.experience.present}`;
                  const duration = getDuration(position.startDate, position.endDate, lang);

                  return (
                    <div key={`${companyData.id}-${position.startDate}`} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-8 top-2 w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-black group-hover:bg-black dark:group-hover:bg-white transition-colors"></div>

                      <div className="md:flex gap-8 items-baseline">
                        {/* Role & Date */}
                        <div className="md:w-1/3 mb-4 md:mb-0">
                          <h5 className="text-lg font-bold tracking-tight text-black dark:text-white mb-2">
                            {localizedPos.role}
                          </h5>
                          <div className="text-zinc-500 font-mono text-xs flex flex-wrap gap-x-2 gap-y-1 items-center">
                            <span>{dateRange}</span>
                            <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">•</span>
                            <span className="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-[10px]">
                              {duration}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            {position.techStack.map((tech) => (
                              <span
                                key={tech}
                                className="text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 rounded border border-zinc-200 dark:border-zinc-800/50"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="md:w-2/3">
                          <div className="space-y-3">
                            {localizedPos.description.map((item) => (
                              <div
                                key={item}
                                className="group/item flex gap-3 text-zinc-600 dark:text-zinc-400 text-xs md:text-sm font-mono leading-relaxed hover:text-black dark:hover:text-zinc-200 transition-colors items-start"
                              >
                                <CheckCircle2 className="w-4 h-4 text-zinc-300 dark:text-zinc-700 mt-[3px] group-hover/item:text-black dark:group-hover/item:text-white transition-colors shrink-0" />
                                <p>{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default React.memo(ExperienceSection);
