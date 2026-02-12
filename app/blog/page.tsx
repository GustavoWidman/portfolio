import { Suspense } from "react";
import { getBlogPostSummaries } from "@/lib/source";
import BlogListingClient from "@/components/blog/BlogListingClient";

export const metadata = {
	title: "Blog",
	description:
		"A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research.",
	openGraph: {
		title: "Blog | Gustavo Widman",
		description:
			"A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research.",
		type: "website",
		images: [
			{
				url: "/og/blog-index-en.png",
				width: 1200,
				height: 630,
				alt: "Gustavo Widman Blog",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Blog | Gustavo Widman",
		description:
			"A collection of articles on systems programming, NixOS infrastructure, and cybersecurity research.",
		images: ["/og/blog-index-en.png"],
	},
};

export default function BlogPage() {
	const posts = getBlogPostSummaries();

	return (
		<Suspense>
			<BlogListingClient posts={posts} />
		</Suspense>
	);
}
