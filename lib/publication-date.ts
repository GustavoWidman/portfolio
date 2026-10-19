import { SITE_TIMEZONE } from "./config";

/** Keep quoted timestamp offsets intact; YAML's legacy date-only values are Dates. */
export function formatDateValue(date: unknown): string {
  if (date instanceof Date) {
    const iso = date.toISOString();
    return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso;
  }
  return typeof date === "string" ? date : "";
}

/** Date-only posts release at site-local midnight; timestamps denote exact instants. */
export function getPublicationDate(value: string | Date): Date {
  if (value instanceof Date) return new Date(value.getTime());
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) {
    const [year, month, day = 1] = value.split("-").map(Number);
    const wallTime = Date.UTC(year, month - 1, day);
    let instant = wallTime;
    // Resolve wall-clock midnight in the site timezone, independently of server TZ.
    for (let i = 0; i < 3; i++) {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: SITE_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date(instant));
      const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
      const local = Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        get("hour"),
        get("minute"),
        get("second"),
      );
      const correction = wallTime - local;
      instant += correction;
      if (correction === 0) break;
    }
    return new Date(instant);
  }
  // Reject timezone-less timestamps rather than silently using the machine timezone.
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return new Date(NaN);
  }
  return new Date(value);
}

export function isScheduled(date: string | Date, now: number = Date.now()): boolean {
  const timestamp = getPublicationDate(date).getTime();
  // Invalid publication metadata fails closed instead of exposing a post early.
  return !Number.isFinite(timestamp) || timestamp > now;
}
