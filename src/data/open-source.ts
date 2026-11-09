import type { Localized } from "./types";

export interface Contribution {
  id: string;
  project: string;
  url: string;
  summary: Localized;
}

export const OPEN_SOURCE: Contribution[] = [
  {
    id: "oxi",
    project: "c0h1b4/oxi",
    url: "https://github.com/c0h1b4/oxi",
    summary: {
      en: "Rust + React mail client. #2 contributor (137 commits): Nix flake, CI gates, frontend fixes.",
      pt: "Cliente de e-mail em Rust + React. 2º maior contribuidor (137 commits): flake Nix, gates de CI, correções no frontend.",
    },
  },
  {
    id: "rig",
    project: "0xPlaygrounds/rig",
    url: "https://github.com/0xPlaygrounds/rig/pull/327",
    summary: { en: "Merged #327.", pt: "#327 aceito." },
  },
  {
    id: "rust-genai",
    project: "jeremychone/rust-genai",
    url: "https://github.com/jeremychone/rust-genai/pull/41",
    summary: { en: "Merged #41 (Gemini tool calls).", pt: "#41 aceito (tool calls do Gemini)." },
  },
  {
    id: "openai-api-rs",
    project: "dongri/openai-api-rs",
    url: "https://github.com/dongri/openai-api-rs/pull/146",
    summary: { en: "Merged #146 and #147.", pt: "#146 e #147 aceitos." },
  },
];
