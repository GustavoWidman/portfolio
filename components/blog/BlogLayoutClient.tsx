"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BlogNavbar from "./BlogNavbar";
import type { Language } from "@/lib/types";
import { useLanguage } from "@/lib/useLanguage";
import { BlogSearchProvider } from "./SearchProvider";

interface BlogLayoutClientProps {
	children: ReactNode;
	initialLang?: Language;
	isSubdomain?: boolean;
}

export default function BlogLayoutClient({
	children,
	initialLang = "en",
	isSubdomain = false,
}: BlogLayoutClientProps) {
	const { lang, setLang } = useLanguage(initialLang);
	const pathname = usePathname();
	const isPost = useMemo(
		() => !!pathname && pathname.startsWith("/blog/") && pathname !== "/blog",
		[pathname]
	);

	return (
		<BlogSearchProvider lang={lang}>
			<BlogNavbar
				lang={lang}
				setLang={setLang}
				isSubdomain={isSubdomain}
			/>
			<main className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
				{children}
			</main>
		</BlogSearchProvider>
	);
}
