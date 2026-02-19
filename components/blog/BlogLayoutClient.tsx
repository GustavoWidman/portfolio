"use client";

import { useEffect, useState, type ReactNode } from "react";
import BlogNavbar from "./BlogNavbar";
import type { Language } from "@/lib/types";
import { useLanguage } from "@/lib/useLanguage";
import { BlogSearchProvider } from "./SearchProvider";
import { VersionFooter } from "@/components/portfolio";

interface BlogLayoutClientProps {
  children: ReactNode;
  serverLang?: Language;
}

export default function BlogLayoutClient({ children, serverLang = "en" }: BlogLayoutClientProps) {
  const { lang, setLang } = useLanguage(serverLang);
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSubdomain(window.location.hostname.startsWith("blog."));
    }
  }, []);

  return (
    <BlogSearchProvider lang={lang}>
      <BlogNavbar lang={lang} setLang={setLang} isSubdomain={isSubdomain} />
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-6">
        {children}
      </main>
      <VersionFooter />
    </BlogSearchProvider>
  );
}
