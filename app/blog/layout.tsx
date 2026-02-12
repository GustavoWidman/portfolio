import { Suspense, type ReactNode } from "react";
import BlogLayoutClient from "@/components/blog/BlogLayoutClient";

export default function BlogLayout({ children }: { children: ReactNode }) {
	return (
		<Suspense>
			<BlogLayoutClient>{children}</BlogLayoutClient>
		</Suspense>
	);
}
