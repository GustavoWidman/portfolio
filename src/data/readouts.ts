import { UPSTREAMER } from "./benchmark";
import { both } from "./types";
import type { Readout } from "./figure-types";
import { VOLUND_SPEEDUPS } from "./research";
import { GLASSJAW, HTTP_CRATES, ONE_BRC_SECONDS } from "./work";

/** One measured figure per body of work, in page order. */
export const READOUTS: Readout[] = [
  {
    id: "proxy",
    label: "Reverse proxy",
    value: { value: UPSTREAMER.rps, unit: "req/s" },
    caption: both(
      "ahead of HAProxy, nginx, Caddy and Apache",
      "à frente de HAProxy, nginx, Caddy e Apache",
    ),
    target: "upstreamer",
  },
  {
    id: "netstack",
    label: both("Network stack", "Pilha de rede"),
    value: { value: HTTP_CRATES, unit: both("HTTP crates", "crates de HTTP") },
    caption: both(
      "UDP, TCP and HTTP/1.1 from raw sockets up",
      "UDP, TCP e HTTP/1.1 a partir de raw sockets",
    ),
    target: "netstack",
  },
  {
    id: "embedded",
    label: both("Embedded ML", "ML embarcado"),
    value: { value: GLASSJAW.weightsKb, unit: "KB" },
    caption: both(
      "int8 CNN on an ESP32, own ONNX runtime, AUC 0.93",
      "CNN int8 num ESP32, runtime ONNX próprio, AUC 0,93",
    ),
    target: "glassjaw",
  },
  {
    id: "agents",
    label: both("Agent research", "Pesquisa com agentes"),
    value: {
      from: Math.min(...VOLUND_SPEEDUPS),
      to: Math.max(...VOLUND_SPEEDUPS),
      dp: 2,
      suffix: "×",
    },
    caption: both(
      "unattended optimization campaigns vs seed",
      "campanhas de otimização sem supervisão vs semente",
    ),
    target: "research",
  },
  {
    id: "aggregation",
    label: both("1B-row aggregation", "Agregação de 1B linhas"),
    value: { value: ONE_BRC_SECONDS, dp: 1, prefix: "~", unit: "s" },
    caption: both("1BRC on an M3 Max, no intrinsics", "1BRC num M3 Max, sem intrinsics"),
    target: "more",
  },
];
