import type { Localized } from "./types";

export interface ExperienceItem {
  id: string;
  company: string;
  role: Localized;
  /** `YYYY-MM` or `YYYY`. */
  start: string;
  /** `YYYY-MM`, `YYYY`, or undefined while current. */
  end?: string;
  location: Localized;
  summary: Localized;
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: "azion",
    company: "Azion",
    role: { en: "Software Engineer II (Rust)", pt: "Engenheiro de Software II (Rust)" },
    start: "2026-04",
    location: { en: "São Paulo", pt: "São Paulo" },
    summary: {
      en: "Rust systems for edge/CDN workloads: throughput, latency and operational reliability; CDN internals on performance-sensitive paths.",
      pt: "Sistemas em Rust para cargas de edge/CDN: throughput, latência e confiabilidade operacional; internals de CDN em caminhos sensíveis a performance.",
    },
  },
  {
    id: "camelsec",
    company: "CamelSec",
    role: {
      en: "Technical Lead, Security Infrastructure",
      pt: "Líder Técnico, Infraestrutura de Segurança",
    },
    start: "2025-04",
    end: "2025-12",
    location: { en: "Remote", pt: "Remoto" },
    summary: {
      en: "Led infrastructure, tooling and security operations for a security consultancy: penetration tests and red-team engagements for enterprise clients, a reproducible NixOS fleet (10+ machines), WireGuard networks for isolated client workloads.",
      pt: "Liderou infraestrutura, ferramentas e operações de segurança de uma consultoria de segurança: testes de intrusão e operações de red team para clientes corporativos, uma frota NixOS reprodutível (10+ máquinas), redes WireGuard para cargas isoladas de clientes.",
    },
  },
  {
    id: "mwapp",
    company: "MW APP IT Consulting",
    role: { en: "Software Engineer", pt: "Engenheiro de Software" },
    start: "2021-01",
    end: "2025-04",
    location: { en: "São Paulo", pt: "São Paulo" },
    summary: {
      en: "Led teams delivering systems for CESP, Hunter Douglas and CETESB; up to 2.43× faster database queries across MS SQL, MySQL and SQLite.",
      pt: "Liderou equipes que entregaram sistemas para CESP, Hunter Douglas e CETESB; consultas até 2,43× mais rápidas em MS SQL, MySQL e SQLite.",
    },
  },
  {
    id: "echosec",
    company: "EchoSec",
    role: {
      en: "President, cybersecurity student league",
      pt: "Presidente, liga acadêmica de cibersegurança",
    },
    start: "2023",
    location: { en: "São Paulo", pt: "São Paulo" },
    summary: {
      en: "Runs CTFs and workshops; mentors on Linux, binary exploitation and offensive security.",
      pt: "Organiza CTFs e workshops; dá mentoria em Linux, exploração de binários e segurança ofensiva.",
    },
  },
];
