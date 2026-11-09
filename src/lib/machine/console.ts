import pkg from "../../../package.json";
import { EXPERIENCE } from "../../data/experience";
import { PROFILE } from "../../data/profile";
import { pick, text } from "../../data/types";
import { SMALL_BUILDS, SPEC_SHEETS } from "../../data/work";
import { buildInfo } from "../build-info";
import { SITE_TIMEZONE, SITE_URL } from "../config";
import { servedPosts } from "../release";
import { blogIndexHref, homeHref, portfolioFileHref, postHref } from "../urls";
import { t } from "../../i18n";
import type { HostKind, Language } from "../config";
import type { Epoch } from "../epochs";
import type { Post } from "../posts";
import type { ConsoleData } from "../../scripts/console";

/** The first sentence of a summary: one console line per project. */
const firstSentence = (summary: string): string => summary.match(/^.+?\.(?=\s|$)/)?.[0] ?? summary;
const day = (date: Date): string => date.toLocaleDateString("en-CA", { timeZone: SITE_TIMEZONE });

/**
 * `console.json` of a tree: everything the serial console prints, in the tree's language,
 * fetched by the page when the console first opens.
 */
export function consoleData(
  posts: readonly Post[],
  epoch: Epoch,
  host: HostKind,
  lang: Language,
): ConsoleData {
  const c = t(lang).console;
  const build = buildInfo();
  return {
    lang,
    prompt: `guest@${new URL(SITE_URL).host}`,
    home: homeHref(host),
    blog: blogIndexHref(host),
    cv: {
      en: portfolioFileHref(host, PROFILE.contact.resume.en),
      pt: portfolioFileHref(host, PROFILE.contact.resume.pt),
    },
    whoami: [
      `${PROFILE.name}, ${pick(PROFILE.role, lang)}`,
      pick(PROFILE.location, lang),
      pick(PROFILE.motto, lang),
    ],
    version: [
      [c.version.release, `v${build.version}`],
      ...(build.commit ? [[c.version.commit, build.commit] as [string, string]] : []),
      [c.version.built, build.date],
      [c.version.engine, `${c.version.engineValue} (astro ${pkg.dependencies.astro})`],
    ],
    exp: EXPERIENCE.map((item) => [
      `${item.start}–${item.end ?? c.present}`,
      pick(item.role, lang),
      item.company,
    ]),
    work: [
      ...SPEC_SHEETS.map((sheet) => [sheet.name, text(sheet.cls, lang)] as [string, string]),
      ...SMALL_BUILDS.map((b) => [b.name, firstSentence(text(b.what, lang))] as [string, string]),
    ],
    posts: servedPosts(posts, epoch, lang).map((post) => [
      post.slug,
      day(post.published),
      post.title,
      postHref(host, post.slug),
    ]),
    text: c,
  };
}
