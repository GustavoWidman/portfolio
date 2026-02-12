"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";

interface SearchTriggerProps {
	placeholder?: string;
}

export function SearchTrigger({
	placeholder = "Search articles...",
}: SearchTriggerProps) {
	const { setOpenSearch, enabled } = useSearchContext();

	if (!enabled) {
		return null;
	}

	return (
		<button
			type="button"
			onClick={() => setOpenSearch(true)}
			className="relative w-full group flex items-center"
		>
			<div className="absolute left-3 text-zinc-400 group-hover:text-emerald-500 transition-colors z-10">
				<Search size={18} />
			</div>
			<div className="w-full pl-9 pr-16 py-2 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-full text-left text-sm text-zinc-500 dark:text-zinc-500 shadow-sm backdrop-blur-sm group-hover:border-emerald-500/50 group-hover:ring-2 group-hover:ring-emerald-500/10 transition-all">
				{placeholder}
			</div>
			<div className="absolute right-3 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
				<kbd className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 font-sans shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
					⌘
				</kbd>
				<kbd className="flex h-5 w-5 items-center justify-center rounded-[6px] border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 font-sans shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
					K
				</kbd>
			</div>
		</button>
	);
}
