import { formatNumber } from "../../data/format";
import { text } from "../../data/types";
import type { ScopeFigure, ScopeSeries } from "../../data/figure-types";
import type { Language } from "../../lib/config";

/** Minimum vertical distance between end labels, in percent of the plot height. */
const LABEL_GAP = 6.4;

export interface ScopePoint {
  /** Horizontal position in percent of the plot. */
  x: number;
  /** Height above the baseline in percent of the plot. */
  y: number;
  value: number;
  text: string;
}

export interface ScopeTrace {
  series: ScopeSeries;
  /** `subject`, `next`, `other` or `baseline`: how the trace is drawn. */
  tone: "subject" | "next" | "other" | "baseline";
  label: string;
  short: string;
  points: ScopePoint[];
  /** SVG `points` attribute in a 0..100 box, y downwards. */
  polyline: string;
  worst: string;
  /** Where the end label sits and where its leader starts, percent of plot height. */
  end: { y: number; labelY: number };
}

export interface ScopeLayout {
  columns: { label: string; x: number }[];
  yTicks: { label: string; y: number }[];
  traces: ScopeTrace[];
  /** Subject against the best competitor, per percentile, as signed percent text. */
  deltas: string[];
}

const PAINT_ORDER: ScopeTrace["tone"][] = ["other", "baseline", "next", "subject"];

/** Position on a log-spaced axis, log10(1 / (1 - p)), scaled so the last percentile is 100. */
function axisPositions(percentiles: number[]): number[] {
  const decades = (percent: number): number => Math.log10(1 / (1 - percent / 100));
  const last = decades(percentiles[percentiles.length - 1]);
  return percentiles.map((percent) => (decades(percent) / last) * 100);
}

function signedPercent(change: number, lang: Language): string {
  const rounded = Math.round(change * 100);
  const sign = rounded < 0 ? "−" : rounded > 0 ? "+" : "";
  return `${sign}${formatNumber(Math.abs(rounded), lang)}%`;
}

/** Pushes labels apart so none overlap, keeping their order and staying inside 0..100. */
function separate(positions: number[]): number[] {
  const placed = [...positions];
  for (let i = 1; i < placed.length; i++)
    placed[i] = Math.max(placed[i], placed[i - 1] + LABEL_GAP);
  let ceiling = 100;
  for (let i = placed.length - 1; i >= 0; i--) {
    placed[i] = Math.min(placed[i], ceiling);
    ceiling = placed[i] - LABEL_GAP;
  }
  return placed;
}

export function scopeLayout(figure: ScopeFigure, lang: Language): ScopeLayout {
  const xs = axisPositions(figure.percentiles);
  const last = figure.percentiles.length - 1;
  const above = (value: number): number => (value / figure.yMax) * 100;

  const competitors = figure.series.filter((series) => series.role === "other");
  const nextBest = competitors.reduce<ScopeSeries | undefined>(
    (best, series) => (!best || series.points[last] < best.points[last] ? series : best),
    undefined,
  );
  const subject = figure.series.find((series) => series.role === "subject");

  const traces = figure.series.map((series): ScopeTrace => {
    const points = series.points.map((value, i) => ({
      x: xs[i],
      y: above(value),
      value,
      text: formatNumber(value, lang, figure.valueDp),
    }));
    const label = text(series.label, lang);
    return {
      series,
      tone: series.role === "other" && series === nextBest ? "next" : series.role,
      label,
      short: series.short === undefined ? label : text(series.short, lang),
      points,
      polyline: points
        .map((point) => `${point.x.toFixed(3)},${(100 - point.y).toFixed(3)}`)
        .join(" "),
      worst: formatNumber(series.worst, lang, figure.valueDp),
      end: { y: points[last].y, labelY: points[last].y },
    };
  });

  const byHeight = [...traces].sort((a, b) => a.end.y - b.end.y);
  const spread = separate(byHeight.map((trace) => trace.end.y));
  byHeight.forEach((trace, i) => {
    trace.end.labelY = spread[i];
  });

  const deltas = figure.percentiles.map((_, i) => {
    const best = Math.min(...competitors.map((series) => series.points[i]));
    return subject && Number.isFinite(best)
      ? signedPercent((subject.points[i] - best) / best, lang)
      : "";
  });

  return {
    columns: figure.percentiles.map((percent, i) => ({
      label: `p${formatNumber(percent, lang)}`,
      x: xs[i],
    })),
    yTicks: figure.yTicks.map((tick) => ({ label: formatNumber(tick, lang), y: above(tick) })),
    traces,
    deltas,
  };
}

/** Traces in paint order, the subject last so it lies on top. */
export function paintOrder(traces: ScopeTrace[]): ScopeTrace[] {
  return [...traces].sort((a, b) => PAINT_ORDER.indexOf(a.tone) - PAINT_ORDER.indexOf(b.tone));
}
