import type { home as en } from "../en/home";
import type { Widen } from "../types";

export const home: Widen<typeof en> = {
  home: {
    hero: {
      github: "GitHub",
      linkedin: "LinkedIn",
      resume: "Currículo",
      resumeNote: "PDF",
      readouts: "Números medidos, um por conjunto de trabalho",
    },
    status: {
      preprint: "Preprint",
      review: "Em revisão",
      progress: "Em andamento",
    },
    sections: {
      work: {
        title: "Trabalhos selecionados",
        lede: "Três projetos em que o número é o que importa. Cada valor é medido e traz a sua condição.",
      },
      research: {
        title: "Pesquisa",
        lede: "Até onde agentes sem supervisão levam a otimização de programas, e os sistemas por baixo.",
      },
      more: {
        title: "Mais projetos",
        lede: "Dois projetos embarcados, depois as coisas menores, uma linha cada.",
      },
      writing: {
        title: "Textos",
        lede: "Textos longos, em minúsculas, com os números à mostra.",
      },
      about: {
        title: "Sobre",
      },
    },
    sheet: {
      lang: "Linguagem",
      target: "Alvo",
      writeup: "Texto",
      parameter: "Parâmetro",
      condition: "Condição",
      value: "Valor",
      specs: (name: string): string => `Especificações de ${name}`,
      sourceAria: (name: string): string => `Código de ${name} no GitHub`,
      writeupAria: (name: string, date: string): string => `Texto sobre ${name}, ${date}`,
    },
    scope: {
      at: "Em",
      delta: "Δ vs melhor outro",
      deltaRow: "Δ vs melhor outro proxy",
      nextBest: "segundo melhor",
      otherProxies: "outros proxies",
      target: "Alvo",
      slowest: "requisição mais lenta",
      tableCaption: "Latência por percentil, mais a requisição mais lenta",
      group:
        "Latência por percentil. As setas esquerda e direita movem a leitura. A tabela abaixo lista todos os valores.",
    },
    columns: {
      attempt: "tentativa",
    },
    research: {
      code: "Código",
      essay: "Texto",
      doi: "DOI",
    },
    small: {
      title: "Projetos menores",
      caption: "Projetos menores com o número principal de cada um",
      project: "Projeto",
      what: "O quê",
      figure: "Número",
      context: "Contexto",
    },
    about: {
      experience: "Experiência",
      experienceCaption: "Experiência",
      period: "Período",
      role: "Cargo",
      now: "atual",
      openSource: "Open source",
    },
    writing: {
      all: (count: number): string => `Todos os ${count} textos`,
    },
  },
};
