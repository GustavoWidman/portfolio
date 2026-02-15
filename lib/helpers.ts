import type { Language } from "@/lib/types";
import { SITE_TIMEZONE } from "@/lib/config";

export function getDateInTimezone(dateString: string): Date {
  if (!dateString || typeof dateString !== "string") {
    return new Date();
  }
  const parts = dateString.split("-");
  if (parts.length !== 3) {
    return new Date();
  }
  const [year, month, day] = parts.map(Number);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return new Date();
  }
  const utcNoon = Date.UTC(year, month - 1, day, 12, 0, 0);
  const offsetMs = getTimezoneOffsetMs(SITE_TIMEZONE, utcNoon);
  return new Date(utcNoon + offsetMs - 12 * 60 * 60 * 1000);
}

function getTimezoneOffsetMs(timezone: string, utcMs: number): number {
  const date = new Date(utcMs);
  const tzParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => {
    const part = tzParts.find((p) => p.type === type);
    return part ? Number(part.value) : 0;
  };

  const tzMs = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return utcMs - tzMs;
}

export function getCurrentTimeInTimezone(): Date {
  const now = new Date();
  const tzParts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => {
    const part = tzParts.find((p) => p.type === type);
    return part ? Number(part.value) : 0;
  };

  return new Date(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
}

export const normalizeToTimezoneMidnight = (date: string | Date): Date => {
  if (typeof date === "string") {
    return getDateInTimezone(date);
  }
  const isoString = date.toISOString().split("T")[0];
  return getDateInTimezone(isoString);
};

export const isScheduled = (date: string | Date): boolean => {
  const postDate = normalizeToTimezoneMidnight(date);
  const nowInTz = getCurrentTimeInTimezone();
  return postDate > nowInTz;
};

export const formatDate = (dateString: string, lang: Language) => {
  const date = getDateInTimezone(dateString);
  const locale = lang === "pt" ? "pt-BR" : "en-US";
  return date
    .toLocaleDateString(locale, { month: "short", year: "numeric" })
    .replace(" de ", " ")
    .replace(".", "");
};

export const getDuration = (startDate: string, endDate: string | undefined, lang: Language) => {
  const start = getDateInTimezone(startDate);
  const end = endDate ? getDateInTimezone(endDate) : new Date();

  const diffTime = Math.max(0, end.getTime() - start.getTime());

  const MS_PER_MONTH = 2629800000;

  const rawMonths = diffTime / MS_PER_MONTH;
  const totalMonths = Math.round(rawMonths);

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  let durationString = "";

  if (lang === "en") {
    if (years > 0) durationString += `${years} yr${years > 1 ? "s" : ""} `;
    if (months > 0) durationString += `${months} mos`;
  } else {
    if (years > 0) durationString += `${years} ano${years > 1 ? "s" : ""} `;
    if (months > 0) durationString += `${months} m${months !== 1 ? "eses" : "ês"}`;
  }

  return durationString.trim() || (lang === "en" ? "1 mo" : "1 mês");
};
