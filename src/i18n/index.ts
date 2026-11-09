import { SITE_TIMEZONE } from "../lib/config";
import { blog as enBlog } from "./en/blog";
import { chrome as enChrome } from "./en/chrome";
import { home as enHome } from "./en/home";
import { quirks as enQuirks } from "./en/quirks";
import { blog as ptBlog } from "./pt/blog";
import { chrome as ptChrome } from "./pt/chrome";
import { home as ptHome } from "./pt/home";
import { quirks as ptQuirks } from "./pt/quirks";
import type { Language } from "../lib/config";
import type { Widen } from "./types";

/**
 * One dictionary per language, composed from the area files (`chrome`, `home`, `blog`,
 * `quirks`). Each area owns its top-level keys; the English objects define the shape.
 */
const en = { ...enChrome, ...enHome, ...enBlog, ...enQuirks };

export type Dictionary = Widen<typeof en>;

const pt: Dictionary = { ...ptChrome, ...ptHome, ...ptBlog, ...ptQuirks };

const DICTIONARIES: Record<Language, Dictionary> = { en, pt };

export function t(lang: Language): Dictionary {
  return DICTIONARIES[lang];
}

/** `October 29, 2026` / `29 de outubro de 2026`, in the site timezone. */
export function formatDate(date: Date, lang: Language): string {
  return date.toLocaleDateString(t(lang).locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: SITE_TIMEZONE,
  });
}

/** `Apr 2026` / `abr. de 2026`, in the site timezone. */
export function formatMonth(date: Date, lang: Language): string {
  return date.toLocaleDateString(t(lang).locale, {
    year: "numeric",
    month: "short",
    timeZone: SITE_TIMEZONE,
  });
}

/** Date and time with the zone offset, e.g. `October 30, 2026 at 14:00 GMT-3`. */
export function formatDateTime(date: Date, lang: Language): string {
  return date.toLocaleString(t(lang).locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: SITE_TIMEZONE,
    timeZoneName: "short",
  });
}
