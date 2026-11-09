import { SITE_TIMEZONE } from "../../lib/config";
import { t } from "../../i18n";
import type { Language } from "../../lib/config";

const ISO_DATE = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: SITE_TIMEZONE,
});

/** `2026-10-29`, the calendar date in the site timezone. Listings and post heads use it. */
export function isoDate(date: Date): string {
  return ISO_DATE.format(date);
}

/** `Feb – Oct 2026` / `fev. – out. de 2026`: the months spanned by two dates. */
export function monthRange(from: Date, to: Date, lang: Language): string {
  const format = new Intl.DateTimeFormat(t(lang).locale, {
    year: "numeric",
    month: "short",
    timeZone: SITE_TIMEZONE,
  });
  return format.formatRange(from, to);
}
