import { blog } from "fumadocs-mdx:collections/server";
import { DATA } from "@/lib/data/content";
import { isScheduled } from "@/lib/helpers";
import type { Language } from "@/lib/types";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
} as const;

const BOX = {
  topLeft: "\u256d",
  topRight: "\u256e",
  bottomLeft: "\u2570",
  bottomRight: "\u256f",
  horizontal: "\u2500",
  vertical: "\u2502",
  topTee: "\u252c",
  bottomTee: "\u2534",
} as const;

const LOGO_LINES = [
  "  _____         _ _ _ _   _  ",
  " |   __|_ _ ___| | | |_|_| | ",
  " |  |  | | |_ -| | | | | . | ",
  " |_____|___|___|_____|_|___| ",
];

const LOGO_WIDTH = 29;
const ABOUT_OUTER = 30;
const ABOUT_INNER = 28;
const GAP = "  ";
// Total socials outer width: 1 (╭) + LABEL_COL + 1 (┬) + VALUE_COL + 1 (╮) = 56
const SOCIALS_LABEL_COL = 11;
const SOCIALS_VALUE_COL = 42;
const BLOG_RULE_WIDTH = 80;

function visibleLength(str: string): number {
  // oxlint-disable-next-line no-control-regex
  const ansiPattern = /\x1b\[[0-9;]*m/g;
  return str.replace(ansiPattern, "").length;
}

function padLine(text: string, width: number): string {
  const visible = visibleLength(text);
  const padding = width - visible;
  return text + " ".repeat(Math.max(0, padding));
}

function padPlain(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - text.length));
}

interface BlogEntry {
  title: string;
  date: string;
}

function getBlogEntries(lang: Language): BlogEntry[] {
  return blog
    .map((entry) => {
      const pathParts = entry.info.path.replace(/\.mdx?$/, "").split("/");
      const entryLang = pathParts[pathParts.length - 1] as "en" | "pt";

      let date = "";
      if (entry.date) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
          date = entry.date;
        } else {
          const parsed = new Date(entry.date);
          date = Number.isNaN(parsed.getTime())
            ? entry.date
            : parsed.toISOString().split("T")[0];
        }
      }

      return { title: entry.title, date, lang: entryLang };
    })
    .filter((e) => e.lang === lang && e.date !== "" && !isScheduled(e.date))
    .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
    .map(({ title, date }) => ({ title, date }));
}

export function buildCurlResponse(lang: Language): string {
  const content = DATA[lang].curl;
  const lines: string[] = [];

  // ── Header: logo + info panel ──
  const logoLines = LOGO_LINES.map((l) => padPlain(l, LOGO_WIDTH));
  const emptyLogo = " ".repeat(LOGO_WIDTH);

  const headerRight = [
    `${ANSI.bold}${content.name}${ANSI.reset}`,
    `${content.title}`,
    "",
    `${ANSI.dim}${content.sites}${ANSI.reset}`,
    `${ANSI.dim}${content.source}${ANSI.reset}`,
  ];

  const headerGap = "         ";

  const headerRows = Math.max(logoLines.length, headerRight.length);
  for (let i = 0; i < headerRows; i++) {
    const logo = i < logoLines.length ? logoLines[i] : emptyLogo;
    const right = i < headerRight.length ? headerRight[i] : "";

    if (i < logoLines.length) {
      lines.push(
        `${ANSI.green}${ANSI.bold}${logo}${ANSI.reset}${headerGap}${right}`,
      );
    } else {
      lines.push(`${logo}${headerGap}${right}`);
    }
  }

  lines.push("");

  // ── Side-by-side boxes: About + Socials ──

  // About box top border: ╭─About──────────────────────╮ (30 total)
  // Structure: ╭(1) + ─(1) + text + fill_dashes + ╮(1) = 30
  // Inner = 28 = 1 dash + text + fill  →  fill = 28 - 1 - text.length
  const aboutHeaderText = content.aboutHeader;
  const aboutTopFill = ABOUT_INNER - 1 - aboutHeaderText.length;
  const aboutTop =
    `${ANSI.green}${BOX.topLeft}${BOX.horizontal}${ANSI.bold}${aboutHeaderText}${ANSI.reset}${ANSI.green}${BOX.horizontal.repeat(aboutTopFill)}${BOX.topRight}${ANSI.reset}`;

  // Socials box top border: ╭─Socials───┬──────...╮ (56 total)
  // Structure: ╭(1) + [11 label chars] + ┬(1) + [42 value chars] + ╮(1) = 56
  // Label chars = ─(1) + text + fill  →  fill = 11 - 1 - text.length
  const socialsHeaderText = content.socialsHeader;
  const socialsHeaderFill =
    SOCIALS_LABEL_COL - 1 - socialsHeaderText.length;
  const socialsTop =
    `${ANSI.green}${BOX.topLeft}${BOX.horizontal}${ANSI.bold}${socialsHeaderText}${ANSI.reset}${ANSI.green}${BOX.horizontal.repeat(socialsHeaderFill)}${BOX.topTee}${BOX.horizontal.repeat(SOCIALS_VALUE_COL)}${BOX.topRight}${ANSI.reset}`;

  lines.push(`${aboutTop}${GAP}${socialsTop}`);

  // Content rows for the boxes
  const aboutLines = content.aboutText;
  const socialLabels = ["GitHub", "LinkedIn", "Site", "Email"];
  const socialValues = [
    content.github,
    content.linkedin,
    content.site,
    content.email,
  ];

  // Body rows: 1 empty top + max(about lines, social links) + 1 empty bottom
  const bodyRows = Math.max(aboutLines.length, socialLabels.length) + 2;

  for (let i = 0; i < bodyRows; i++) {
    // About box row
    let aboutContent: string;
    if (i === 0 || i === bodyRows - 1) {
      aboutContent = " ".repeat(ABOUT_INNER);
    } else {
      const textIdx = i - 1;
      const text = textIdx < aboutLines.length ? `  ${aboutLines[textIdx]}` : "";
      aboutContent = padLine(text, ABOUT_INNER);
    }
    const aboutRow =
      `${ANSI.green}${BOX.vertical}${ANSI.reset}${aboutContent}${ANSI.green}${BOX.vertical}${ANSI.reset}`;

    // Socials box row
    let socialsLabel: string;
    let socialsValue: string;
    if (i === 0 || i === bodyRows - 1) {
      socialsLabel = " ".repeat(SOCIALS_LABEL_COL);
      socialsValue = " ".repeat(SOCIALS_VALUE_COL);
    } else {
      const idx = i - 1;
      if (idx < socialLabels.length) {
        socialsLabel = padLine(`  ${socialLabels[idx]}`, SOCIALS_LABEL_COL);
        socialsValue = padLine(
          `  ${ANSI.cyan}${socialValues[idx]}${ANSI.reset}`,
          SOCIALS_VALUE_COL,
        );
      } else {
        socialsLabel = " ".repeat(SOCIALS_LABEL_COL);
        socialsValue = " ".repeat(SOCIALS_VALUE_COL);
      }
    }
    const socialsRow =
      `${ANSI.green}${BOX.vertical}${ANSI.reset}${socialsLabel}${ANSI.green}${BOX.vertical}${ANSI.reset}${socialsValue}${ANSI.green}${BOX.vertical}${ANSI.reset}`;

    lines.push(`${aboutRow}${GAP}${socialsRow}`);
  }

  // Bottom borders
  const aboutBottom =
    `${ANSI.green}${BOX.bottomLeft}${BOX.horizontal.repeat(ABOUT_OUTER - 2)}${BOX.bottomRight}${ANSI.reset}`;
  const socialsBottom =
    `${ANSI.green}${BOX.bottomLeft}${BOX.horizontal.repeat(SOCIALS_LABEL_COL)}${BOX.bottomTee}${BOX.horizontal.repeat(SOCIALS_VALUE_COL)}${BOX.bottomRight}${ANSI.reset}`;

  lines.push(`${aboutBottom}${GAP}${socialsBottom}`);

  lines.push("");

  // ── Blog posts section ──
  lines.push(`  ${ANSI.bold}${content.blogHeader}${ANSI.reset}`);
  lines.push(
    `  ${ANSI.green}${BOX.horizontal.repeat(BLOG_RULE_WIDTH)}${ANSI.reset}`,
  );

  const posts = getBlogEntries(lang);
  for (const post of posts) {
    lines.push(`  ${ANSI.dim}${post.date}${ANSI.reset}  ${post.title}`);
  }

  return lines.join("\n") + "\n\n";
}
