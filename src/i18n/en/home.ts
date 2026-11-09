/** Strings of the home page. Copy about projects and figures lives in `src/data/`. */
export const home = {
  home: {
    hero: {
      github: "GitHub",
      linkedin: "LinkedIn",
      resume: "Résumé",
      resumeNote: "PDF",
      readouts: "Measured figures, one per body of work",
    },
    status: {
      preprint: "Preprint",
      review: "Under review",
      progress: "In progress",
    },
    sections: {
      work: {
        title: "Selected work",
        lede: "Three builds where the number is the point. Every figure is measured and carries its condition.",
      },
      research: {
        title: "Research",
        lede: "How far unattended agents can push program optimization, and the systems underneath.",
      },
      more: {
        title: "More work",
        lede: "Two embedded builds, then the smaller things, one line each.",
      },
      writing: {
        title: "Writing",
        lede: "Long-form, lowercase, with the numbers left in.",
      },
      about: {
        title: "About",
      },
    },
    sheet: {
      lang: "Lang",
      target: "Target",
      writeup: "Write-up",
      parameter: "Parameter",
      condition: "Condition",
      value: "Value",
      specs: (name: string): string => `${name} specifications`,
      sourceAria: (name: string): string => `${name} source on GitHub`,
      writeupAria: (name: string, date: string): string => `${name} write-up, ${date}`,
    },
    scope: {
      at: "At",
      delta: "Δ vs best other",
      deltaRow: "Δ vs best other proxy",
      nextBest: "next best",
      otherProxies: "other proxies",
      target: "Target",
      slowest: "slowest request",
      tableCaption: "Latency by percentile, plus the single slowest request",
      group:
        "Latency by percentile. Left and right arrow keys move the readout. The table below lists every value.",
    },
    columns: {
      attempt: "attempt",
    },
    research: {
      code: "Code",
      essay: "Essay",
      doi: "DOI",
    },
    small: {
      title: "Smaller builds",
      caption: "Smaller builds with their headline figure",
      project: "Project",
      what: "What",
      figure: "Figure",
      context: "Context",
    },
    about: {
      experience: "Experience",
      experienceCaption: "Experience",
      period: "Period",
      role: "Role",
      now: "now",
      openSource: "Open source",
    },
    writing: {
      all: (count: number): string => `All ${count} posts`,
    },
  },
} as const;
