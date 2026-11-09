/**
 * Language toggle. `a[data-lang-switch]` is a plain `?lang=` link; here a click also stores
 * the choice (localStorage and the `portfolio_lang` cookie) and reloads without `?lang`.
 */
import { COOKIE_DOMAINS, LANG_STORAGE_KEY } from "../../lib/config";
import { closest, store } from "../util";
import { blinkLedOnNextPage } from "./led";

/** `;domain=` attribute that shares a cookie between the hosts of the site's domains. */
export function cookieDomain(): string {
  const host = location.hostname;
  const domain = COOKIE_DOMAINS.find((d) => host === d || host.endsWith(`.${d}`));
  return domain ? `;domain=${domain}` : "";
}

/** The language in the shared cookie, if any. */
function cookieLanguage(): string | undefined {
  return new RegExp(`(?:^|; )${LANG_STORAGE_KEY}=(en|pt)(?=;|$)`).exec(document.cookie)?.[1];
}

/** Stores `lang` as the visitor's language and reloads the page in it. */
export function switchLanguage(lang: string): void {
  store(LANG_STORAGE_KEY, lang);
  const domain = cookieDomain();
  // A host-only cookie of the same name would be sent before the shared one and win on
  // the server, so it is removed before the shared cookie is written.
  if (domain) document.cookie = `${LANG_STORAGE_KEY}=;path=/;max-age=0`;
  document.cookie = `${LANG_STORAGE_KEY}=${lang};path=/;max-age=31536000;samesite=lax${domain}`;
  blinkLedOnNextPage();
  const url = new URL(location.href);
  // With cookies blocked only `?lang` tells the server; the choice then holds for this page.
  if (cookieLanguage() === lang) url.searchParams.delete("lang");
  else url.searchParams.set("lang", lang);
  if (url.href === location.href) location.reload();
  else location.replace(url.href);
}

export function init(): void {
  // A page shown again from the back/forward cache was served before a later language choice.
  addEventListener("pageshow", (event) => {
    const chosen = cookieLanguage();
    if (event.persisted && chosen && chosen !== document.documentElement.lang.slice(0, 2))
      location.reload();
  });
  document.addEventListener("click", (event) => {
    const link = closest<HTMLAnchorElement>(event, "a[data-lang-switch]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    switchLanguage(link.dataset.langSwitch ?? "en");
  });
}
