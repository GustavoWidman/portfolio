import type { chrome as en } from "../en/chrome";
import type { Widen } from "../types";

export const chrome: Widen<typeof en> = {
  locale: "pt-BR",
  languageName: "Português",
  site: {
    title: "Gustavo Widman",
    description:
      "Gustavo Widman, engenheiro de software escrevendo Rust para sistemas de edge/CDN. Pilhas de rede, reverse proxies, kernels e pesquisa sobre agentes autônomos de programação.",
    skipToContent: "Pular para o conteúdo",
  },
  nav: {
    label: "Principal",
    brand: "Gustavo Widman, início",
    home: "Início",
    work: "Projetos",
    research: "Pesquisa",
    writing: "Textos",
    about: "Sobre",
    language: "Idioma",
    theme: "Alternar tema de cores",
  },
  footer: {
    contact: "Contato",
    title: "Vamos conversar.",
    resume: "Currículo",
    resumeNote: "PDF",
    terminal: "Terminal",
    curlNote: "imprime um cartão",
    location: "São Paulo, BR",
    typefaces: "Composto em Geist e Geist Mono",
    source: "Código-fonte",
    feed: "RSS",
    llms: "llms.txt",
    built: (date: string): string => `build de ${date}`,
  },
};
