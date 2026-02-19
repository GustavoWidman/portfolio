import { cookies, headers } from "next/headers";
import type { Language } from "@/lib/types";

const COOKIE_NAME = "portfolio_lang";
const INTRO_COOKIE = "portfolio_intro_last_seen";
const INTRO_COOLDOWN_MS = 2 * 60 * 60 * 1000;

export async function detectLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const headersList = await headers();

  const cookieLang = cookieStore.get(COOKIE_NAME)?.value;
  if (cookieLang === "en" || cookieLang === "pt") {
    return cookieLang;
  }

  const acceptLanguage = headersList.get("accept-language") || "";
  const preferredLang = parseAcceptLanguage(acceptLanguage);
  if (preferredLang === "pt") {
    return "pt";
  }

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

export async function shouldSkipIntro(urlIntro?: string | null): Promise<boolean> {
  // URL param override takes priority
  if (urlIntro === "true") return false;
  if (urlIntro === "false") return true;

  const cookieStore = await cookies();
  const introCookie = cookieStore.get(INTRO_COOKIE)?.value;

  if (introCookie) {
    const lastSeen = parseInt(introCookie, 10);
    if (!Number.isNaN(lastSeen) && Date.now() - lastSeen < INTRO_COOLDOWN_MS) {
      return true;
    }
  }

  return false;
}
