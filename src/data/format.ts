import { t } from "../i18n";
import { text } from "./types";
import type { Language } from "../lib/config";
import type { Text } from "./types";

/** A measured number with its decoration. The digits are formatted per language. */
export interface NumberReading {
  value: number;
  /** Fraction digits; without it the number keeps its natural digits (at most three). */
  dp?: number;
  /** Glued before the digits, such as `~`. */
  prefix?: string;
  /** Glued after the digits, such as `×` or `k`. */
  suffix?: string;
  /** Spaced after the number, set smaller. */
  unit?: Text;
}

export interface TextReading {
  text: Text;
}

export type Reading = NumberReading | TextReading;

export function formatNumber(value: number, lang: Language, dp?: number): string {
  return value.toLocaleString(t(lang).locale, {
    minimumFractionDigits: dp ?? 0,
    maximumFractionDigits: dp ?? 3,
  });
}

export interface ReadingParts {
  /** The number with prefix and suffix, or the text. */
  value: string;
  unit?: string;
  /** Present for numbers; text readings have none. */
  numeric: boolean;
}

export function readingParts(reading: Reading, lang: Language): ReadingParts {
  if ("text" in reading) return { value: text(reading.text, lang), numeric: false };
  return {
    value: `${reading.prefix ?? ""}${formatNumber(reading.value, lang, reading.dp)}${reading.suffix ?? ""}`,
    unit: reading.unit === undefined ? undefined : text(reading.unit, lang),
    numeric: true,
  };
}
