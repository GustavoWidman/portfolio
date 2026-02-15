"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BlogNavbar from "./BlogNavbar";
import type { Language } from "@/lib/types";
import { useLanguage } from "@/lib/useLanguage";
import { BlogSearchProvider } from "./SearchProvider";
import { VersionFooter } from "@/components/portfolio";

interface BlogLayoutClientProps {
	children: ReactNode;
	initialLang?: Language;
}

export default function BlogLayoutClient({
	children,
	initialLang = "en",
}: BlogLayoutClientProps) {
	const { lang, setLang } = useLanguage(initialLang);
	const pathname = usePathname();
	const [isSubdomain, setIsSubdomain] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			setIsSubdomain(window.location.hostname.startsWith("blog."));
		}
	}, []);

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
			<main className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-6">
				{children}
			</main>
			<VersionFooter />
		</BlogSearchProvider>
	);
}
