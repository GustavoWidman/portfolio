"use client";

import { BookOpen, FolderCode, Home } from "lucide-react";
import Link from "next/link";
import { DATA } from "@/lib/data/content";
import type { Language } from "@/lib/types";

interface NotFoundClientProps {
  lang: Language;
}

export default function NotFoundClient({ lang }: NotFoundClientProps) {
  const t = DATA[lang].notFound;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-white dark:bg-zinc-950">
      <div className="text-center max-w-md">
        <h1 className="text-[10rem] sm:text-[12rem] font-bold leading-none tracking-tighter text-zinc-200 dark:text-zinc-800 select-none">
          {t.title}
        </h1>
        <div className="mt-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-3">
            {t.subtitle}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 font-mono text-sm sm:text-base mb-8">
            {t.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="whitespace-nowrap bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={16} /> {t.backHome}
            </Link>
            <Link
              href="/#work"
              className="whitespace-nowrap px-6 py-3 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full font-medium hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <FolderCode size={16} /> {t.viewProjects}
            </Link>
            <Link
              href="/blog"
              className="whitespace-nowrap px-6 py-3 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full font-medium hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen size={16} /> {t.readBlog}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
