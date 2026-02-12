"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { TOCProvider, TOCScrollArea } from "fumadocs-ui/components/layout/toc";
import ClerkTOCItems from "fumadocs-ui/components/layout/toc-clerk";

interface TOCItem {
	id: string;
	text: ReactNode;
	depth: number;
}

interface BlogTOCProps {
	toc: TOCItem[];
	lang: "en" | "pt";
	variant: "mobile" | "desktop";
}

export function BlogTOC({ toc, lang, variant }: BlogTOCProps) {
	const tocItems = toc.map((item) => ({
		title: item.text,
		url: `#${item.id}`,
		depth: item.depth,
	}));

	if (tocItems.length === 0) return null;

	if (variant === "mobile") {
		return <MobileTOC toc={toc} lang={lang} />;
	}

	return (
		<TOCProvider toc={tocItems}>
			<div className="flex flex-col gap-3">
				<h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white pl-4">
					{lang === "en" ? "On this page" : "Nesta pagina"}
				</h3>
				<TOCScrollArea className="relative">
					<ClerkTOCItems />
				</TOCScrollArea>
			</div>
		</TOCProvider>
	);
}

function MobileTOC({ toc, lang }: { toc: TOCItem[]; lang: "en" | "pt" }) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeId, setActiveId] = useState<string>("");
	const isManualScrolling = useRef(false);

	// Active heading tracking via IntersectionObserver
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (isManualScrolling.current) return;
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id);
					}
				}
			},
			{ rootMargin: "0% 0% -80% 0%" },
		);

		const headings = document.querySelectorAll("h1, h2, h3");
		headings.forEach((heading) => observer.observe(heading));

		// Detect bottom of page to activate last heading
		const handleScroll = () => {
			if (isManualScrolling.current) return;
			if (
				window.innerHeight + window.scrollY >=
				document.documentElement.scrollHeight - 10
			) {
				if (headings.length > 0) {
					setActiveId(headings[headings.length - 1].id);
				}
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			observer.disconnect();
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLAnchorElement>, headingId: string) => {
			e.preventDefault();

			// 1. Close menu first to stabilize layout
			setIsOpen(false);

			// 2. Set manual scrolling flag
			isManualScrolling.current = true;
			setActiveId(headingId);

			// 3. Wait for layout update/render then scroll
			setTimeout(() => {
				const element = document.getElementById(headingId);
				if (element) {
					const offset = 380; // Mobile offset (matches original sweet spot)
					const bodyRect = document.body.getBoundingClientRect().top;
					const elementRect = element.getBoundingClientRect().top;
					const elementPosition = elementRect - bodyRect;
					const offsetPosition = elementPosition - offset;

					window.scrollTo({
						top: offsetPosition,
						behavior: "smooth",
					});
				}

				// 4. Release lock after animation
				setTimeout(() => {
					isManualScrolling.current = false;
				}, 1500);
			}, 10);
		},
		[],
	);

	return (
		<div className="lg:hidden border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50 overflow-hidden">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between p-4 text-left font-medium text-zinc-900 dark:text-white"
			>
				<span className="uppercase tracking-wider text-sm font-bold">
					{lang === "en" ? "Table of Contents" : "Índice"}
				</span>
				<ChevronRight
					size={16}
					className={`transition-transform duration-200 text-zinc-500 ${isOpen ? "rotate-90" : ""}`}
				/>
			</button>
			<div
				className={`border-t border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out overflow-hidden ${
					isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<nav className="flex flex-col p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900/30 overflow-y-auto max-h-96">
					{toc.map((heading) => (
						<a
							key={heading.id}
							href={`#${heading.id}`}
							className={`block text-sm transition-colors border-l-2 pl-3 -ml-[1px] ${
								activeId === heading.id
									? "border-emerald-500 text-emerald-500 font-medium"
									: "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
							}`}
							style={{
								marginLeft: heading.depth === 3 ? "1rem" : "0",
							}}
							onClick={(e) => handleClick(e, heading.id)}
						>
							{heading.text}
						</a>
					))}
				</nav>
			</div>
		</div>
	);
}
