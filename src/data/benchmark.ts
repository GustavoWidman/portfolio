import { both } from "./types";
import type { Localized, Text } from "./types";
import type { ScopeFigure, SeriesRole } from "./figure-types";

/**
 * The upstreamer benchmark: 50 connections, 500k requests per target, one 14-core macOS
 * host over loopback, load from `oha`. Latencies are milliseconds at p50, p99, p99.9 and
 * p99.99, then the single slowest request. Every figure and spec row that quotes these
 * numbers derives from this table.
 */
export const BENCHMARK_PERCENTILES = [50, 99, 99.9, 99.99];

export interface BenchmarkTarget {
  id: string;
  name: Text;
  short?: Text;
  role: SeriesRole;
  /** Requests per second. */
  rps: number;
  latency: number[];
  worst: number;
  /** Highest probed concurrency that stayed at 100% 2xx. */
  cap: number;
}

export const BENCHMARK: BenchmarkTarget[] = [
  {
    id: "upstreamer",
    name: "upstreamer",
    role: "subject",
    rps: 76663,
    latency: [0.64, 0.79, 1.83, 3.81],
    worst: 5.38,
    cap: 4800,
  },
  {
    id: "nginx-1w",
    name: "nginx, 1 worker",
    short: "nginx 1w",
    role: "other",
    rps: 68637,
    latency: [0.76, 0.86, 2.05, 4.78],
    worst: 4.97,
    cap: 1500,
  },
  {
    id: "haproxy",
    name: "HAProxy",
    role: "other",
    rps: 70503,
    latency: [0.7, 0.92, 1.95, 5.21],
    worst: 8.24,
    cap: 2000,
  },
  {
    id: "caddy",
    name: "Caddy",
    role: "other",
    rps: 66195,
    latency: [0.72, 1.66, 2.53, 6.97],
    worst: 11.94,
    cap: 1700,
  },
  {
    id: "apache",
    name: "Apache",
    role: "other",
    rps: 57518,
    latency: [0.85, 1.38, 2.53, 7.21],
    worst: 7.32,
    cap: 50,
  },
  {
    id: "nginx-auto",
    name: "nginx, auto",
    short: "nginx auto",
    role: "other",
    rps: 69477,
    latency: [0.7, 1.01, 2.15, 7.25],
    worst: 9.14,
    cap: 4000,
  },
  {
    id: "backend",
    name: both("backend, no proxy", "backend, sem proxy"),
    short: "backend",
    role: "baseline",
    rps: 154998,
    latency: [0.32, 0.41, 0.95, 3.39],
    worst: 3.57,
    cap: 4800,
  },
];

const target = (id: string): BenchmarkTarget => {
  const found = BENCHMARK.find((item) => item.id === id);
  if (!found) throw new Error(`unknown benchmark target ${id}`);
  return found;
};

export const UPSTREAMER = target("upstreamer");
export const BACKEND = target("backend");

/**
 * Series of the hero scope: the subject first, the competitors by their last value, the
 * baseline last.
 */
const SERIES_ORDER: Record<SeriesRole, number> = { subject: 0, other: 1, baseline: 2 };

export const HERO_SCOPE: ScopeFigure = {
  kind: "scope",
  id: "latency",
  n: "Fig. 0",
  title: both("Latency by percentile", "Latência por percentil"),
  unit: both("ms, lower is better", "ms, menor é melhor"),
  percentiles: BENCHMARK_PERCENTILES,
  yMax: 8,
  yTicks: [0, 2, 4, 6, 8],
  valueUnit: "ms",
  valueDp: 2,
  series: [...BENCHMARK]
    .sort(
      (a, b) =>
        SERIES_ORDER[a.role] - SERIES_ORDER[b.role] ||
        (a.latency.at(-1) ?? 0) - (b.latency.at(-1) ?? 0),
    )
    .map((item) => ({
      id: item.id,
      label: item.name,
      short: item.short,
      role: item.role,
      points: item.latency,
      worst: item.worst,
    })),
  conditions: both(
    "oha · 50 conns · 500k req · one 14-core macOS host, loopback · x log-spaced",
    "oha · 50 conexões · 500 mil req · um host macOS de 14 núcleos, loopback · eixo x logarítmico",
  ),
};

export const BENCHMARK_CONDITIONS: Localized = both(
  "50 conns, 500k req",
  "50 conexões, 500 mil req",
);
