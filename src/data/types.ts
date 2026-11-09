import type { Language } from "../lib/config";

/** A value with one variant per language. */
export type Localized<T = string> = Record<Language, T>;

/** Copy that differs per language, or a plain string that is the same in both (names, units, code). */
export type Text = string | Localized;

export function pick<T>(value: Localized<T>, lang: Language): T {
  return value[lang];
}

export function text(value: Text, lang: Language): string {
  return typeof value === "string" ? value : value[lang];
}

export function both(en: string, pt: string): Localized {
  return { en, pt };
}
