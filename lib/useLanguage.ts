"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Language } from "@/lib/types";

const STORAGE_KEY = "portfolio_lang";
const COOKIE_NAME = "portfolio_lang";

function setCookie(lang: Language) {
  if (typeof window !== "undefined") {
    document.cookie = `${COOKIE_NAME}=${lang};path=/;max-age=31536000;SameSite=Lax`;
  }
}

export function useLanguage(serverLang: Language = "en") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lang, setLangState] = useState<Language>(serverLang);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Priority 1: URL Param
    const paramLang = searchParams?.get("lang") as Language | null;
    if (paramLang === "en" || paramLang === "pt") {
      setLangState(paramLang);
      setHydrated(true);
      return;
    }

    // Priority 2: LocalStorage (synced with cookie)
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === "en" || stored === "pt") {
        setLangState(stored);
        setCookie(stored);
        setHydrated(true);
        return;
      }
    }

    // Priority 3: Use server-detected language (already set)
    setHydrated(true);
  }, [searchParams, serverLang]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === "en" || e.newValue === "pt")) {
        setLangState(e.newValue);
        setCookie(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateLang = useCallback(
    (nextLang: Language) => {
      setLangState(nextLang);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, nextLang);
        setCookie(nextLang);
        window.dispatchEvent(new CustomEvent("lang-change", { detail: nextLang }));

        const currentParams = new URLSearchParams(searchParams?.toString());
        if (currentParams.has("lang")) {
          currentParams.delete("lang");
          const newSearch = currentParams.toString();
          const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname || "/";
          router.replace(newUrl, { scroll: false });
        }
      }
    },
    [searchParams, pathname, router],
  );

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const eventLang = (e as CustomEvent).detail;
      if (eventLang === "en" || eventLang === "pt") {
        setLangState(eventLang);
      }
    };
    window.addEventListener("lang-change", handleLangChange);
    return () => window.removeEventListener("lang-change", handleLangChange);
  }, []);

  return { lang, setLang: updateLang, hydrated };
}
