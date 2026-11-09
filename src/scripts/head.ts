import { BOOT_COOKIE, COOKIE_DOMAINS, LANG_STORAGE_KEY, THEME_STORAGE_KEY } from "../lib/config";

const DOMAINS = COOKIE_DOMAINS.map((domain) => domain.replaceAll(".", "\\.")).join("|");

/**
 * Inline `<head>` script (kept under 1 KB), run before first paint:
 * - marks <html> with `js` first, so markup that needs the deferred module is shown even
 *   when storage access throws (blocked site data);
 * - applies an explicit theme from localStorage `theme` as `data-theme` on <html>;
 * - keeps localStorage `portfolio_lang` and the cookie in sync. The cookie (shared by
 *   every host of the registrable domain) wins when present. Without a cookie, a stored
 *   language is written to the cookie, and if it differs from the served page and there
 *   is no `?lang`, the page reloads once (guarded per session) so the server can serve it;
 * - on the site's domains, removes a host-only `portfolio_lang` cookie that sits next to
 *   the shared one. Browsers send the older host-only cookie first and the server reads the
 *   first, so the shared cookie (the latest choice) is kept, and the page reloads once when
 *   the server answered with the host-only value;
 * - with `boot` (the home page), adds `boot` to <html> on the first view of a browser session,
 *   unless reduced motion is requested: when the `boot` session cookie is absent, it is set,
 *   and the screen runs only if the cookie took (blocked cookies never boot). The class is
 *   what starts the boot screen.
 */
export function headScript(options: { boot: boolean }): string {
  const boot = options.boot
    ? `try{if(!matchMedia("(prefers-reduced-motion:reduce)").matches&&!B()){C.cookie="${BOOT_COOKIE}=1;path=/"+D;B()&&d.classList.add("boot")}}catch(e){}`
    : "";
  return `(function(){var d=document.documentElement,C=document,K="${LANG_STORAGE_KEY}",X=K+"=;path=/;max-age=0",m=location.hostname.match(/(?:^|\\.)(${DOMAINS})$/),D=m?";domain="+m[1]:"",s,B=function(){return/(^|; )${BOOT_COOKIE}=/.test(C.cookie)},g=function(){return(C.cookie.match(/(?:^|; )${LANG_STORAGE_KEY}=(en|pt)(?=;|$)/)||[])[1]},r=function(){if(!/[?&]lang=/.test(location.search)&&!sessionStorage.getItem(K+"_r")){sessionStorage.setItem(K+"_r",1);location.reload()}};d.classList.add("js");${boot}try{s=localStorage;var t=s.getItem("${THEME_STORAGE_KEY}");if(t=="light"||t=="dark")d.dataset.theme=t}catch(e){}try{var f=g(),c=f;if(m&&(C.cookie.match(/(?:^|; )${LANG_STORAGE_KEY}=/g)||[]).length>1){C.cookie=X;c=g();if(c!=f)r()}var l=s.getItem(K);if(c){if(l!=c)s.setItem(K,c)}else if(l=="en"||l=="pt"){if(m)C.cookie=X;C.cookie=K+"="+l+";path=/;max-age=31536000;samesite=lax"+D;if(l!=d.lang.slice(0,2))r()}}catch(e){}})()`;
}
