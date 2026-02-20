import type { Metadata } from "next";
import { detectLanguage, shouldSkipIntro } from "@/lib/language-server";
import { HomeClient } from "@/components/portfolio";

const SITE_URL = "https://guswid.com";

export const metadata: Metadata = {
  title: "Gustavo Widman | Backend Engineer",
  description:
    "Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity. Personal portfolio showcasing projects, experience, and technical blog.",
  keywords: [
    "Gustavo Widman",
    "guswid",
    "r3dlust",
    "Backend Engineer",
    "Systems Programming",
    "NixOS",
    "Rust",
    "Cybersecurity",
    "Portfolio",
  ],
  authors: [{ name: "Gustavo Widman", url: SITE_URL }],
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: SITE_URL,
      pt: SITE_URL,
    },
  },
  openGraph: {
    title: "Gustavo Widman | Backend Engineer",
    description:
      "Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity.",
    type: "website",
    url: SITE_URL,
    siteName: "Gustavo Widman",
    images: [
      {
        url: "/og/portfolio-en.png",
        width: 1200,
        height: 630,
        alt: "Gustavo Widman - Backend Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gustavo Widman | Backend Engineer",
    description:
      "Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity.",
    images: ["/og/portfolio-en.png"],
    creator: "@guswid",
  },
};

interface HomePageProps {
  searchParams: Promise<{ lang?: string; intro?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const [serverLang, skipIntro] = await Promise.all([
    detectLanguage(),
    shouldSkipIntro(params.intro),
  ]);

  return <HomeClient lang={serverLang} skipIntro={skipIntro} />;
}
