import { formatNumber } from "./format";
import { both } from "./types";
import type { BarsFigure } from "./figure-types";
import type { Text } from "./types";

/** Speedup of each campaign's final program over the untuned seed. */
export const VOLUND_SPEEDUPS = [2.24, 4.55, 5.45];
/** One campaign's latency on the shifted sparse-query workload, percent above the seed. */
export const VOLUND_REGRESSION_PERCENT = 9.7;

export type PaperStatus = "preprint" | "review" | "progress";

export interface Paper {
  id: string;
  name: string;
  title: Text;
  status: PaperStatus;
  /** Venue or state, shown beside the status badge. */
  statusNote: Text;
  authors?: string;
  /** Authors as a citation reads them. */
  cite?: string;
  summary: Text;
  doi?: string;
  code?: string;
  /** Blog post about the work, linked when released. */
  post?: string;
  figure?: BarsFigure;
}

const volundFigure: BarsFigure = {
  kind: "bars",
  id: "volund",
  n: "Fig. 4",
  title: both("Volund, final program vs seed", "Volund, programa final vs semente"),
  unit: both("speedup, ×", "ganho, ×"),
  max: 6,
  ticks: [0, 1, 2, 3, 4, 5, 6].map((value) => [value, `${value}×`]),
  dp: 2,
  suffix: "×",
  reference: 1,
  rows: [
    ...VOLUND_SPEEDUPS.map((value, index) => ({
      label: both(`campaign ${index + 1}`, `campanha ${index + 1}`),
      value,
      tone: "series" as const,
    })),
    {
      label: both("sparse-query shift", "consultas esparsas"),
      value: 1 / (1 + VOLUND_REGRESSION_PERCENT / 100),
      shown: {
        en: `+${formatNumber(VOLUND_REGRESSION_PERCENT, "en", 1)}% lat.`,
        pt: `+${formatNumber(VOLUND_REGRESSION_PERCENT, "pt", 1)}% lat.`,
      },
      tone: "aside",
    },
  ],
  summary: both(
    "Three campaigns: 2.24, 4.55 and 5.45 times faster than the seed. One campaign had about 9.7% higher latency on a shifted sparse-query workload.",
    "Três campanhas: 2,24, 4,55 e 5,45 vezes mais rápidas que a semente. Uma campanha teve cerca de 9,7% mais latência numa carga de consultas esparsas deslocada.",
  ),
  note: both(
    "Dashed line: the untuned seed (1×). The hatched row is the regression the paper reports: one campaign had about 9.7% higher latency on a shifted sparse-query workload, drawn at 1 / 1.097.",
    "Linha tracejada: a semente sem ajuste (1×). A linha hachurada é a regressão relatada no artigo: uma campanha teve cerca de 9,7% mais latência numa carga de consultas esparsas deslocada, desenhada em 1 / 1,097.",
  ),
};

export const PAPERS: Paper[] = [
  {
    id: "volund",
    name: "Volund",
    title: "An empirical study of unattended multi-agent program optimization",
    status: "preprint",
    statusNote: both("SSRN, Oct 2026", "SSRN, out. 2026"),
    authors: "Gustavo Widman, Laiza Ribeiro Silva",
    cite: "Widman, Ribeiro Silva",
    summary: both(
      "Three unattended multi-agent campaigns on a synthetic C++20 range-statistics engine finished 2.24×, 4.55× and 5.45× faster than the seed. One of them also showed about 9.7% higher latency on a shifted sparse-query workload, and the paper keeps that regression in view.",
      "Três campanhas multiagente sem supervisão, sobre um motor sintético de estatísticas de intervalo em C++20, terminaram 2,24×, 4,55× e 5,45× mais rápidas que a semente. Uma delas também teve cerca de 9,7% mais latência numa carga de consultas esparsas deslocada, e o artigo mantém essa regressão à vista.",
    ),
    doi: "10.2139/ssrn.7610439",
    code: "https://github.com/GustavoWidman/volund",
    post: "autonomous-loops",
    figure: volundFigure,
  },
  {
    id: "ferrisync",
    name: "FerriSync",
    title: both(
      "rsync, redesigned for multi-gigabit links",
      "rsync, redesenhado para links multigigabit",
    ),
    status: "review",
    statusNote: both("no public code yet", "ainda sem código público"),
    summary: both(
      "rsync's 1996 algorithm is CPU-bound on multi-gigabit links. FerriSync redesigns delta computation around content-defined chunking, cache-aware lookup and multiple cores.",
      "O algoritmo de 1996 do rsync é limitado pela CPU em links multigigabit. O FerriSync redesenha o cálculo de deltas em torno de content-defined chunking, busca cache-aware e múltiplos núcleos.",
    ),
    post: "modernizing-rsync",
  },
  {
    id: "gungnir",
    name: "gungnir",
    title: both(
      "Does the language matter to a coding agent?",
      "A linguagem importa para um agente de programação?",
    ),
    status: "progress",
    statusNote: both("paper forthcoming", "artigo em preparação"),
    summary: both(
      "A benchmark of coding agents across ~8 programming languages, model families and reasoning-effort levels.",
      "Um benchmark de agentes de programação em ~8 linguagens, famílias de modelos e níveis de esforço de raciocínio.",
    ),
  },
];

/** The paper the citation row under the readouts points to. */
export const FEATURED_PAPER = PAPERS[0];
