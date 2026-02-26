#set page(margin: (left: 0.5in, right: 0.5in, top: 0.5in, bottom: 0.5in), paper: "a4")
#set text(font: "Times New Roman", size: 10pt)
#set par(leading: 0.5em, spacing: 0.5em)

// Custom section styling - matches LaTeX titleformat
#let section(title) = {
  v(12pt, weak: true)
  {
    set text(size: 12pt, weight: "bold")
    upper(title)
  }
  line(length: 100%, stroke: 0.4pt)
}

// --- HEADER ---
#align(center)[
  #text(size: 24.88pt, weight: "bold")[Gustavo Widman]
  #v(-2pt)
  #text(size: 9pt)[
    São Paulo, Brazil #h(0.25em) | #h(0.25em) #link("mailto:gustavowidman\@gmail.com")[gustavowidman\@gmail.com] #h(0.25em) | #h(0.25em) #link("https://linkedin.com/in/gustavo-widman")[linkedin.com/in/gustavo-widman] #h(0.25em) | #h(0.25em) #link("https://github.com/GustavoWidman")[github.com/GustavoWidman] #h(0.25em) | #h(0.25em) #link("https://guswid.com")[guswid.com]
  ]
]
#v(6pt)

// --- EDUCATION ---
#section("Education")
*INTELI (Institute of Technology and Leadership)* #h(1fr) São Paulo, SP \
_Bachelor of Computer Engineering_ #h(1fr) Expected Dec 2026
- Focus on Project-Based Learning (PBL) with real-world corporate partners
- Leadership: President of EchoSec (Cybersecurity League).

#v(6pt)

// --- SKILLS ---
#section("Technical Skills")
- *Languages*: Rust (Advanced), Go, C/C++, Python, TypeScript, SQL, Assembly (x86).
- *Infrastructure & DevOps*: Nix/NixOS, Docker, Kubernetes, GitHub Actions, WireGuard, Linux Hardening.
- *Security*: Network Penetration Testing, Red Teaming, ISO 27001 Compliance, Reverse Engineering.
- *Tools & Libs*: Git, Neovim, Postgres, SQLite, Rayon (Rust), Serenity (Rust), Actix/Axum.

#v(6pt)

// --- EXPERIENCE ---
#section("Professional Experience")

*CamelSec* #h(1fr) Remote \
_Chief Technology Officer (CTO)_ #h(1fr) Apr 2025 – Dec 2025
- Architected a fully reproducible infrastructure using *NixOS*, reducing deployment drift to near-zero.
- Designed secure internal networks using *WireGuard* and redundant staging environments for client data isolation.
- Led Pentesting and Red Team operations, identifying critical vulnerabilities in enterprise client systems.
- Implemented automated compliance checks aligning with ISO 27001 standards.

*EchoSec (Cybersecurity League)* #h(1fr) São Paulo, SP \
_President & Counselor_ #h(1fr) Mar 2023 – Present
- Led the university's cybersecurity league, organizing CTF (Capture The Flag) competitions.
- Mentored 20+ members in offensive security, binary exploitation, and Linux fundamentals.

*MW APP IT Consulting* #h(1fr) São Paulo, SP \
_Full Stack Developer_ #h(1fr) Jan 2021 – Apr 2025
- Developed and maintained full-stack software using *React/TypeScript*, *.NET/C\#*, and *Python/FastAPI*.
- Managed *MS SQL*, *MySQL* and *SQLite* databases for high-traffic clients including CESP, Hunter Douglas and CETESB.
- Delivered production-grade features over *5+ years* of professional software development.

#v(6pt)

// --- PROJECTS ---
#section("Key Projects")

*Based Kernel (Rust, Assembly)* #h(1fr) #link("https://github.com/GustavoWidman/based-kernel")[GitHub]
- Developed a bootable x86-64 kernel in Rust (`no_std`). Implemented VGA drivers, interrupt handling (IDT), and memory management from scratch.

*Nix Infrastructure (NixOS, CI/CD)* #h(1fr) #link("https://github.com/GustavoWidman/nix")[GitHub]
- Maintained a monorepo managing 6 machines (Cloud/Physical). Configured mail servers, DNS (AdGuard), and mesh VPNs declaratively.

*Zero-Dependency RNN (Rust)* #h(1fr) #link("https://github.com/GustavoWidman/rnn-rust")[GitHub]
- Built a Recurrent Neural Network from scratch. Outperformed PyTorch in training speed for specific workloads via hand-tuned memory management.

*1 Billion Row Challenge (Rust, HPC)* #h(1fr) #link("https://github.com/GustavoWidman/1brc")[GitHub]
- Optimized data processing to handle 1B rows in seconds using `mmap` and `Rayon` parallelism, avoiding SIMD overhead.

*Cognitive Chatbot (Rust, LLM)* #h(1fr) #link("https://github.com/GustavoWidman/chatbot")[GitHub]
- Created a Discord bot with "Free Will" and RAG memory using Vector DBs to give LLMs long-term context.
