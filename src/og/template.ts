/**
 * Visual template of the Open Graph images (1200x630 PNG). Everything that decides how a
 * card looks lives in this module: size, fonts, colors and the element tree handed to
 * satori. `src/og/images.ts` decides which cards exist and fills `OgCard`.
 *
 * The card is a datasheet header on paper: the LED and name over an ink rule, the title,
 * and a row of cells (tags, then date and language) between hairlines.
 */

/** Element tree in the React-element shape satori renders (no React involved). */
export interface OgElement {
  type: string;
  props: { style?: OgStyle; children?: OgChild | OgChild[] };
}
export type OgChild = OgElement | string;
export type OgStyle = Record<string, string | number>;

/** Content of one card. Every string is already localized. */
export interface OgCard {
  /** Small line above the title. */
  eyebrow: string;
  title: string;
  /** Muted text under the title, clamped to a few lines. */
  subtitle?: string;
  tags: string[];
  /** Bottom-right details, joined with a separator (date, language). */
  meta: string[];
  /** Top-right address, e.g. `guswid.com/blog`. */
  address: string;
}

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const GEIST = "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2";
const GEIST_MONO = "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2";

/**
 * Font files: the site's own variable Geist and Geist Mono (latin subsets), resolved from
 * node_modules. Satori reads the `wght` axis of a variable font, and needs an entry for
 * every weight a style uses; text is converted to outlines in the SVG.
 */
export const OG_FONTS = [
  { name: "Geist", weight: 400, file: GEIST },
  { name: "Geist", weight: 600, file: GEIST },
  { name: "Geist Mono", weight: 400, file: GEIST_MONO },
  { name: "Geist Mono", weight: 500, file: GEIST_MONO },
] as const;

/** Color tokens of the light palette in `src/styles/global.css` (datasheet paper). */
const COLORS = {
  paper: "#f6f6f3",
  ink: "#121316",
  fg2: "#3d4148",
  fg3: "#5c6169",
  rule: "#dcdcd6",
  rule2: "#bdbeb8",
  grid: "rgba(18, 19, 22, 0.04)",
  signal: "#c97a00",
};

const PADDING_X = 72;
const MAX_TAGS = 4;
/** Advance of one Geist Mono character, in ems (every glyph has the same width). */
const MONO_ADVANCE = 0.6;
const TAG_SIZE = 17;
const META_SIZE = 22;

function el(type: string, style: OgStyle, children?: OgChild | OgChild[]): OgElement {
  return { type, props: { style, children } };
}

/** Title size steps by length, so long titles wrap to at most three lines. */
function titleSize(title: string): number {
  if (title.length <= 28) return 84;
  if (title.length <= 52) return 68;
  return 56;
}

const mono = (size: number, color: string, extra: OgStyle = {}): OgStyle => ({
  fontFamily: "Geist Mono",
  fontSize: size,
  color,
  ...extra,
});

/** Uppercase mono label, as `.label` on the site. */
const label = (size: number, color: string): OgStyle =>
  mono(size, color, { fontWeight: 500, letterSpacing: size * 0.08, textTransform: "uppercase" });

function tag(text: string): OgElement {
  return el(
    "div",
    {
      display: "flex",
      flexShrink: 0,
      padding: "7px 12px 6px",
      border: `1.5px solid ${COLORS.rule2}`,
      whiteSpace: "nowrap",
      ...label(TAG_SIZE, COLORS.fg2),
    },
    text,
  );
}

/** The leading tags that fit on one line beside the meta cells; mono text makes widths exact. */
function fittingTags(tags: string[], meta: string[]): string[] {
  const metaWidth =
    meta.reduce((sum, item) => sum + item.length, 0) * META_SIZE * MONO_ADVANCE +
    (meta.length - 1) * 42;
  let room = OG_WIDTH - 2 * PADDING_X - metaWidth - 24;
  const fitting: string[] = [];
  for (const text of tags.slice(0, MAX_TAGS)) {
    const width = text.length * TAG_SIZE * (MONO_ADVANCE + 0.08) + 27 + 10;
    if (width > room) break;
    room -= width;
    fitting.push(text);
  }
  return fitting;
}

export function ogTemplate(card: OgCard): OgElement {
  const head = el(
    "div",
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 104,
      padding: `0 ${PADDING_X}px`,
      borderBottom: `3px solid ${COLORS.ink}`,
    },
    [
      el("div", { display: "flex", alignItems: "center", gap: 18 }, [
        el("div", { width: 16, height: 16, backgroundColor: COLORS.signal }),
        el(
          "div",
          { fontSize: 30, fontWeight: 600, letterSpacing: -0.4, color: COLORS.ink },
          card.eyebrow,
        ),
      ]),
      el("div", mono(24, COLORS.fg3), card.address),
    ],
  );

  const body = el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      flexGrow: 1,
      gap: 22,
      padding: `0 ${PADDING_X}px`,
    },
    [
      el(
        "div",
        {
          fontSize: titleSize(card.title),
          fontWeight: 600,
          lineHeight: 1.04,
          letterSpacing: -titleSize(card.title) * 0.035,
          color: COLORS.ink,
          lineClamp: 3,
        },
        card.title,
      ),
      ...(card.subtitle
        ? [
            el(
              "div",
              { fontSize: 28, lineHeight: 1.4, color: COLORS.fg2, lineClamp: 2, maxWidth: 980 },
              card.subtitle,
            ),
          ]
        : []),
    ],
  );

  const tags = fittingTags(card.tags, card.meta);
  const foot = el(
    "div",
    {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      height: 96,
      padding: `0 ${PADDING_X}px`,
      borderTop: `1.5px solid ${COLORS.rule}`,
    },
    [
      el("div", { display: "flex", gap: 10, flexShrink: 1, overflow: "hidden" }, tags.map(tag)),
      el(
        "div",
        { display: "flex", gap: 14, flexShrink: 0, ...mono(META_SIZE, COLORS.fg3) },
        card.meta.flatMap((item, i) => [
          ...(i > 0 ? [el("div", { color: COLORS.rule2 }, "·")] : []),
          el("div", { display: "flex" }, item),
        ]),
      ),
    ],
  );

  return el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      backgroundColor: COLORS.paper,
      backgroundImage: `linear-gradient(${COLORS.grid} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.grid} 1px, transparent 1px)`,
      backgroundSize: "24px 24px",
      fontFamily: "Geist",
      color: COLORS.ink,
    },
    [head, body, foot],
  );
}
