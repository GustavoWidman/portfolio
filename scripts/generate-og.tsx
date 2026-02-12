import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import React from "react";

// Use Inter font for the image
const fontPath = path.resolve("node_modules/@fontsource/inter/files/inter-latin-700-normal.woff");
const fontMonoPath = path.resolve("node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff");

async function generateOG() {
  const postsDir = path.resolve("posts");
  const publicOgDir = path.resolve("public/og");
  const distOgDir = path.resolve("dist/og"); // Add dist/og output
  const fontData = await fs.readFile(fontPath);
  const fontMonoData = await fs.readFile(fontMonoPath);

  // Ensure output directory exists
  await fs.mkdir(publicOgDir, { recursive: true });
  await fs.mkdir(distOgDir, { recursive: true }); // Ensure dist/og exists

  // Find all markdown files manually since we are in a script context
  // We can't use import.meta.glob here easily without Vite
  const readDirRecursive = async (dir: string): Promise<string[]> => {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const paths: string[] = [];
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        paths.push(...(await readDirRecursive(fullPath)));
      } else if (file.name.endsWith(".md")) {
        paths.push(fullPath);
      }
    }
    return paths;
  };

  const files = await readDirRecursive(postsDir);

  console.log(`Found ${files.length} posts. Generating OG images...`);

  for (const filePath of files) {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data } = matter(fileContent);
    
    // Determine slug and lang from path structure: posts/slug/lang.md
    const pathParts = filePath.split(path.sep);
    const filename = pathParts.pop() || "";
    const slug = pathParts.pop() || "";
    const lang = filename.replace(".md", "");

    if (!slug || (lang !== "en" && lang !== "pt")) continue;

    const title = data.title || "Blog Post";
    const date = data.date ? new Date(data.date).toLocaleDateString(lang === "en" ? "en-US" : "pt-BR", { year: 'numeric', month: 'long', day: 'numeric' }) : "";
    const tags = Array.isArray(data.tags) ? data.tags.slice(0, 3) : [];

    // Create the image
    const svg = await satori(
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
        {/* Background Grid Pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
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

        <div style={{ display: "flex", flexDirection: "column", zIndex: 1, gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            <span style={{ display: "flex", fontSize: "24px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "2px" }}>
              Gustavo Widman
            </span>
          </div>

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
            {title}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", zIndex: 1 }}>
          <div style={{ display: "flex", gap: "16px" }}>
            {tags.map((tag) => (
              <div
                key={tag}
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
                #{tag}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <span style={{ display: "flex", fontSize: "24px", color: "#a1a1aa", fontFamily: "JetBrains Mono" }}>
              {date}
            </span>
            <span style={{ display: "flex", fontSize: "20px", color: "#52525b" }}>
              {lang.toUpperCase()} • BLOG
            </span>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: fontData,
            weight: 700,
            style: "normal",
          },
          {
            name: "JetBrains Mono",
            data: fontMonoData,
            weight: 500,
            style: "normal",
          },
        ],
      }
    );

    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Filename: slug-lang.png (e.g., my-first-post-en.png)
    // This makes it easy to reference
    const outName = `${slug}-${lang}.png`;
    await fs.writeFile(path.join(publicOgDir, outName), pngBuffer);
    await fs.writeFile(path.join(distOgDir, outName), pngBuffer);
    console.log(`Generated: ${outName}`);
  }

  // Generate generic Blog Index OG (English default)
  console.log("Generating Blog Index OG...");
  const blogSvg = await satori(
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
        {/* Background Grid Pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
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

        <div style={{ display: "flex", flexDirection: "column", zIndex: 1, gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            <span style={{ display: "flex", fontSize: "24px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "2px" }}>
              Gustavo Widman
            </span>
          </div>

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
            Blog
          </h1>
          <p style={{ fontSize: "32px", color: "#a1a1aa", margin: 0, maxWidth: "800px", display: "flex" }}>
            Thoughts on Systems Engineering, NixOS, and Cybersecurity.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", zIndex: 1 }}>
          <div style={{ display: "flex", gap: "16px" }}>
             {["Engineering", "Systems", "NixOS"].map((tag) => (
              <div
                key={tag}
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
                #{tag}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <span style={{ display: "flex", fontSize: "20px", color: "#52525b" }}>
              INDEX
            </span>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "Inter", data: fontData, weight: 700, style: "normal" },
          { name: "JetBrains Mono", data: fontMonoData, weight: 500, style: "normal" },
        ],
      }
  );

  const blogPng = new Resvg(blogSvg).render().asPng();
  await fs.writeFile(path.join(publicOgDir, "blog-index.png"), blogPng);
  await fs.writeFile(path.join(distOgDir, "blog-index.png"), blogPng);
  console.log("Generated: blog-index.png");
}

// Post-process HTML generation to inject meta tags into static files
// This assumes 'vite build' has run and dist/ exists
async function generateStaticHTML() {
  const distDir = path.resolve("dist");
  const postsDir = path.resolve("posts");
  const indexHtmlPath = path.join(distDir, "index.html");

  try {
    await fs.access(indexHtmlPath);
  } catch {
    console.log("dist/index.html not found. Skipping HTML generation (run this after build).");
    return;
  }

  const template = await fs.readFile(indexHtmlPath, "utf-8");

  // Read posts again
  const readDirRecursive = async (dir: string): Promise<string[]> => {
    const files = await fs.readdir(dir, { withFileTypes: true });
    const paths: string[] = [];
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        paths.push(...(await readDirRecursive(fullPath)));
      } else if (file.name.endsWith(".md")) {
        paths.push(fullPath);
      }
    }
    return paths;
  };

  const files = await readDirRecursive(postsDir);
  console.log(`Injecting metadata into static HTML for ${files.length} posts...`);

  for (const filePath of files) {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    
    const pathParts = filePath.split(path.sep);
    const filename = pathParts.pop() || "";
    const slug = pathParts.pop() || "";
    const lang = filename.replace(".md", "");

    if (!slug || (lang !== "en" && lang !== "pt")) continue;

    const title = data.title || "Blog Post";
    const excerpt = data.excerpt || content.slice(0, 150).replace(/\n/g, " ") + "...";
    const imagePath = `/og/${slug}-${lang}.png`;

    let html = template
      .replace(/<title>.*?<\/title>/s, "")
      .replace(/<meta\s+name="description".*?>/s, "")
      .replace(/<meta\s+property="og:title".*?>/s, "")
      .replace(/<meta\s+property="og:description".*?>/s, "")
      .replace(/<meta\s+property="og:image".*?>/s, "")
      .replace(/<meta\s+property="og:type".*?>/s, "")
      .replace(/<meta\s+name="twitter:card".*?>/s, "")
      .replace(/<meta\s+name="twitter:title".*?>/s, "")
      .replace(/<meta\s+name="twitter:description".*?>/s, "")
      .replace(/<meta\s+property="twitter:image".*?>/s, "")
      .replace(/<meta\s+name="twitter:image".*?>/s, "");

    const metaTags = `
      <title>${title} | Gustavo Widman</title>
      <meta name="description" content="${excerpt}" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${excerpt}" />
      <meta property="og:image" content="${imagePath}" />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${excerpt}" />
      <meta name="twitter:image" content="${imagePath}" />
    `;
    
    const htmlWithMeta = html.replace("</head>", `${metaTags}</head>`);
    
    // 1. Main Domain Structure: dist/blog/slug/index.html
    const folderPathMain = path.join(distDir, "blog", slug);
    await fs.mkdir(folderPathMain, { recursive: true });
    await fs.writeFile(path.join(folderPathMain, "index.html"), htmlWithMeta);
    console.log(`Generated HTML: dist/blog/${slug}/index.html`);

    // 2. Subdomain Structure: dist/slug/index.html
    const folderPathSub = path.join(distDir, slug);
    await fs.mkdir(folderPathSub, { recursive: true });
    await fs.writeFile(path.join(folderPathSub, "index.html"), htmlWithMeta);
    console.log(`Generated HTML: dist/${slug}/index.html`);
  }

  // 3. Blog Index Static HTML
  const blogTitle = "Blog | Gustavo Widman";
  const blogExcerpt = "Thoughts on Systems Engineering, NixOS, and Cybersecurity.";
  const blogImagePath = "/og/blog-index.png";

  let blogHtml = template
    .replace(/<title>.*?<\/title>/s, "")
    .replace(/<meta\s+name="description".*?>/s, "")
    .replace(/<meta\s+property="og:title".*?>/s, "")
    .replace(/<meta\s+property="og:description".*?>/s, "")
    .replace(/<meta\s+property="og:image".*?>/s, "")
    .replace(/<meta\s+property="og:type".*?>/s, "")
    .replace(/<meta\s+name="twitter:card".*?>/s, "")
    .replace(/<meta\s+name="twitter:title".*?>/s, "")
    .replace(/<meta\s+name="twitter:description".*?>/s, "")
    .replace(/<meta\s+property="twitter:image".*?>/s, "")
    .replace(/<meta\s+name="twitter:image".*?>/s, "");

  const blogMetaTags = `
    <title>${blogTitle}</title>
    <meta name="description" content="${blogExcerpt}" />
    <meta property="og:title" content="${blogTitle}" />
    <meta property="og:description" content="${blogExcerpt}" />
    <meta property="og:image" content="${blogImagePath}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${blogTitle}" />
    <meta name="twitter:description" content="${blogExcerpt}" />
    <meta name="twitter:image" content="${blogImagePath}" />
  `;

  const blogHtmlWithMeta = blogHtml.replace("</head>", `${blogMetaTags}</head>`);
  
  const blogIndexPath = path.join(distDir, "blog");
  await fs.mkdir(blogIndexPath, { recursive: true });
  await fs.writeFile(path.join(blogIndexPath, "index.html"), blogHtmlWithMeta);
  console.log("Generated HTML: dist/blog/index.html");
}

// Run
(async () => {
  try {
    await generateOG();
    // Check if we should run HTML generation (argument --html)
    if (process.argv.includes("--html")) {
      await generateStaticHTML();
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
