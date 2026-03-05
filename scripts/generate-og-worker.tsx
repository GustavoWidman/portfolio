import fs from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import React from "react";

declare const self: {
  onmessage: ((e: { data: unknown }) => void) | null;
  postMessage(data: unknown): void;
};

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const fontPath = path.resolve("node_modules/@fontsource/inter/files/inter-latin-700-normal.woff");
const fontMonoPath = path.resolve(
  "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff",
);

type OGTask =
  | { type: "portfolio"; lang: "en" | "pt"; outDir: string; taskId: string }
  | { type: "blogIndex"; lang: "en" | "pt"; outDir: string; taskId: string }
  | {
      type: "blogPost";
      slug: string;
      lang: "en" | "pt";
      title: string;
      date: string;
      tags: string[];
      outDir: string;
      taskId: string;
    };

type WorkerMessage = OGTask | { type: "shutdown" };

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

async function init() {
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

  self.postMessage({ type: "ready" });

  self.onmessage = async (e: { data: unknown }) => {
    const msg = e.data as WorkerMessage;
    if (msg.type === "shutdown") {
      process.exit(0);
    }

    const task = msg;
    const start = Date.now();
    let element: React.ReactElement;
    let filename: string;

    switch (task.type) {
      case "portfolio":
        element = <PortfolioOG lang={task.lang} />;
        filename = `portfolio-${task.lang}.png`;
        break;
      case "blogIndex":
        element = <BlogIndexOG lang={task.lang} />;
        filename = `blog-index-${task.lang}.png`;
        break;
      case "blogPost":
        element = (
          <BlogPostOG
            title={task.title}
            date={task.date}
            tags={task.tags}
            lang={task.lang}
          />
        );
        filename = `${task.slug}-${task.lang}.png`;
        break;
    }

    const png = await renderToPng(element, fonts);
    await writePng(task.outDir, filename, png);

    self.postMessage({
      taskId: task.taskId,
      name: filename,
      duration: Date.now() - start,
    });
  };
}

init().catch((e) => {
  console.error(`Worker init error:`, e);
  process.exit(1);
});
