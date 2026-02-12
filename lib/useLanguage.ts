"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Language } from "@/lib/types";

const STORAGE_KEY = "portfolio_lang";

export function useLanguage(defaultLang: Language = "en") {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [lang, setLangState] = useState<Language>(defaultLang);

	useEffect(() => {
		// Priority 1: URL Param
		const paramLang = searchParams?.get("lang") as Language | null;
		if (paramLang === "en" || paramLang === "pt") {
			setLangState(paramLang);
			return;
		}

		// Priority 2: LocalStorage
		if (typeof window !== "undefined") {
			const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
			if (stored === "en" || stored === "pt") {
				setLangState(stored);
				return;
			}
		}

		// Priority 3: Default (En)
		setLangState("en");
	}, [searchParams]);

	// Listen for cross-component localStorage changes
	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === STORAGE_KEY && (e.newValue === "en" || e.newValue === "pt")) {
				setLangState(e.newValue);
			}
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);

	const updateLang = useCallback((nextLang: Language) => {
		// 1. Update State
		setLangState(nextLang);

		if (typeof window !== "undefined") {
			// 2. Update Storage
			window.localStorage.setItem(STORAGE_KEY, nextLang);

			// 3. Dispatch a custom event so same-tab useLanguage instances sync
			window.dispatchEvent(new CustomEvent("lang-change", { detail: nextLang }));

			// 4. Clean URL (remove ?lang= param if it exists)
			const currentParams = new URLSearchParams(searchParams?.toString());
			if (currentParams.has("lang")) {
				currentParams.delete("lang");
				const newSearch = currentParams.toString();
				const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname || "/";
				router.replace(newUrl, { scroll: false });
			}
		}
	}, [searchParams, pathname, router]);

	// Listen for same-tab language change events
	useEffect(() => {
		const handleLangChange = (e: Event) => {
			const lang = (e as CustomEvent).detail;
			if (lang === "en" || lang === "pt") {
				setLangState(lang);
			}
		};
		window.addEventListener("lang-change", handleLangChange);
		return () => window.removeEventListener("lang-change", handleLangChange);
	}, []);

	return { lang, setLang: updateLang };
}
