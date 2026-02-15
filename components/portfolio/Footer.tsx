import { FileText, Mail } from "lucide-react";
import React from "react";
import { LuLinkedin } from "react-icons/lu";
import { DATA } from "@/lib/data/content";
import type { Language } from "@/lib/types";
import ResumeButton from "./ResumeButton";

interface FooterProps {
  lang: Language;
}

const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = DATA[lang];

  return (
    <section
      id="contact"
      className="pt-32 pb-10 px-6 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-center transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8 text-black dark:text-white">
          {t.footer.title}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-500 mb-12 max-w-xl mx-auto font-mono text-sm">
          {t.footer.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-6 mb-24">
          <a
            href="mailto:gustavowidman@gmail.com"
            className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <Mail size={20} /> {t.footer.email}
          </a>
          <a
            href="https://www.linkedin.com/in/gustavo-widman"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 bg-transparent border border-zinc-300 dark:border-zinc-800 text-black dark:text-white font-bold rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
          >
            <LuLinkedin size={20} /> {t.footer.linkedin}
          </a>

          <ResumeButton align="center" position="top">
            <div className="px-8 py-4 bg-transparent border border-zinc-300 dark:border-zinc-800 text-black dark:text-white font-bold rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2">
              <FileText size={20} /> {t.footer.resume}
            </div>
          </ResumeButton>
        </div>

        <footer className="text-zinc-500 dark:text-zinc-700 text-xs font-mono uppercase tracking-widest">
          © {new Date().getFullYear()} Gustavo Widman
        </footer>
      </div>
    </section>
  );
};

export default React.memo(Footer);
