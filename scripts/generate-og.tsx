import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import React from "react";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const fontPath = path.resolve("node_modules/@fontsource/inter/files/inter-latin-700-normal.woff");
const fontMonoPath = path.resolve(
  "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff",
);

const cyan = "\x1b[36m";
const green = "\x1b[32m";
const magenta = "\x1b[35m";
const bold = "\x1b[1m";
const italic = "\x1b[3m";
const reset = "\x1b[0m";

function logHeader() {
  console.log(`\n${bold}${cyan}generate-og.tsx${reset}\n`);
}

function logItem(name: string, isLastSection: boolean, isLastItem: boolean, duration: number) {
  const prefix = isLastSection ? " " : "│";
  const branch = isLastItem ? "└" : "├";
  const formattedName = `${italic}${magenta}${name}${reset}`;
  const timing = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;
  console.log(
    `${prefix} ${branch} ${green}✓${reset} Generated: ${formattedName} ${bold}(${timing})${reset}`,
  );
}

// Shared background elements used by all OG images
function Background() {
  return (
    <>
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
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(8px)",
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
}

// --- Main ---

async function main() {
  const outDir = path.resolve("public/og");
  await fs.mkdir(outDir, { recursive: true });

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

  logHeader();

  const portfolioItems = ["en", "pt"] as const;
  const blogIndexItems = ["en", "pt"] as const;

  console.log(`├ Portfolio OG Images...`);
  for (let i = 0; i < portfolioItems.length; i++) {
    const lang = portfolioItems[i];
    const start = Date.now();
    const png = await renderToPng(<PortfolioOG lang={lang} />, fonts);
    const name = `portfolio-${lang}.png`;
    await writePng(outDir, name, png);
    logItem(name, false, i === portfolioItems.length - 1, Date.now() - start);
  }

  console.log(`├ Blog Index OG Images...`);
  for (let i = 0; i < blogIndexItems.length; i++) {
    const lang = blogIndexItems[i];
    const start = Date.now();
    const png = await renderToPng(<BlogIndexOG lang={lang} />, fonts);
    const name = `blog-index-${lang}.png`;
    await writePng(outDir, name, png);
    logItem(name, false, i === blogIndexItems.length - 1, Date.now() - start);
  }

  console.log(`└ Blog Post OG Images...`);
  const contentDir = path.resolve("blog");
  const slugDirs = await fs.readdir(contentDir, { withFileTypes: true });
  const posts: { slug: string; lang: string; title: string; date: string; tags: string[] }[] = [];

  for (const dir of slugDirs) {
    if (!dir.isDirectory()) continue;
    const slug = dir.name;
    const slugDir = path.join(contentDir, slug);
    const files = await fs.readdir(slugDir);

    for (const file of files) {
      if (!file.endsWith(".mdx") && !file.endsWith(".md")) continue;
      const lang = file.replace(/\.mdx?$/, "");
      if (lang !== "en" && lang !== "pt") continue;

      const content = await fs.readFile(path.join(slugDir, file), "utf-8");
      const { data } = matter(content);

      posts.push({
        slug,
        lang,
        title: data.title || "Blog Post",
        date: data.date ? new Date(data.date).toISOString().split("T")[0] : "",
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
    }
  }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const start = Date.now();
    const png = await renderToPng(
      <BlogPostOG
        title={post.title}
        date={post.date}
        tags={post.tags}
        lang={post.lang as "en" | "pt"}
      />,
      fonts,
    );
    const name = `${post.slug}-${post.lang}.png`;
    await writePng(outDir, name, png);
    logItem(name, true, i === posts.length - 1, Date.now() - start);
  }

  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
