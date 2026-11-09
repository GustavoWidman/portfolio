import type { Localized } from "./types";

/** One measured value: number and unit, and what it measures. */
export interface PostFigure {
  value: Localized;
  unit?: string;
  label: Localized;
}

/** A key-figures row; `signal` marks the one value the post is about (at most one per post). */
export interface KeyFigure extends PostFigure {
  signal?: true;
}

/**
 * Measured results of a post, keyed by slug. `list` is the figure in the Measured column of
 * post listings; `key` is the Key figures box on the post page, with the conditions the
 * numbers were measured under. Every number is stated in the post itself. A post without a
 * measured result has no entry.
 */
export interface PostFigures {
  list?: PostFigure;
  key?: { rows: KeyFigure[]; conditions: Localized };
}

export const POST_FIGURES: Readonly<Record<string, PostFigures>> = {
  upstreamer: {
    list: {
      value: { en: "41 → 4.15", pt: "41 → 4,15" },
      unit: "ms",
      label: { en: "p99.99, one-line fix", pt: "p99,99, correção de uma linha" },
    },
    key: {
      rows: [
        {
          value: { en: "76,663", pt: "76.663" },
          unit: "req/s",
          label: { en: "throughput, 8.7% over HAProxy", pt: "vazão, 8,7% acima do HAProxy" },
        },
        {
          value: { en: "3.81", pt: "3,81" },
          unit: "ms",
          label: {
            en: "p99.99, lowest of every proxy tested",
            pt: "p99,99, o menor entre os proxies testados",
          },
          signal: true,
        },
        {
          value: { en: "41 → 4.15", pt: "41 → 4,15" },
          unit: "ms",
          label: {
            en: "p99.99 before and after TCP_NODELAY",
            pt: "p99,99 antes e depois do TCP_NODELAY",
          },
        },
      ],
      conditions: {
        en: "oha · 50 connections · 500,000 requests per target · one 14-core macOS host, localhost",
        pt: "oha · 50 conexões · 500.000 requisições por alvo · um host macOS de 14 núcleos, localhost",
      },
    },
  },
  "autonomous-loops": {
    list: {
      value: { en: "2.24–5.45", pt: "2,24–5,45" },
      unit: "×",
      label: { en: "final programs vs seed", pt: "programas finais vs. inicial" },
    },
    key: {
      rows: [
        {
          value: { en: "2.24 · 4.55 · 5.45", pt: "2,24 · 4,55 · 5,45" },
          unit: "×",
          label: {
            en: "final program vs seed, per campaign",
            pt: "programa final vs. inicial, por campanha",
          },
          signal: true,
        },
        {
          value: { en: "+9.7", pt: "+9,7" },
          unit: "%",
          label: {
            en: "latency of one campaign on a shifted sparse-query workload",
            pt: "latência de uma campanha numa carga de consultas esparsas deslocadas",
          },
        },
      ],
      conditions: {
        en: "three unattended campaigns from the same seed · synthetic C++20 range-statistics engine · final transfer portfolio",
        pt: "três campanhas sem supervisão a partir da mesma implementação inicial · motor sintético de estatísticas por intervalo em C++20 · conjunto final de cargas de transferência",
      },
    },
  },
  iris: {
    list: {
      value: { en: "16,777,216", pt: "16.777.216" },
      label: { en: "RGB inputs checked", pt: "entradas RGB verificadas" },
    },
    key: {
      rows: [
        {
          value: { en: "16,777,216", pt: "16.777.216" },
          label: { en: "byte RGB inputs checked", pt: "entradas RGB de 8 bits verificadas" },
          signal: true,
        },
        {
          value: { en: "> 100M", pt: "> 100 mi" },
          label: {
            en: "neighboring transitions checked",
            pt: "transições entre valores vizinhos verificadas",
          },
        },
      ],
      conditions: {
        en: "color correction · host test suites with GCC, Clang and undefined-behavior sanitization",
        pt: "correção de cor · suítes de teste no host com GCC, Clang e sanitização de comportamento indefinido",
      },
    },
  },
  "1brc": {
    list: {
      value: { en: "~1.4", pt: "~1,4" },
      unit: "s",
      label: { en: "1B rows, M3 Max", pt: "1 bi de linhas, M3 Max" },
    },
    key: {
      rows: [
        {
          value: { en: "1.415", pt: "1,415" },
          unit: "s",
          label: {
            en: "one billion rows, no platform intrinsics",
            pt: "um bilhão de linhas, sem intrínsecos de plataforma",
          },
          signal: true,
        },
        {
          value: { en: "1.240", pt: "1,240" },
          unit: "s",
          label: {
            en: "after two PRs with aarch64 intrinsics",
            pt: "depois de dois PRs com intrínsecos aarch64",
          },
        },
      ],
      conditions: {
        en: "M3 Max · 14 workers · warm cache",
        pt: "M3 Max · 14 workers · cache quente",
      },
    },
  },
  "rinha-de-backend": {
    list: {
      value: { en: "~2,900", pt: "~2.900" },
      unit: "req/s",
      label: { en: "target was 340", pt: "a meta era 340" },
    },
    key: {
      rows: [
        {
          value: { en: "~2,900", pt: "~2.900" },
          unit: "req/s",
          label: { en: "sustained, final run", pt: "sustentadas, rodada final" },
          signal: true,
        },
        {
          value: { en: "0.5", pt: "0,5" },
          unit: "ms",
          label: { en: "p50 latency", pt: "latência p50" },
        },
        {
          value: { en: "340", pt: "340" },
          unit: "req/s",
          label: { en: "the challenge's baseline goal", pt: "a meta base do desafio" },
        },
      ],
      conditions: {
        en: "rinha de backend 2024 q1 load tester · the challenge's CPU and memory limits",
        pt: "testador de carga da rinha de backend 2024 q1 · limites de CPU e memória do desafio",
      },
    },
  },
  "rnn-rust": {
    list: {
      value: { en: "~60", pt: "~60" },
      unit: "×",
      label: { en: "vs PyTorch, small dataset", pt: "vs. PyTorch, dataset pequeno" },
    },
    key: {
      rows: [
        {
          value: { en: "2.4 vs 140", pt: "2,4 vs. 140" },
          unit: "s",
          label: {
            en: "Rust vs PyTorch, 1M epochs, 3-5-1 network",
            pt: "Rust vs. PyTorch, 1 mi de épocas, rede 3-5-1",
          },
          signal: true,
        },
        {
          value: { en: "10–12 vs 60–65", pt: "10–12 vs. 60–65" },
          unit: "s",
          label: {
            en: "Rust vs PyTorch, credit card fraud dataset, 100 epochs",
            pt: "Rust vs. PyTorch, dataset de fraude de cartão, 100 épocas",
          },
        },
      ],
      conditions: {
        en: "same architecture, data and hyperparameters on both sides · average training time",
        pt: "mesma arquitetura, dados e hiperparâmetros nos dois lados · tempo médio de treino",
      },
    },
  },
};

export function postFigures(slug: string): PostFigures | undefined {
  return POST_FIGURES[slug];
}
