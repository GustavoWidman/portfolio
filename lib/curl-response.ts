import { DATA } from "@/lib/data/content";
import type { Language } from "@/lib/types";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
} as const;

const BOX = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  leftTee: "├",
  rightTee: "┤",
} as const;

const WIDTH = 66;

function repeat(char: string, count: number): string {
  return char.repeat(count);
}

function padLine(text: string, width: number): string {
  const padding = width - text.length;
  return text + repeat(" ", Math.max(0, padding));
}

export function buildCurlResponse(lang: Language): string {
  const content = DATA[lang].curl;
  const lines: string[] = [];

  const innerWidth = WIDTH - 2;

  lines.push(
    ANSI.blue +
      BOX.topLeft +
      repeat(BOX.horizontal, innerWidth) +
      BOX.topRight +
      ANSI.reset
  );

  const nameLine = `  ${ANSI.bold}${ANSI.cyan}${content.name}${ANSI.reset}`;
  lines.push(
    ANSI.blue +
      BOX.vertical +
      ANSI.reset +
      padLine(nameLine, innerWidth) +
      ANSI.blue +
      BOX.vertical +
      ANSI.reset
  );

  const titleLine = `  ${ANSI.cyan}${content.title}${ANSI.reset}`;
  lines.push(
    ANSI.blue +
      BOX.vertical +
      ANSI.reset +
      padLine(titleLine, innerWidth) +
      ANSI.blue +
      BOX.vertical +
      ANSI.reset
  );

  lines.push(
    ANSI.blue +
      BOX.vertical +
      ANSI.reset +
      padLine("", innerWidth) +
      ANSI.blue +
      BOX.vertical +
      ANSI.reset
  );

  const skillsLine = `  ${content.skills}`;
  lines.push(
    ANSI.blue +
      BOX.vertical +
      ANSI.reset +
      padLine(skillsLine, innerWidth) +
      ANSI.blue +
      BOX.vertical +
      ANSI.reset
  );

  lines.push(
    ANSI.blue +
      BOX.leftTee +
      repeat(BOX.horizontal, innerWidth) +
      BOX.rightTee +
      ANSI.reset
  );

  const links = [
    content.github,
    content.linkedin,
    content.email,
    content.site,
  ];

  for (const link of links) {
    const linkLine = `  ${ANSI.dim}${link}${ANSI.reset}`;
    lines.push(
      ANSI.blue +
        BOX.vertical +
        ANSI.reset +
        padLine(linkLine, innerWidth) +
        ANSI.blue +
        BOX.vertical +
        ANSI.reset
    );
  }

  lines.push(
    ANSI.blue +
      BOX.bottomLeft +
      repeat(BOX.horizontal, innerWidth) +
      BOX.bottomRight +
      ANSI.reset
  );

  return lines.join("\n");
}
