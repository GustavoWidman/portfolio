/** Wall-clock timezone for publication dates and every date shown on the site. */
export const SITE_TIMEZONE = "America/Sao_Paulo";

/** Canonical origin. Canonical URLs, feeds and machine outputs always point here. */
export const SITE_URL = "https://guswid.com";

/** Registrable domains whose hosts share the language cookie (apex, www. and blog.). */
export const COOKIE_DOMAINS = ["guswid.com", "r3dlust.com"] as const;

export const LANGUAGES = ["en", "pt"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "en";

/**
 * Host trees emitted for every epoch and language.
 * `main` serves the portfolio with the blog under `/blog/`; `blog` serves the blog at `/`.
 */
export const HOSTS = ["main", "blog"] as const;
export type HostKind = (typeof HOSTS)[number];

/** Cookie and localStorage key holding an explicit language choice. */
export const LANG_STORAGE_KEY = "portfolio_lang";
/** localStorage key holding an explicit theme choice (`light` | `dark`). */
export const THEME_STORAGE_KEY = "theme";
/**
 * Session cookie set once the boot screen has been shown. It lives on the registrable domain,
 * so every tab and both hosts of a browser session share it and a reboot from the blog host
 * can clear it.
 */
export const BOOT_COOKIE = "boot";

/** Words per minute used for the reading-time estimate. */
export const READING_WPM = 230;

export const AUTHOR = {
  name: "Gustavo Widman",
  /** Handles the author is known by (structured data `alternateName`). */
  aliases: ["guswid", "r3dlust"],
  twitter: "@guswid",
  email: "gustavowidman@gmail.com",
  github: "https://github.com/GustavoWidman",
  linkedin: "https://www.linkedin.com/in/gustavo-widman",
  source: "https://github.com/GustavoWidman/portfolio",
} as const;

/** BCP 47 tag of a language, for `lang` attributes and structured data. */
export function htmlLang(lang: Language): string {
  return lang === "pt" ? "pt-BR" : "en";
}

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "pt";
}
