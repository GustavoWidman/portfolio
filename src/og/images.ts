import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { postSchema } from "../content/schema";
import { readPostSources } from "../content/source";
import { PROFILE } from "../data/profile";
import { pick } from "../data/types";
import { formatDate, t } from "../i18n";
import { LANGUAGES, SITE_URL } from "../lib/config";
import { getPublicationDate, isScheduled } from "../lib/publication-date";
import { epochFiles, ogImageFile } from "../lib/urls";
import { createOgRenderer } from "./render";
import type { Language } from "../lib/config";
import type { OgCard } from "./template";

/** One Open Graph image of the site. */
export interface OgImage {
  /** File name under `og/` (see `ogImageFile`). */
  file: string;
  card: OgCard;
  /** Frontmatter date of the post; absent for pages that exist in every epoch. */
  date?: string;
}

/** A release epoch as listed in `dist/site/manifest.json`. */
export interface OgEpoch {
  name: string;
  /** Unix seconds. */
  start: number;
}

const HOST = new URL(SITE_URL).host;

/** Every card: portfolio and blog index per language, then one per post file. */
export function ogImageList(root: string): OgImage[] {
  const images: OgImage[] = [];
  for (const lang of LANGUAGES) {
    const dict = t(lang);
    images.push({
      file: ogImageFile("portfolio", lang),
      card: {
        eyebrow: PROFILE.name,
        title: pick(PROFILE.shortRole, lang),
        subtitle: pick(PROFILE.motto, lang),
        tags: [],
        meta: [dict.languageName],
        address: HOST,
      },
    });
    images.push({
      file: ogImageFile("blog-index", lang),
      card: {
        eyebrow: PROFILE.name,
        title: dict.blog.title,
        subtitle: dict.blog.description,
        tags: [],
        meta: [dict.languageName],
        address: `${HOST}/blog`,
      },
    });
  }

  for (const source of readPostSources(root)) {
    const data = postSchema.parse(source.data);
    const lang: Language = source.lang;
    images.push({
      file: ogImageFile(source.slug, lang),
      date: data.date,
      card: {
        eyebrow: PROFILE.name,
        title: data.title,
        subtitle: data.excerpt,
        tags: data.tags,
        meta: [formatDate(getPublicationDate(data.date), lang), t(lang).languageName],
        address: `${HOST}/blog`,
      },
    });
  }
  return images;
}

/**
 * Renders every card once and writes it into `site/<epoch>/og/` of each epoch in which
 * its page is released. A post's image therefore appears in the same epoch as the post
 * itself; earlier epochs never contain it. Returns the file names written per epoch.
 */
export async function writeOgImages(
  root: string,
  dist: string,
  epochs: OgEpoch[],
): Promise<Record<string, string[]>> {
  const render = createOgRenderer(root);
  const images = ogImageList(root);
  const rendered = await Promise.all(
    images.map(async (image) => ({ image, png: await render(image.card) })),
  );

  const written: Record<string, string[]> = {};
  for (const epoch of epochs) {
    const dir = join(dist, "site", epoch.name, epochFiles.ogDir);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    written[epoch.name] = [];
    for (const { image, png } of rendered) {
      if (image.date !== undefined && isScheduled(image.date, epoch.start * 1000)) continue;
      writeFileSync(join(dir, image.file), png);
      written[epoch.name].push(image.file);
    }
    written[epoch.name].sort();
  }
  return written;
}
