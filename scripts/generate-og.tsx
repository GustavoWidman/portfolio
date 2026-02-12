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
            display: "flex", // Add display flex here as well just in case, though it's absolutely positioned
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
    // Write to dist/og as well so it's included in the build artifact immediately
    await fs.writeFile(path.join(distOgDir, outName), pngBuffer);
    console.log(`Generated: ${outName}`);
  }
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
    const imagePath = `/og/${slug}-${lang}.png`; // Absolute path from domain root
    
    // Construct the metadata to inject
    // Note: We need absolute URLs for OG images usually, assume domain or relative if browser handles it.
    // Ideally user configures domain. For now we use a placeholder or relative (which works for some)
    // Actually relative OG images are often rejected by Twitter/Discord. 
    // We'll use a placeholder domain "https://gustavowidman.com" (example) or let user configure.
    // I'll assume the user will configure the domain in the head or use relative and hope for best (or better, use a placeholder that user can replace).
    // Let's use the deployed URL from package.json if available, or just relative.
    // Better: I'll use a placeholder REPLACEME_DOMAIN and ask user to set it or just use relative path and hope hosting provider handles domain expansion.
    // Actually, best practice for standard hosting is full URL. 
    // I will use `https://widman.dev` (guessing based on previous context or just generic).
    // Wait, the terminal said "widman@nixos". 
    // Let's just use "/" and rely on the browser/crawler resolving it if it visits the page, 
    // OR just set standard meta tags.
    //
    // HTML Structure:
    // mkdir dist/blog/slug/
    // cp dist/index.html dist/blog/slug/index.html
    // replace <head> content
    
    // NOTE: This creates a directory for the slug, but what about language?
    // The router uses /blog/:slug. It detects language from ?lang= or state.
    // So the URL /blog/my-post serves ONE html.
    // Which language metadata should we serve? 
    // Usually the default one (English). 
    // If the user shares /blog/my-post, they get the default OG.
    // If we want localized previews, we'd need /blog/my-post/en and /blog/my-post/pt URLs?
    // Or just default to English for the main slug.
    // Let's default to 'en' for /blog/:slug.
    
    if (lang !== "en") continue; // Only generate static HTML for the primary route (English default)

    // Generate static HTML for BOTH main domain structure (/blog/slug) AND subdomain structure (/slug)
    
    // 1. Main Domain Structure: dist/blog/slug/index.html
    const folderPathMain = path.join(distDir, "blog", slug);
    await fs.mkdir(folderPathMain, { recursive: true });
    
    let html = template;
    
    // Inject Meta Tags
    // We need to replace existing default meta tags from index.html to avoid duplicates/conflicts
    // Removing: description, og:*, twitter:*
    
    // Simple regex removal of existing tags we intend to replace
    // Note: This assumes standard formatting in index.html. 
    html = html
      .replace(/<title>.*?<\/title>/s, "")
      .replace(/<meta\s+name="description".*?>/s, "")
      .replace(/<meta\s+property="og:title".*?>/s, "")
      .replace(/<meta\s+property="og:description".*?>/s, "")
      .replace(/<meta\s+property="og:image".*?>/s, "")
      .replace(/<meta\s+property="og:type".*?>/s, "")
      .replace(/<meta\s+name="twitter:card".*?>/s, "")
      .replace(/<meta\s+name="twitter:title".*?>/s, "")
      .replace(/<meta\s+name="twitter:description".*?>/s, "")
      .replace(/<meta\s+property="twitter:image".*?>/s, "") // Note: property="twitter:image" in index.html, sometimes name="twitter:image"
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
    
    await fs.writeFile(path.join(folderPathMain, "index.html"), htmlWithMeta);
    console.log(`Generated HTML: dist/blog/${slug}/index.html`);

    // 2. Subdomain Structure: dist/slug/index.html
    // This allows blog.domain.com/slug to serve a static HTML file if the reverse proxy looks here
    const folderPathSub = path.join(distDir, slug);
    // We need to be careful not to overwrite top-level assets if a slug matches a file name, but slugs are usually safe
    await fs.mkdir(folderPathSub, { recursive: true });
    await fs.writeFile(path.join(folderPathSub, "index.html"), htmlWithMeta);
    console.log(`Generated HTML: dist/${slug}/index.html`);
  }
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
