import { cookies, headers } from "next/headers";
import type { Language } from "@/lib/types";

const COOKIE_NAME = "portfolio_lang";

export async function detectLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Priority 1: Cookie (persisted preference)
  const cookieLang = cookieStore.get(COOKIE_NAME)?.value;
  if (cookieLang === "en" || cookieLang === "pt") {
    return cookieLang;
  }

  // Priority 2: Accept-Language header
  const acceptLanguage = headersList.get("accept-language") || "";
  const preferredLang = parseAcceptLanguage(acceptLanguage);
  if (preferredLang === "pt") {
    return "pt";
  }

  // Default: English
  return "en";
}

function parseAcceptLanguage(header: string): string | null {
  const languages = header.split(",").map((lang) => {
    const [code, qStr] = lang.trim().split(";q=");
    const q = qStr ? parseFloat(qStr) : 1;
    return { code: code.split("-")[0].toLowerCase(), q };
  });

  languages.sort((a, b) => b.q - a.q);

  return languages[0]?.code || null;
}

export async function getLanguageFromParam(param: string | null): Promise<Language | null> {
  if (param === "en" || param === "pt") {
    return param;
  }
  return null;
}
