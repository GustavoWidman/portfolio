"use client";

import { SearchProvider } from "fumadocs-ui/contexts/search";
import SearchDialog from "fumadocs-ui/components/dialog/search-default";
import type { ReactNode } from "react";

export function BlogSearchProvider({
	children,
	lang = "en",
}: { children: ReactNode; lang?: "en" | "pt" }) {
	return (
		<SearchProvider
			SearchDialog={(props) => (
				<SearchDialog
					{...props}
					api="/api/search"
					type="static"
					defaultTag={lang}
				/>
			)}
		>
			{children}
		</SearchProvider>
	);
}
