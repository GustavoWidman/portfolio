import { AUTHOR } from "../lib/config";
import type { Localized } from "./types";

export const PROFILE = {
  name: AUTHOR.name,
  role: {
    en: "Software Engineer II (Rust) at Azion",
    pt: "Engenheiro de Software II (Rust) na Azion",
  } satisfies Localized,
  /** The role as the hero states it, with the area of work. */
  heroRole: {
    en: "Software Engineer II (Rust) at Azion, edge/CDN",
    pt: "Engenheiro de Software II (Rust) na Azion, edge/CDN",
  } satisfies Localized,
  city: "São Paulo",
  shortRole: {
    en: "Software Engineer (Rust)",
    pt: "Engenheiro de Software (Rust)",
  } satisfies Localized,
  location: { en: "São Paulo, Brazil", pt: "São Paulo, Brasil" } satisfies Localized,
  motto: {
    en: "systems under load. rust on the hot path. infrastructure that doesn't drift.",
    pt: "sistemas sob carga. rust no hot path. infraestrutura que não sofre drift.",
  } satisfies Localized,
  bio: {
    en: "I build fast, measurable systems in Rust. By day I work on Azion's edge/CDN platform. On my own time I write network stacks from raw sockets up, benchmark my reverse proxy against nginx and HAProxy, and research how far autonomous coding agents can take program optimization. I care about the number, not the claim.",
    pt: "Construo sistemas rápidos e mensuráveis em Rust. Durante o dia, trabalho na plataforma de edge/CDN da Azion. No meu tempo livre, escrevo pilhas de rede a partir de raw sockets, comparo meu reverse proxy com nginx e HAProxy em benchmarks e pesquiso até onde agentes autônomos de programação conseguem levar a otimização de programas. Me importo com o número, não com a promessa.",
  } satisfies Localized,
  education: {
    en: "B.S. Computer Engineering, Inteli (Instituto de Tecnologia e Liderança), São Paulo. Graduating December 2026.",
    pt: "Bacharelado em Engenharia de Computação, Inteli (Instituto de Tecnologia e Liderança), São Paulo. Formatura em dezembro de 2026.",
  } satisfies Localized,
  contact: {
    email: AUTHOR.email,
    github: AUTHOR.github,
    linkedin: AUTHOR.linkedin,
    resume: { en: "/resume-en.pdf", pt: "/resume-pt.pdf" } satisfies Localized,
  },
  /** Hosts advertised by the curl card. */
  sites: ["https://guswid.com", "https://r3dlust.com"],
  source: AUTHOR.source,
} as const;
