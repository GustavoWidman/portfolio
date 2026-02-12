import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const OUT_DIR = path.resolve("out");
const CONTENT_DIR = path.resolve("content/blog");

// Metadata for static pages (non-blog-post)
const PAGE_META: Record<
	string,
	{ pt: { title: string; description: string }; ogPrefix: string }
> = {
	"index.html": {
		pt: {
			title: "Portfolio de Gustavo Widman",
			description:
				"Engenheiro Backend especializado em programacao de sistemas, infraestrutura NixOS e ciberseguranca.",
		},
		ogPrefix: "portfolio",
	},
	"blog.html": {
		pt: {
			title: "Blog | Gustavo Widman",
			description:
				"Uma colecao de artigos sobre programacao de sistemas, infraestrutura NixOS e pesquisa em ciberseguranca.",
		},
		ogPrefix: "blog-index",
	},
};

function stripLocalhostPrefix(html: string): string {
	// Next.js without metadataBase resolves OG URLs to http://localhost:3000/...
	// Strip that prefix to make them relative paths
	return html.replace(/http:\/\/localhost:3000\//g, "/");
}

function replaceOgImage(html: string, from: string, to: string): string {
	return html.split(from).join(to);
}

function replaceMetaContent(
	html: string,
	property: string,
	newContent: string,
): string {
	// Matches both property="..." and name="..." meta tags
	// e.g. <meta property="og:title" content="..."/>
	// e.g. <meta name="twitter:title" content="..."/>
	const propRegex = new RegExp(
		`(<meta\\s+property="${property}"\\s+content=")([^"]*)("/>)`,
		"g",
	);
	const nameRegex = new RegExp(
		`(<meta\\s+name="${property}"\\s+content=")([^"]*)("/>)`,
		"g",
	);
	html = html.replace(propRegex, `$1${escapeHtml(newContent)}$3`);
	html = html.replace(nameRegex, `$1${escapeHtml(newContent)}$3`);
	return html;
}

function replaceTitle(html: string, newTitle: string): string {
	return html.replace(
		/<title>([^<]*)<\/title>/,
		`<title>${escapeHtml(newTitle)}</title>`,
	);
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

async function processStaticPages() {
	for (const [filename, meta] of Object.entries(PAGE_META)) {
		const filePath = path.join(OUT_DIR, filename);

		try {
			await fs.access(filePath);
		} catch {
			console.log(`  Skipping ${filename} (not found)`);
			continue;
		}

		let html = await fs.readFile(filePath, "utf-8");

		// Fix localhost prefix in the original English file
		html = stripLocalhostPrefix(html);
		await fs.writeFile(filePath, html);
		console.log(`  Fixed: ${filename} (stripped localhost)`);

		// Generate PT variant
		let ptHtml = html;
		ptHtml = replaceOgImage(
			ptHtml,
			`/og/${meta.ogPrefix}-en.png`,
			`/og/${meta.ogPrefix}-pt.png`,
		);
		ptHtml = replaceTitle(ptHtml, meta.pt.title);
		ptHtml = replaceMetaContent(ptHtml, "description", meta.pt.description);
		ptHtml = replaceMetaContent(ptHtml, "og:title", meta.pt.title);
		ptHtml = replaceMetaContent(ptHtml, "og:description", meta.pt.description);
		ptHtml = replaceMetaContent(ptHtml, "og:locale", "pt_BR");
		ptHtml = replaceMetaContent(ptHtml, "twitter:title", meta.pt.title);
		ptHtml = replaceMetaContent(
			ptHtml,
			"twitter:description",
			meta.pt.description,
		);

		// Write pt.html next to the original
		// index.html -> pt.html, blog.html -> blog/pt.html
		let ptPath: string;
		if (filename === "index.html") {
			ptPath = path.join(OUT_DIR, "pt.html");
		} else {
			// blog.html -> blog/pt.html
			const base = filename.replace(".html", "");
			ptPath = path.join(OUT_DIR, base, "pt.html");
		}

		await fs.mkdir(path.dirname(ptPath), { recursive: true });
		await fs.writeFile(ptPath, ptHtml);
		console.log(`  Generated: ${path.relative(OUT_DIR, ptPath)}`);
	}
}

async function processBlogPosts() {
	const slugDirs = await fs.readdir(CONTENT_DIR, { withFileTypes: true });

	for (const dir of slugDirs) {
		if (!dir.isDirectory()) continue;
		const slug = dir.name;

		// Read PT frontmatter for this post
		const ptMdxPath = path.join(CONTENT_DIR, slug, "pt.mdx");
		let ptTitle: string | null = null;
		let ptExcerpt: string | null = null;

		try {
			const ptContent = await fs.readFile(ptMdxPath, "utf-8");
			const { data } = matter(ptContent);
			ptTitle = data.title || null;
			ptExcerpt = data.excerpt || null;
		} catch {
			// No PT version, try .md
			try {
				const ptMdPath = path.join(CONTENT_DIR, slug, "pt.md");
				const ptContent = await fs.readFile(ptMdPath, "utf-8");
				const { data } = matter(ptContent);
				ptTitle = data.title || null;
				ptExcerpt = data.excerpt || null;
			} catch {
				console.log(`  Skipping ${slug} (no PT content)`);
				continue;
			}
		}

		// Find the English HTML file
		const htmlPath = path.join(OUT_DIR, "blog", `${slug}.html`);
		try {
			await fs.access(htmlPath);
		} catch {
			console.log(`  Skipping ${slug} (no HTML at blog/${slug}.html)`);
			continue;
		}

		let html = await fs.readFile(htmlPath, "utf-8");

		// Fix localhost prefix in the original English file
		html = stripLocalhostPrefix(html);
		await fs.writeFile(htmlPath, html);
		console.log(`  Fixed: blog/${slug}.html (stripped localhost)`);

		// Generate PT variant
		let ptHtml = html;
		ptHtml = replaceOgImage(
			ptHtml,
			`/og/${slug}-en.png`,
			`/og/${slug}-pt.png`,
		);

		if (ptTitle) {
			const ptFullTitle = `${ptTitle} | Gustavo Widman`;
			ptHtml = replaceTitle(ptHtml, ptFullTitle);
			ptHtml = replaceMetaContent(ptHtml, "og:title", ptTitle);
			ptHtml = replaceMetaContent(ptHtml, "twitter:title", ptTitle);
		}
		if (ptExcerpt) {
			ptHtml = replaceMetaContent(ptHtml, "description", ptExcerpt);
			ptHtml = replaceMetaContent(ptHtml, "og:description", ptExcerpt);
			ptHtml = replaceMetaContent(ptHtml, "twitter:description", ptExcerpt);
		}

		// Write to blog/slug/pt.html
		const ptDir = path.join(OUT_DIR, "blog", slug);
		await fs.mkdir(ptDir, { recursive: true });
		await fs.writeFile(path.join(ptDir, "pt.html"), ptHtml);
		console.log(`  Generated: blog/${slug}/pt.html`);
	}
}

async function main() {
	console.log("Post-processing HTML for locale variants...");

	console.log("\nStatic pages:");
	await processStaticPages();

	console.log("\nBlog posts:");
	await processBlogPosts();

	// Also fix localhost in 404.html
	const notFoundPath = path.join(OUT_DIR, "404.html");
	try {
		let html = await fs.readFile(notFoundPath, "utf-8");
		html = stripLocalhostPrefix(html);
		await fs.writeFile(notFoundPath, html);
		console.log("\nFixed: 404.html (stripped localhost)");
	} catch {
		// No 404.html, fine
	}

	console.log("\nDone!");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
