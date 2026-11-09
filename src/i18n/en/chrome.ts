/** Strings of the shared chrome: document head, header, footer. */
export const chrome = {
  locale: "en-US",
  languageName: "English",
  site: {
    title: "Gustavo Widman",
    description:
      "Gustavo Widman, software engineer writing Rust for edge/CDN systems. Network stacks, reverse proxies, kernels and research on autonomous coding agents.",
    skipToContent: "Skip to content",
  },
  nav: {
    label: "Primary",
    brand: "Gustavo Widman, home",
    home: "Home",
    work: "Work",
    research: "Research",
    writing: "Writing",
    about: "About",
    language: "Language",
    theme: "Toggle color theme",
  },
  footer: {
    contact: "Contact",
    title: "Get in touch.",
    resume: "Résumé",
    resumeNote: "PDF",
    terminal: "Terminal",
    curlNote: "prints a card",
    location: "São Paulo, BR",
    typefaces: "Set in Geist and Geist Mono",
    source: "Source",
    feed: "RSS",
    llms: "llms.txt",
    built: (date: string): string => `built ${date}`,
  },
} as const;
