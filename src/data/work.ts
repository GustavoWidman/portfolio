import { BACKEND, BENCHMARK, BENCHMARK_CONDITIONS, UPSTREAMER } from "./benchmark";
import { formatNumber } from "./format";
import { both } from "./types";
import type {
  BarsFigure,
  ColumnsFigure,
  MetersFigure,
  SmallBuild,
  SpecSheet,
} from "./figure-types";

/** Facts that more than one figure, row or readout quotes. */
export const GLASSJAW = {
  weightsKb: 14,
  ramKb: 520,
  spectrogramMs: 46,
  inferenceMs: 787,
  auc: 0.93,
  onnxLines: 700,
};
export const ONE_BRC_SECONDS = 1.4;
export const HTTP_CRATES = 0;

/** p99.99 in milliseconds after each attempt at the 40 ms tail; the sixth fixed it. */
const TAIL_BEFORE_FIX = 41;
const TAIL_AFTER_FIX = 4.15;

const nbsp = (value: string): string => value.replaceAll(" ", " ");

const throughputFigure: BarsFigure = {
  kind: "bars",
  id: "throughput",
  n: "Fig. 1.1",
  title: both("Throughput", "Vazão"),
  unit: both("req/s, higher is better", "req/s, maior é melhor"),
  max: 80000,
  ticks: [
    [0, "0"],
    [20000, "20k"],
    [40000, "40k"],
    [60000, "60k"],
    [80000, "80k"],
  ],
  rows: [...BENCHMARK]
    .filter((item) => item.role !== "baseline")
    .sort((a, b) => b.rps - a.rps)
    .map((item) => ({
      label: item.name,
      value: item.rps,
      tone: item.role === "subject" ? ("subject" as const) : undefined,
    })),
  summary: both(
    "Requests per second on the same harness as Fig. 0.",
    "Requisições por segundo, com o mesmo harness da Fig. 0.",
  ),
  note: {
    en: `Same harness as Fig. 0. Backend alone, no proxy: ${formatNumber(BACKEND.rps, "en")} req/s.`,
    pt: `Mesmo harness da Fig. 0. Backend sozinho, sem proxy: ${formatNumber(BACKEND.rps, "pt")} req/s.`,
  },
};

const tailFigure: ColumnsFigure = {
  kind: "columns",
  id: "attempts",
  n: "Fig. 1.2",
  title: both("p99.99 per attempt", "p99,99 por tentativa"),
  unit: both("ms, from the write-up", "ms, do texto"),
  max: 45,
  rows: [
    { n: "0", label: both("first run", "primeira execução"), value: TAIL_BEFORE_FIX },
    { n: "1", label: both("jemalloc decay", "decay do jemalloc"), value: TAIL_BEFORE_FIX },
    { n: "2", label: both("metrics thread", "thread de métricas"), value: TAIL_BEFORE_FIX },
    { n: "3", label: "cpu pinning", value: TAIL_BEFORE_FIX },
    { n: "4", label: both("arcswap removal", "remoção do arcswap"), value: TAIL_BEFORE_FIX },
    { n: "5", label: both("string alloc", "alocação de string"), value: TAIL_BEFORE_FIX },
    { n: "6", label: "TCP_NODELAY", value: TAIL_AFTER_FIX, subject: true },
  ],
  summary: both(
    "p99.99 latency in milliseconds after each attempt at the 40 ms tail.",
    "Latência p99,99 em milissegundos após cada tentativa de eliminar a cauda de 40 ms.",
  ),
  note: both(
    `Attempts 1–5 (jemalloc decay, metrics thread, CPU pinning, ArcSwap removal, string alloc) left the tail at ${TAIL_BEFORE_FIX} ms. Attempt 6 was one line: \`set_nodelay(true)\`.`,
    `As tentativas 1 a 5 (decay do jemalloc, thread de métricas, CPU pinning, remoção do ArcSwap, alocação de string) deixaram a cauda em ${TAIL_BEFORE_FIX} ms. A tentativa 6 foi uma linha: \`set_nodelay(true)\`.`,
  ),
};

const meterFigure: MetersFigure = {
  kind: "meters",
  id: "budget",
  n: "Fig. 5",
  title: both("On-device budget", "Orçamento no dispositivo"),
  unit: "ESP32",
  meters: [
    {
      label: both("Weights vs RAM", "Pesos vs RAM"),
      unit: "KB",
      parts: [
        { label: both("int8 weights", "pesos int8"), value: GLASSJAW.weightsKb, tone: "subject" },
      ],
      rest: { label: both("rest of RAM", "resto da RAM"), of: GLASSJAW.ramKb },
      shown: "share",
    },
    {
      label: both("Compute time", "Tempo de computação"),
      unit: "ms",
      parts: [
        {
          label: both("log-mel spectrogram", "espectrograma log-mel"),
          value: GLASSJAW.spectrogramMs,
          tone: "ink",
        },
        {
          label: both("int8 CNN inference", "inferência da CNN int8"),
          value: GLASSJAW.inferenceMs,
          tone: "bar",
        },
      ],
      shown: "value",
    },
  ],
};

export const SPEC_SHEETS: SpecSheet[] = [
  {
    id: "upstreamer",
    part: "W-01",
    name: "upstreamer",
    cls: "L7 reverse proxy · hyper + tokio",
    lang: "Rust",
    target: "Kubernetes",
    writeups: [{ slug: "upstreamer" }],
    sources: [
      { label: both("Source", "Código"), href: "https://github.com/GustavoWidman/upstreamer" },
    ],
    desc: {
      en: `Routes by host and path, balances on EWMA latency, rate-limits each client IP with a token bucket, discovers upstreams from Kubernetes and swaps its whole config lock-free through \`ArcSwap\` without dropping a connection. Benchmarked against the proxies people actually run. A bimodal ${nbsp("40 ms")} tail turned out to be Nagle meeting delayed ACK: six attempts to find, one line to fix.`,
      pt: `Roteia por host e caminho, balanceia pela latência EWMA, limita cada IP de cliente com um token bucket, descobre upstreams no Kubernetes e troca toda a configuração sem lock, via \`ArcSwap\`, sem derrubar conexões. Medido contra os proxies que as pessoas realmente usam. Uma cauda bimodal de ${nbsp("40 ms")} acabou sendo o Nagle encontrando o delayed ACK: seis tentativas para achar, uma linha para corrigir.`,
    },
    features: [
      both("Active + passive health checks", "Health checks ativos e passivos"),
      both("Prometheus metrics, separate port", "Métricas Prometheus em porta separada"),
      both("jemalloc, ~6% CPU was in malloc", "jemalloc: ~6% da CPU estava no malloc"),
      both("Per-IP token buckets", "Token buckets por IP"),
    ],
    rows: [
      {
        param: both("Throughput", "Vazão"),
        condition: BENCHMARK_CONDITIONS,
        value: { value: UPSTREAMER.rps, unit: "req/s" },
      },
      {
        param: both("Latency, p99.99", "Latência, p99,99"),
        condition: both("lowest of all proxies tested", "menor entre todos os proxies testados"),
        value: { value: UPSTREAMER.latency[3], dp: 2, unit: "ms" },
        signal: true,
      },
      {
        param: both("p99.99 before fix", "p99,99 antes da correção"),
        condition: "Nagle + delayed ACK",
        value: { value: TAIL_BEFORE_FIX, unit: "ms" },
      },
      {
        param: both("Concurrency cap", "Limite de concorrência"),
        condition: both("100% 2xx, same as backend", "100% 2xx, igual ao backend"),
        value: { value: UPSTREAMER.cap, unit: both("conns", "conexões") },
      },
    ],
    figures: [throughputFigure, tailFigure],
    size: "full",
  },
  {
    id: "netstack",
    part: "W-02",
    name: "udp · tcp · http",
    cls: both("Network stack from scratch", "Pilha de rede do zero"),
    lang: "Rust",
    target: "raw sockets · TUN",
    writeups: [
      { slug: "udp-impl", label: "udp" },
      { slug: "tcp-impl", label: "tcp" },
      { slug: "http-impl", label: "http" },
    ],
    sources: [
      { label: "udp-impl", href: "https://github.com/GustavoWidman/udp-impl" },
      { label: "tcp-impl", href: "https://github.com/GustavoWidman/tcp-impl" },
      { label: "http-impl", href: "https://github.com/GustavoWidman/http-impl" },
    ],
    desc: both(
      "Written bottom-up. UDP over raw sockets with hand-built headers and checksums. A userspace TCP over a TUN device, on Linux and macOS `utun`, that interoperates with the kernel's own `nc`. Then HTTP/1.1, client and server, on top of that homemade TCP.",
      "Escrita de baixo para cima. UDP sobre raw sockets, com headers e checksums montados à mão. Um TCP em userspace sobre um dispositivo TUN, no Linux e no `utun` do macOS, que interopera com o `nc` do próprio kernel. Depois, HTTP/1.1, cliente e servidor, em cima desse TCP caseiro.",
    ),
    rows: [
      {
        param: both("TCP state machine", "Máquina de estados TCP"),
        condition: "RFC 793",
        value: { text: both("happy path", "caminho feliz") },
      },
      {
        param: both("Close", "Fechamento"),
        condition: both("simultaneous close", "close simultâneo"),
        value: { text: both("handled", "tratado") },
      },
      {
        param: both("Interop", "Interoperação"),
        condition: "Linux TUN, macOS utun",
        value: { text: both("kernel nc", "nc do kernel") },
      },
      {
        param: "DNS",
        value: { text: both("own client", "cliente próprio") },
      },
      {
        param: both("HTTP crates", "Crates de HTTP"),
        value: { value: HTTP_CRATES },
        signal: true,
      },
    ],
    figures: [
      {
        kind: "blocks",
        id: "layers",
        n: "Fig. 2",
        title: both("Block diagram", "Diagrama de blocos"),
        unit: both("each layer built on the one below", "cada camada sobre a de baixo"),
        layers: [
          [
            {
              tag: "http-impl",
              title: "HTTP/1.1 client + server",
              detail: both(
                "chunked transfer · own DNS client",
                "chunked transfer · cliente DNS próprio",
              ),
              own: true,
            },
          ],
          [
            {
              tag: "tcp-impl",
              title: "TCP, userspace",
              detail: both(
                "RFC 793 state machine · RFC 1071 checksums",
                "máquina de estados da RFC 793 · checksums da RFC 1071",
              ),
              own: true,
            },
            {
              tag: "udp-impl",
              title: "UDP",
              detail: both("hand-built headers + checksums", "headers e checksums à mão"),
              own: true,
            },
          ],
          [
            { tag: "dev", title: "TUN · utun", detail: "Linux · macOS" },
            { tag: "dev", title: "raw socket" },
          ],
          [
            {
              tag: "kernel",
              title: both("host network stack", "pilha de rede do host"),
              detail: both("interop verified against `nc`", "interoperação verificada com o `nc`"),
              span: 2,
            },
          ],
        ],
        note: both(
          "Hatched blocks are written from scratch.",
          "Os blocos hachurados foram escritos do zero.",
        ),
      },
    ],
    size: "full",
  },
  {
    id: "based-kernel",
    part: "W-03",
    name: "based-kernel",
    cls: both("x86-64 kernel", "Kernel x86-64"),
    lang: "Rust no_std · asm",
    target: "x86-64, bare metal",
    writeups: [{ slug: "based-kernel" }],
    sources: [
      { label: both("Source", "Código"), href: "https://github.com/GustavoWidman/based-kernel" },
    ],
    desc: {
      en: `A kernel in \`no_std\` Rust. A hand-written assembly bootstrap builds the four-level page tables, identity-maps ${nbsp("1 GiB")} with ${nbsp("2 MiB")} pages, enables PAE and jumps to long mode. Rust takes over from there: a heap allocator, interrupt-driven keyboard input and VGA output.`,
      pt: `Um kernel em Rust \`no_std\`. Um bootstrap em assembly escrito à mão monta as tabelas de páginas de quatro níveis, faz identity-map de ${nbsp("1 GiB")} com páginas de ${nbsp("2 MiB")}, habilita PAE e salta para o long mode. A partir daí o Rust assume: um alocador de heap, teclado orientado a interrupções e saída VGA.`,
    },
    rows: [
      {
        param: both("Boot path", "Caminho de boot"),
        condition: both("hand-written asm", "asm escrito à mão"),
        value: { text: "PAE → long mode" },
      },
      {
        param: both("Page size", "Tamanho de página"),
        condition: both("4-level tables, PS=1", "tabelas de 4 níveis, PS=1"),
        value: { value: 2, unit: "MiB" },
      },
      {
        param: "Identity map",
        condition: "512 × 2 MiB",
        value: { value: 1, unit: "GiB" },
      },
      {
        param: "Drivers",
        condition: both("keyboard via interrupts", "teclado por interrupções"),
        value: { text: both("keyboard, VGA", "teclado, VGA") },
      },
    ],
    figures: [
      {
        kind: "walk",
        id: "pagewalk",
        n: "Fig. 3",
        title: both("Page-table walk at boot", "Percurso das tabelas de páginas no boot"),
        unit: both("built in assembly", "montado em assembly"),
        steps: [
          { key: "L4", title: "PML4", detail: both("512 GiB per entry", "512 GiB por entrada") },
          { key: "L3", title: "PDPT", detail: both("1 GiB per entry", "1 GiB por entrada") },
          {
            key: "L2",
            title: "PD",
            detail: both("2 MiB per entry, PS=1", "2 MiB por entrada, PS=1"),
          },
          {
            key: "map",
            title: "512 × 2 MiB",
            detail: "= 1 GiB, identity",
            end: true,
          },
        ],
        sequenceTitle: both("Boot sequence", "Sequência de boot"),
        sequence: [
          both("asm bootstrap", "bootstrap em asm"),
          both("page tables", "tabelas de páginas"),
          both("PAE on", "PAE ligado"),
          "long mode",
          "Rust, no_std",
        ],
        note: both(
          "With 2 MiB pages the walk stops at the page directory; no L1 tables are needed.",
          "Com páginas de 2 MiB o percurso termina no page directory; não são necessárias tabelas L1.",
        ),
      },
    ],
    size: "full",
  },
  {
    id: "glassjaw",
    part: "W-04",
    name: "glassjaw",
    cls: both("Acoustic glass-break detector", "Detector acústico de quebra de vidro"),
    target: "ESP32 · FreeRTOS",
    sources: [
      { label: both("Source", "Código"), href: "https://github.com/GustavoWidman/glassjaw" },
    ],
    desc: {
      en: `I2S microphone to log-mel spectrogram to an int8 CNN, as a FreeRTOS pipeline over a lock-free ring buffer. The ONNX runtime is written from scratch, because the real one does not fit in ${nbsp(`${GLASSJAW.ramKb} KB`)} of RAM.`,
      pt: `Microfone I2S, espectrograma log-mel, CNN int8: um pipeline FreeRTOS sobre um ring buffer lock-free. O runtime ONNX foi escrito do zero, porque o oficial não cabe nos ${nbsp(`${GLASSJAW.ramKb} KB`)} de RAM.`,
    },
    rows: [
      {
        param: both("Weights", "Pesos"),
        condition: both("int8 CNN", "CNN int8"),
        value: { value: GLASSJAW.weightsKb, unit: "KB" },
        signal: true,
      },
      {
        param: "AUC",
        condition: both(
          `int8, ${GLASSJAW.weightsKb} KB model`,
          `modelo int8 de ${GLASSJAW.weightsKb} KB`,
        ),
        value: { value: GLASSJAW.auc, dp: 2 },
      },
      {
        param: both("Inference", "Inferência"),
        condition: both("on device", "no dispositivo"),
        value: { value: GLASSJAW.inferenceMs, unit: "ms" },
      },
      {
        param: both("ONNX runtime", "Runtime ONNX"),
        condition: both(
          `own, fits ${GLASSJAW.ramKb} KB RAM`,
          `próprio, cabe em ${GLASSJAW.ramKb} KB de RAM`,
        ),
        value: { value: GLASSJAW.onnxLines, prefix: "~", unit: both("lines", "linhas") },
      },
    ],
    figures: [meterFigure],
    size: "half",
  },
  {
    id: "iris",
    part: "W-05",
    name: "iris",
    cls: both("Matter-to-Bluetooth bridge", "Ponte Matter para Bluetooth"),
    target: "ESP32-S3",
    writeups: [{ slug: "iris" }],
    sources: [{ label: both("Source", "Código"), href: "https://github.com/GustavoWidman/iris" }],
    desc: both(
      "Puts cheap Bluetooth LED strips into Apple Home over Matter. The strip's BLE frame was reverse-engineered, and the color correction was validated over the whole RGB cube, not a sample of it.",
      "Coloca fitas de LED Bluetooth baratas no Apple Home via Matter. O frame BLE da fita passou por engenharia reversa, e a correção de cor foi validada no cubo RGB inteiro, não numa amostra.",
    ),
    rows: [
      {
        param: both("Inputs validated", "Entradas validadas"),
        condition: both("every 24-bit RGB value", "todo valor RGB de 24 bits"),
        value: { value: 16777216 },
        signal: true,
      },
      {
        param: both("BLE frame", "Frame BLE"),
        condition: both("reverse-engineered", "engenharia reversa"),
        value: { value: 7, unit: "bytes" },
      },
      {
        param: both("Home protocol", "Protocolo no Home"),
        value: { text: "Matter" },
      },
    ],
    figures: [
      {
        kind: "bytes",
        id: "frame",
        n: "Fig. 6",
        title: both("BLE color frame", "Frame BLE de cor"),
        unit: both("reverse-engineered", "engenharia reversa"),
        summary: both(
          "BLE frame bytes by offset: 69 96 05 02, then red, green and blue.",
          "Bytes do frame BLE por deslocamento: 69 96 05 02, depois vermelho, verde e azul.",
        ),
        cells: [
          { value: "69" },
          { value: "96" },
          { value: "05" },
          { value: "02" },
          { value: "R", variable: true },
          { value: "G", variable: true },
          { value: "B", variable: true },
        ],
        groups: [
          { label: both("fixed header", "cabeçalho fixo"), span: 4 },
          { label: both("color, 8 bit each", "cor, 8 bits cada"), span: 3, variable: true },
        ],
        note: {
          en: `Color correction checked against all ${formatNumber(16777216, "en")} RGB inputs.`,
          pt: `Correção de cor verificada nas ${formatNumber(16777216, "pt")} entradas RGB.`,
        },
      },
    ],
    size: "half",
  },
];

export const SMALL_BUILDS: SmallBuild[] = [
  {
    name: "pantheon",
    link: { href: "https://github.com/GustavoWidman/pantheon" },
    what: both(
      "Always-on agent harness in Rust, shipped as a NixOS module: durable memory, background sub-agents, crash recovery, MCP over stdio and HTTP.",
      "Harness de agentes sempre ativo em Rust, distribuído como módulo NixOS: memória durável, sub-agentes em segundo plano, recuperação de falhas, MCP via stdio e HTTP.",
    ),
    value: { value: 48, unit: "releases" },
    context: both("latest v0.21.3", "mais recente: v0.21.3"),
  },
  {
    name: "nix",
    link: { href: "https://github.com/GustavoWidman/nix" },
    what: both(
      "One flake for 6 machines, servers to a headless Mac mini for agents: agenix secrets, mesh VPN, mail, DNS, a self-hosted Tailscale DERP relay.",
      "Um flake para 6 máquinas, de servidores a um Mac mini headless para agentes: segredos com agenix, VPN mesh, e-mail, DNS e um relay DERP do Tailscale auto-hospedado.",
    ),
    value: { value: 779, unit: "commits" },
  },
  {
    name: "1brc",
    link: { slug: "1brc" },
    what: both(
      "One billion rows aggregated with mmap, memchr and fixed-point parsing. No platform intrinsics.",
      "Um bilhão de linhas agregadas com mmap, memchr e parsing em ponto fixo. Sem intrinsics de plataforma.",
    ),
    value: { value: ONE_BRC_SECONDS, dp: 1, prefix: "~", unit: "s" },
    context: "M3 Max",
  },
  {
    name: "rinha-de-backend",
    link: { slug: "rinha-de-backend" },
    what: both(
      "Postgres replaced by tuned SQLite inside a 1.5 CPU / 550 MB limit.",
      "Postgres trocado por um SQLite ajustado, dentro de um limite de 1,5 CPU / 550 MB.",
    ),
    value: { value: 2917, unit: "req/s" },
    context: both("~8.6× the target", "~8,6× a meta"),
  },
  {
    name: "rnn-rust",
    link: { slug: "rnn-rust" },
    what: both(
      "Zero-dependency RNN with const-generic shapes; the win came from removing allocations.",
      "RNN sem dependências, com shapes em const generics; o ganho veio de eliminar alocações.",
    ),
    value: { value: 60, prefix: "~", unit: "×" },
    context: both("vs PyTorch, small dataset", "vs PyTorch, dataset pequeno"),
  },
  {
    name: "crates.io",
    link: { href: "https://crates.io/crates/rig-dyn" },
    what: both(
      "`rig-dyn` and `easy-config-store`, published crates.",
      "`rig-dyn` e `easy-config-store`, crates publicadas.",
    ),
    value: { value: 4.9, dp: 1, prefix: "~", suffix: "k", unit: "dl" },
    context: both("combined downloads", "downloads somados"),
  },
];
