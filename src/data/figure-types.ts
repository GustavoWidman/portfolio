import type { NumberReading, Reading } from "./format";
import type { Text } from "./types";

/** Fields every figure carries: its number, title block and closing note. */
export interface FigureHead {
  /** Unique on the page; the caption id derives from it. */
  id: string;
  /** `Fig. 2` */
  n: string;
  title: Text;
  /** Right-aligned unit or qualifier of the title block. */
  unit?: Text;
  note?: Text;
}

/**
 * Role of a scope series. The subject is the measured system, the baseline is the
 * reference that is not a competitor, and every other series is a competitor. The
 * competitor with the lowest last value is the next best; it is derived, never declared.
 */
export type SeriesRole = "subject" | "other" | "baseline";

export interface ScopeSeries {
  id: string;
  label: Text;
  /** Used where space is tight: end labels and the measurement box. */
  short?: Text;
  role: SeriesRole;
  /** One value per percentile of the figure. */
  points: number[];
  /** The single slowest request; listed in the table, never plotted. */
  worst: number;
}

/** Latency by percentile on a log-spaced axis, as in HdrHistogram plots. */
export interface ScopeFigure extends FigureHead {
  kind: "scope";
  /** Percent values in ascending order, such as `99.9`. */
  percentiles: number[];
  yMax: number;
  yTicks: number[];
  /** Unit of every value, such as `ms`. */
  valueUnit: string;
  valueDp: number;
  series: ScopeSeries[];
  conditions: Text;
}

export type BarTone = "subject" | "series" | "aside";

export interface BarRow {
  label: Text;
  value: number;
  /** Replaces the formatted value as the row's label. */
  shown?: Text;
  tone?: BarTone;
}

/** Horizontal bars from zero, drawn as a real table. */
export interface BarsFigure extends FigureHead {
  kind: "bars";
  max: number;
  /** Axis ticks as value and label. */
  ticks: [value: number, label: string][];
  dp?: number;
  suffix?: string;
  /** Value of a dashed reference line. */
  reference?: number;
  rows: BarRow[];
  /** What a screen reader hears instead of the bars. */
  summary: Text;
}

export interface ColumnRow {
  n: string;
  label: Text;
  value: number;
  subject?: boolean;
}

/** A value after each step, as columns from zero. */
export interface ColumnsFigure extends FigureHead {
  kind: "columns";
  max: number;
  rows: ColumnRow[];
  summary: Text;
}

export interface Block {
  tag: Text;
  title: Text;
  detail?: Text;
  /** Written from scratch (hatched) rather than existing infrastructure (dashed). */
  own?: boolean;
  /** Columns taken, of two. */
  span?: 1 | 2;
}

/** Stacked layers, top first. */
export interface BlocksFigure extends FigureHead {
  kind: "blocks";
  layers: Block[][];
}

export interface WalkStep {
  key: string;
  title: string;
  detail: Text;
  end?: boolean;
}

/** A chain of steps, then a numbered sequence. */
export interface WalkFigure extends FigureHead {
  kind: "walk";
  steps: WalkStep[];
  sequenceTitle: Text;
  sequence: Text[];
}

export type MeterTone = "subject" | "ink" | "bar";

export interface MeterPart {
  label: Text;
  value: number;
  tone: MeterTone;
}

export interface Meter {
  label: Text;
  unit: string;
  parts: MeterPart[];
  /** What is left of a larger whole; the whole is `of`. */
  rest?: { label: Text; of: number };
  /** Show each part as its value or as its share of the whole. */
  shown: "value" | "share";
}

export interface MetersFigure extends FigureHead {
  kind: "meters";
  meters: Meter[];
}

export interface ByteCell {
  value: string;
  variable?: boolean;
}

export interface ByteGroup {
  label: Text;
  span: number;
  variable?: boolean;
}

/** A frame as a row of byte cells, with the field groups below. */
export interface BytesFigure extends FigureHead {
  kind: "bytes";
  summary: Text;
  cells: ByteCell[];
  groups: ByteGroup[];
}

export type Figure =
  | ScopeFigure
  | BarsFigure
  | ColumnsFigure
  | BlocksFigure
  | WalkFigure
  | MetersFigure
  | BytesFigure;

export type FigureKind = Figure["kind"];

export interface SpecRow {
  param: Text;
  condition?: Text;
  value: Reading;
  /** The one key value of the sheet, set in the signal colour. */
  signal?: boolean;
}

/** A write-up of a sheet: a blog post, shown by its date unless `label` is given. */
export interface Writeup {
  slug: string;
  label?: string;
}

export interface SourceLink {
  label: Text;
  href: string;
}

/** One datasheet: header cells, description, parameter table and its figures. */
export interface SpecSheet {
  id: string;
  /** `W-01` */
  part: string;
  name: string;
  cls: Text;
  lang?: Text;
  target?: Text;
  writeups?: Writeup[];
  sources: SourceLink[];
  desc: Text;
  features?: Text[];
  rows: SpecRow[];
  figures: Figure[];
  /** Half sheets sit two to a row and stack their figure under the text. */
  size: "full" | "half";
}

export interface SmallBuild {
  name: string;
  /** An external page, or a blog post. */
  link: { href: string } | { slug: string };
  what: Text;
  value: Reading;
  context?: Text;
}

export interface Readout {
  id: string;
  label: Text;
  /** One number, or a range of two. */
  value: NumberReading | { from: number; to: number; dp: number; suffix?: string };
  caption: Text;
  /** In-page target, without `#`. */
  target: string;
}
