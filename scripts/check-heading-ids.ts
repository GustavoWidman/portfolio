/**
 * Compares the heading ids of every built post page with `scripts/fixtures/heading-ids.json`
 * (depth, id and text of all h1–h3 headings per slug and language), so anchors stay stable.
 *
 * Reads the newest epoch of the main host tree, where every post is released:
 * `dist/site/<last epoch>/main/<lang>/blog/<slug>/index.html`. Run after `bun run build`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

interface FixtureHeading {
  depth: number;
  id: string;
  text: string;
}

type Fixture = Record<string, Record<string, FixtureHeading[]>>;

const root = fileURLToPath(new URL("..", import.meta.url));
const fixture = JSON.parse(
  readFileSync(join(root, "scripts/fixtures/heading-ids.json"), "utf8"),
) as Fixture;
const manifest = JSON.parse(readFileSync(join(root, "dist/site/manifest.json"), "utf8")) as {
  epochs: { name: string }[];
};
const epoch = manifest.epochs.at(-1)?.name;
if (!epoch) throw new Error("dist/site/manifest.json lists no epochs");

function decode(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

/** Headings h1–h3 with an id inside the post body (`<div class="prose">`). */
function builtHeadings(html: string): FixtureHeading[] {
  const start = html.indexOf('<div class="prose">');
  if (start < 0) throw new Error("post body not found");
  const body = html.slice(start);
  const headings: FixtureHeading[] = [];
  for (const match of body.matchAll(/<h([1-3]) id="([^"]*)">([\s\S]*?)<\/h\1>/g)) {
    headings.push({
      depth: Number(match[1]),
      id: decode(match[2]),
      text: decode(match[3].replace(/<[^>]+>/g, "")),
    });
  }
  return headings;
}

let checked = 0;
const failures: string[] = [];
for (const [slug, languages] of Object.entries(fixture)) {
  for (const [lang, expected] of Object.entries(languages)) {
    const file = join(root, "dist/site", epoch, "main", lang, "blog", slug, "index.html");
    if (!existsSync(file)) {
      failures.push(`${slug}/${lang}: missing ${file}`);
      continue;
    }
    const actual = builtHeadings(readFileSync(file, "utf8"));
    const count = Math.max(expected.length, actual.length);
    for (let i = 0; i < count; i++) {
      const want = expected[i];
      const got = actual[i];
      checked++;
      if (
        !want ||
        !got ||
        want.id !== got.id ||
        want.depth !== got.depth ||
        want.text !== got.text
      ) {
        failures.push(
          `${slug}/${lang} #${i}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`,
        );
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`heading ids: ${failures.length} mismatch(es) out of ${checked}`);
  process.exit(1);
}
console.log(`heading ids: all ${checked} match (${epoch})`);
