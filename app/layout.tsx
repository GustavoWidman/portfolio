import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { PersonJsonLd, WebsiteJsonLd } from "@/components/shared/JsonLd";
import "./globals.css";

const jetbrainsMono = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const SITE_URL = "https://guswid.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Gustavo Widman | Systems Programmer",
    template: "%s | Gustavo Widman",
  },
  description:
    "Systems programmer focused on Rust, HPC, low-level software, reproducible infrastructure, and cybersecurity. Explore projects, experience, and technical writing.",
  keywords: [
    "guswid",
    "gustavo widman",
    "r3dlust",
    "portfolio",
    "systems programmer",
    "systems programming",
    "hpc",
    "low level programming",
    "rust",
    "nixos",
    "infrastructure",
    "cybersecurity",
    "performance engineering",
    "software engineer",
  ],
  authors: [{ name: "Gustavo Widman", url: SITE_URL }],
  creator: "Gustavo Widman",
  publisher: "Gustavo Widman",
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: SITE_URL,
      pt: SITE_URL,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["pt_BR"],
    siteName: "Gustavo Widman",
    title: "Gustavo Widman | Systems Programmer",
    description:
      "Systems programmer focused on Rust, HPC, low-level software, reproducible infrastructure, and cybersecurity.",
    url: SITE_URL,
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
    site: "@guswid",
    creator: "@guswid",
    title: "Gustavo Widman | Systems Programmer",
    description:
      "Systems programmer focused on Rust, HPC, low-level software, reproducible infrastructure, and cybersecurity.",
    images: ["/og/portfolio-en.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": 320,
    },
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans">
        <PersonJsonLd />
        <WebsiteJsonLd />
        <RootProvider
          search={{ enabled: false }}
          theme={{ defaultTheme: "dark", enableSystem: false }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
