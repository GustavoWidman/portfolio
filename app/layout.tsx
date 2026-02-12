import { RootProvider } from "fumadocs-ui/provider/next";
import { JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
});

export const metadata = {
	title: {
		default: "Gustavo Widman's Portfolio",
		template: "%s | Gustavo Widman",
	},
	description:
		"Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity. Explore my projects, experience, and tech stack.",
	keywords: [
		"portfolio",
		"backend engineer",
		"systems programming",
		"NixOS",
		"cybersecurity",
		"rust",
		"python",
		"golang",
	],
	authors: [{ name: "Gustavo Widman" }],
	creator: "Gustavo Widman",
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: "Gustavo Widman",
		title: "Gustavo Widman's Portfolio | Backend and Low Level Engineer",
		description:
			"Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity.",
		images: [
			{
				url: "/og/portfolio-en.png",
				width: 1200,
				height: 630,
				alt: "Gustavo Widman Portfolio",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Gustavo Widman's Portfolio | Backend and Low Level Engineer",
		description:
			"Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity.",
		images: ["/og/portfolio-en.png"],
	},
	icons: {
		icon: "/favicon.svg",
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${jetbrainsMono.variable}`}
			suppressHydrationWarning
		>
			<body className="font-sans">
				<RootProvider search={{ enabled: false }} theme={{ defaultTheme: "dark", enableSystem: false }}>
					{children}
				</RootProvider>
			</body>
		</html>
	);
}
