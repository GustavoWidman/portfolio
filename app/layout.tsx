import { RootProvider } from "fumadocs-ui/provider/next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { JsonLd, personSchema, websiteSchema } from "@/components/shared/JsonLd";
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

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Gustavo Widman | Backend Engineer & Systems Programmer",
    template: "%s | Gustavo Widman",
  },
  description:
    "Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity. Explore my projects, experience, and technical blog.",
  keywords: [
    "guswid",
    "gustavo widman",
    "r3dlust",
    "portfolio",
    "backend engineer",
    "systems programming",
    "NixOS",
    "cybersecurity",
    "rust",
    "python",
    "golang",
    "reverse engineering",
    "low level programming",
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
    title: "Gustavo Widman | Backend Engineer & Systems Programmer",
    description:
      "Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity.",
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
    title: "Gustavo Widman | Backend Engineer & Systems Programmer",
    description:
      "Backend Engineer specializing in systems programming, NixOS infrastructure, and cybersecurity.",
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
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <JsonLd data={personSchema} />
        <JsonLd data={websiteSchema} />
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
