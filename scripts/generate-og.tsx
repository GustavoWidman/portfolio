import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import React from "react";

const fontPath = path.resolve("node_modules/@fontsource/inter/files/inter-latin-700-normal.woff");
const fontMonoPath = path.resolve(
  "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff",
);

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// Shared background elements used by all OG images
function Background() {
  return (
    <>
      {/* Grid Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.2,
          zIndex: 0,
          display: "flex",
        }}
      />
      {/* Glow Effect */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(40px)",
          zIndex: 0,
          display: "flex",
        }}
      />
    </>
  );
}

// Author badge used at the top of every OG image
function AuthorBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: "#10b981",
        }}
      />
      <span
        style={{
          display: "flex",
          fontSize: "24px",
          color: "#a1a1aa",
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}
      >
        Gustavo Widman
      </span>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "8px 16px",
        backgroundColor: "#18181b",
        border: "1px solid #27272a",
        borderRadius: "8px",
        fontSize: "20px",
        color: "#e4e4e7",
        fontFamily: "JetBrains Mono",
      }}
    >
      #{label}
    </div>
  );
}

function GradientTitle({ children }: { children: string }) {
  return (
    <h1
      style={{
        display: "flex",
        fontSize: "72px",
        fontWeight: 700,
        margin: 0,
        lineHeight: 1.1,
        background: "linear-gradient(to bottom right, #ffffff, #d4d4d8)",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </h1>
  );
}

// Wrapper for all OG images
function OGLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        backgroundColor: "#09090b",
        padding: "80px",
        color: "white",
        fontFamily: "Inter",
        position: "relative",
      }}
    >
      <Background />
      {children}
    </div>
  );
}

// --- Portfolio OG ---
function PortfolioOG({ lang }: { lang: "en" | "pt" }) {
  const title = lang === "en" ? "Backend & Low Level Engineer" : "Engenheiro Backend & Low Level";
  const subtitle =
    lang === "en"
      ? "Systems Programming, NixOS, and Cybersecurity."
      : "Programacao de Sistemas, NixOS e Ciberseguranca.";
  const tags = lang === "en" ? ["Rust", "NixOS", "Systems"] : ["Rust", "NixOS", "Sistemas"];

  return (
    <OGLayout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
          gap: "20px",
        }}
      >
        <AuthorBadge />
        <GradientTitle>{title}</GradientTitle>
        <p
          style={{
            fontSize: "32px",
            color: "#a1a1aa",
            margin: 0,
            maxWidth: "800px",
            display: "flex",
          }}
        >
          {subtitle}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          width: "100%",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          {tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "flex",
              fontSize: "20px",
              color: "#52525b",
            }}
          >
            {lang.toUpperCase()} • PORTFOLIO
          </span>
        </div>
      </div>
    </OGLayout>
  );
}

// --- Blog Index OG ---
function BlogIndexOG({ lang }: { lang: "en" | "pt" }) {
  const subtitle =
    lang === "en"
      ? "Thoughts on Systems Engineering, NixOS, and Cybersecurity."
      : "Reflexoes sobre Engenharia de Sistemas, NixOS e Ciberseguranca.";
  const tags =
    lang === "en" ? ["Engineering", "Systems", "NixOS"] : ["Engenharia", "Sistemas", "NixOS"];

  return (
    <OGLayout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
          gap: "20px",
        }}
      >
        <AuthorBadge />
        <GradientTitle>Blog</GradientTitle>
        <p
          style={{
            fontSize: "32px",
            color: "#a1a1aa",
            margin: 0,
            maxWidth: "800px",
            display: "flex",
          }}
        >
          {subtitle}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          width: "100%",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          {tags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "flex",
              fontSize: "20px",
              color: "#52525b",
            }}
          >
            {lang.toUpperCase()} • INDEX
          </span>
        </div>
      </div>
    </OGLayout>
  );
}

// --- Blog Post OG ---
function BlogPostOG({
  title,
  date,
  tags,
  lang,
}: {
  title: string;
  date: string;
  tags: string[];
  lang: "en" | "pt";
}) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const displayTags = tags.slice(0, 3);

  return (
    <OGLayout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
          gap: "20px",
        }}
      >
        <AuthorBadge />
        <GradientTitle>{title}</GradientTitle>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          width: "100%",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          {displayTags.map((tag) => (
            <Tag key={tag} label={tag} />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "flex",
              fontSize: "24px",
              color: "#a1a1aa",
              fontFamily: "JetBrains Mono",
            }}
          >
            {formattedDate}
          </span>
          <span
            style={{
              display: "flex",
              fontSize: "20px",
              color: "#52525b",
            }}
          >
            {lang.toUpperCase()} • BLOG
          </span>
        </div>
      </div>
    </OGLayout>
  );
}

// --- Rendering helpers ---

async function renderToPng(
  element: React.ReactElement,
  fonts: { name: string; data: Buffer; weight: number; style: string }[],
): Promise<Buffer> {
  const svg = await satori(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: fonts as any,
  });
  const resvg = new Resvg(svg);
  return Buffer.from(resvg.render().asPng());
}

async function writePng(outDir: string, name: string, data: Buffer) {
  await fs.writeFile(path.join(outDir, name), data);
  console.log(`  Generated: ${name}`);
}

// --- Main ---

async function main() {
  const outDir = path.resolve("public/og");
  await fs.mkdir(outDir, { recursive: true });

  // Clean old OG images
  const existing = await fs.readdir(outDir);
  for (const file of existing) {
    if (file.endsWith(".png")) {
      await fs.unlink(path.join(outDir, file));
    }
  }

  const fontData = await fs.readFile(fontPath);
  const fontMonoData = await fs.readFile(fontMonoPath);

  const fonts = [
    { name: "Inter", data: fontData, weight: 700, style: "normal" as const },
    {
      name: "JetBrains Mono",
      data: fontMonoData,
      weight: 500,
      style: "normal" as const,
    },
  ];

  // 1. Portfolio OG (pt/en)
  console.log("Generating Portfolio OG images...");
  for (const lang of ["en", "pt"] as const) {
    const png = await renderToPng(<PortfolioOG lang={lang} />, fonts);
    await writePng(outDir, `portfolio-${lang}.png`, png);
  }

  // 2. Blog Index OG (pt/en)
  console.log("Generating Blog Index OG images...");
  for (const lang of ["en", "pt"] as const) {
    const png = await renderToPng(<BlogIndexOG lang={lang} />, fonts);
    await writePng(outDir, `blog-index-${lang}.png`, png);
  }

  // 3. Blog Post OGs
  console.log("Generating Blog Post OG images...");
  const contentDir = path.resolve("blog");
  const slugDirs = await fs.readdir(contentDir, { withFileTypes: true });

  for (const dir of slugDirs) {
    if (!dir.isDirectory()) continue;
    const slug = dir.name;
    const slugDir = path.join(contentDir, slug);
    const files = await fs.readdir(slugDir);

    for (const file of files) {
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue;
      const lang = file.replace(/\.mdx?$/, "") as "en" | "pt";
      if (lang !== "en" && lang !== "pt") continue;

      const content = await fs.readFile(path.join(slugDir, file), "utf-8");
      const { data } = matter(content);

      const title = data.title || "Blog Post";
      const date = data.date ? new Date(data.date).toISOString().split("T")[0] : "";
      const tags = Array.isArray(data.tags) ? data.tags : [];

      const png = await renderToPng(
        <BlogPostOG title={title} date={date} tags={tags} lang={lang} />,
        fonts,
      );
      await writePng(outDir, `${slug}-${lang}.png`, png);
    }
  }

  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
