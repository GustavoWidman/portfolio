import { PROFILE } from "../../data/profile";
import { pick } from "../../data/types";
import { getPublicationDate } from "../publication-date";
import { SITE_TIMEZONE } from "../config";
import type { Language } from "../config";
import type { Post } from "../posts";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
} as const;

const BOX = {
  topLeft: "╭",
  topRight: "╮",
  bottomLeft: "╰",
  bottomRight: "╯",
  horizontal: "─",
  vertical: "│",
  topTee: "┬",
  bottomTee: "┴",
} as const;

const LOGO = [
  "  _____         _ _ _ _   _  ",
  " |   __|_ _ ___| | | |_|_| | ",
  " |  |  | | |_ -| | | | | . | ",
  " |_____|___|___|_____|_|___| ",
];

const TEXT: Record<
  Language,
  { about: string; socials: string; posts: string; aboutLines: string[]; otherLanguage: string }
> = {
  en: {
    about: "About",
    socials: "Socials",
    posts: "Blog Posts",
    aboutLines: [
      "Rust on the hot path,",
      "edge/CDN at Azion,",
      "network stacks from",
      "raw sockets up, and",
      "coding-agent research.",
    ],
    otherLanguage: 'em português: curl "guswid.com/?lang=pt"',
  },
  pt: {
    about: "Sobre",
    socials: "Social",
    posts: "Posts do Blog",
    aboutLines: [
      "Rust no hot path,",
      "edge/CDN na Azion,",
      "pilhas de rede desde",
      "raw sockets e",
      "pesquisa com agentes.",
    ],
    otherLanguage: 'in english: curl "guswid.com/?lang=en"',
  },
};

const GAP = "  ";
/** Columns between the logo and the header text when the card is wide enough. */
const HEADER_GAP = 9;
const PAD = 2;
const RULE_WIDTH = 80;

/** Terminal columns of a string: ANSI escapes removed, one column per code point. */
export function visibleWidth(text: string): number {
  // oxlint-disable-next-line no-control-regex
  return [...text.replace(/\x1b\[[0-9;]*m/g, "")].length;
}

function pad(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - visibleWidth(text)));
}

const green = (text: string): string => `${ANSI.green}${text}${ANSI.reset}`;

/** `YYYY-MM-DD` of the release instant in the site timezone. */
function isoDay(date: string): string {
  return getPublicationDate(date).toLocaleDateString("en-CA", { timeZone: SITE_TIMEZONE });
}

/**
 * The ANSI text card served to `curl` on `/`. Box widths are derived from their content,
 * so every line fits its box.
 */
export function curlCard(posts: Post[], lang: Language): string {
  const text = TEXT[lang];
  const lines: string[] = [];

  const socials: [string, string][] = [
    ["GitHub", PROFILE.contact.github],
    ["LinkedIn", PROFILE.contact.linkedin.replace("://www.", "://")],
    ["Site", PROFILE.sites[0]],
    ["Email", PROFILE.contact.email],
  ];

  // Inner widths: content plus left padding plus one column of right padding at least.
  const aboutInner = Math.max(
    visibleWidth(text.about) + 2,
    ...text.aboutLines.map((line) => PAD + visibleWidth(line) + 1),
  );
  const labelInner = Math.max(
    visibleWidth(text.socials) + 2,
    ...socials.map(([label]) => PAD + visibleWidth(label) + 1),
  );
  const valueInner = Math.max(...socials.map(([, value]) => PAD + visibleWidth(value) + 1));

  // The header sits right of the logo, at most HEADER_GAP columns away and never wider
  // than the box row below it.
  const header = [
    `${ANSI.bold}${PROFILE.name}${ANSI.reset}`,
    pick(PROFILE.shortRole, lang),
    "",
    `${ANSI.dim}${PROFILE.sites.join(" | ")}${ANSI.reset}`,
    `${ANSI.dim}src: ${PROFILE.source}${ANSI.reset}`,
  ];
  const logoWidth = Math.max(...LOGO.map(visibleWidth));
  const cardWidth = aboutInner + 2 + GAP.length + labelInner + valueInner + 3;
  const headerWidth = Math.max(...header.map(visibleWidth));
  const headerGap = " ".repeat(
    Math.max(GAP.length, Math.min(HEADER_GAP, cardWidth - logoWidth - headerWidth)),
  );
  for (let i = 0; i < Math.max(LOGO.length, header.length); i++) {
    const logo = LOGO[i] ?? "";
    const left =
      i < LOGO.length
        ? `${ANSI.green}${ANSI.bold}${pad(logo, logoWidth)}${ANSI.reset}`
        : pad("", logoWidth);
    lines.push(`${left}${headerGap}${header[i] ?? ""}`.trimEnd());
  }
  lines.push("");

  const titled = (title: string, width: number): string =>
    `${BOX.horizontal}${ANSI.bold}${title}${ANSI.reset}${ANSI.green}${BOX.horizontal.repeat(width - 1 - visibleWidth(title))}`;

  lines.push(
    `${ANSI.green}${BOX.topLeft}${titled(text.about, aboutInner)}${BOX.topRight}${ANSI.reset}` +
      GAP +
      `${ANSI.green}${BOX.topLeft}${titled(text.socials, labelInner)}${BOX.topTee}${BOX.horizontal.repeat(valueInner)}${BOX.topRight}${ANSI.reset}`,
  );

  const rows = Math.max(text.aboutLines.length, socials.length) + 2;
  for (let i = 0; i < rows; i++) {
    const inner = i > 0 && i < rows - 1;
    const about =
      inner && text.aboutLines[i - 1] !== undefined
        ? `${" ".repeat(PAD)}${text.aboutLines[i - 1]}`
        : "";
    const social = inner ? socials[i - 1] : undefined;
    const label = social ? `${" ".repeat(PAD)}${social[0]}` : "";
    const value = social ? `${" ".repeat(PAD)}${ANSI.cyan}${social[1]}${ANSI.reset}` : "";
    lines.push(
      `${green(BOX.vertical)}${pad(about, aboutInner)}${green(BOX.vertical)}` +
        GAP +
        `${green(BOX.vertical)}${pad(label, labelInner)}${green(BOX.vertical)}${pad(value, valueInner)}${green(BOX.vertical)}`,
    );
  }

  lines.push(
    green(`${BOX.bottomLeft}${BOX.horizontal.repeat(aboutInner)}${BOX.bottomRight}`) +
      GAP +
      green(
        `${BOX.bottomLeft}${BOX.horizontal.repeat(labelInner)}${BOX.bottomTee}${BOX.horizontal.repeat(valueInner)}${BOX.bottomRight}`,
      ),
  );
  lines.push("");

  lines.push(`  ${ANSI.bold}${text.posts}${ANSI.reset}`);
  lines.push(`  ${green(BOX.horizontal.repeat(RULE_WIDTH))}`);
  for (const post of posts) {
    lines.push(`  ${ANSI.dim}${isoDay(post.date)}${ANSI.reset}  ${post.title}`);
  }
  lines.push("");
  lines.push(`  ${ANSI.dim}${text.otherLanguage}${ANSI.reset}`);

  return `${lines.join("\n")}\n\n`;
}
