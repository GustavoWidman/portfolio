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

// --- EXPERIENCE ---
#section("Professional Experience")

*CamelSec* #h(1fr) Remote \
_Chief Technology Officer (CTO)_ #h(1fr) Apr 2025 – Dec 2025
- Architected fully reproducible infrastructure using *NixOS*, reducing deployment drift to near-zero across *10+ machines*.
- Designed zero-trust internal networks using *WireGuard* with granular *ACL policies* for secure client data isolation.
- Led *monthly pentesting engagements* for enterprise clients (Sapore, SIT, FAMMA), identifying critical vulnerabilities in *under 5 hours* per assessment on average.
- Implemented automated *ISO 27001* compliance validation, ensuring continuous security posture alignment.
- Deployed redundant staging environments with strict data segregation for sensitive client workloads.

*MW APP IT Consulting* #h(1fr) São Paulo, SP \
_Full Stack Developer_ #h(1fr) Jan 2021 – Apr 2025
- Built and maintained production full-stack applications using *React/TypeScript*, *.NET/C\#*, and *Python/FastAPI* for high-traffic enterprise clients.
- Optimized database query performance by *up to 2.43x* across *MS SQL*, *MySQL*, and *SQLite*, improving response times for thousands of concurrent users.
- Led small engineering teams delivering software for *CESP*, *Hunter Douglas*, and *CETESB*, consistently meeting tight deadlines and budget constraints.
- Shipped production-grade features across *4+ years*, contributing to successful launches of multiple high-traffic systems.

#v(6pt)

// --- SKILLS ---
#section("Technical Skills")
- *Languages*: Rust, Go, C/C++, Python, TypeScript, C\#/.NET, Assembly (x86), SQL.
- *Infrastructure & DevOps*: Nix/NixOS, Docker, Kubernetes, GitHub Actions, WireGuard, Linux Hardening.
- *Security*: Network Penetration Testing, Red Teaming, ISO 27001 Compliance, Reverse Engineering.
- *Tools & Frameworks*: Git, FastAPI, NestJS, Drizzle/Prisma, Gin, Gorm, Rayon, Tokio, Actix, Axum.
- *Database Systems*: PostgreSQL, MySQL, SQLite, MS SQL Server.

#v(6pt)

// --- PROJECTS ---
#section("Projects")

*High-Performance API (Rust / Docker)* #h(1fr) #link("https://github.com/GustavoWidman/rinha-de-backend")[GitHub]
- Scaled a REST API to *2,917 RPS* with *0.5ms P50 latency* using `actix-web`, `nginx` load balancing, and optimized `SQLite` with write-ahead logging and connection pooling.

*"One Billion Row Challenge" (Rust, HPC)* #h(1fr) #link("https://github.com/GustavoWidman/1brc")[GitHub]
- Optimized data ingestion to process *1B rows in 1.8 seconds* using `rayon` parallelism and memory-mapped I/O, achieving top-tier performance without hand-tuned SIMD.

*Nix Config Collection (NixOS, CI/CD)* #h(1fr) #link("https://github.com/GustavoWidman/nix")[GitHub]
- Managed *6+ machines* (cloud + physical) over *7 months* with declarative NixOS configs. Built hardened infrastructure including mail servers, DNS (AdGuard), and mesh VPNs.

*Educational x86-64 Kernel (Rust, x86 Assembly)* #h(1fr) #link("https://github.com/GustavoWidman/based-kernel")[GitHub]
- Built a bootable kernel in Rust (`no_std`) with x86 assembly bootloader, protected mode switching, arena allocator, interrupt handling (IDT), and VGA text driver.

*Zero-Dependency RNN (Rust)* #h(1fr) #link("https://github.com/GustavoWidman/rnn-rust")[GitHub]
- Developed a recurrent neural network from scratch with manual memory tuning, exceeding PyTorch training speed by *over 6000%* on specific workloads.

#section("Leadership Experience")

*EchoSec (Cybersecurity League)* #h(1fr) São Paulo, SP \
_President & Counselor_ #h(1fr) Mar 2023 – Present
- Organized and led Capture The Flag (CTF) competitions, building practical offensive security skills across the community.
- Mentored *20+ members* in Linux fundamentals, binary exploitation, and red teaming methodologies.

#v(6pt)

// --- EDUCATION ---
#section("Education")
*INTELI (Institute of Technology and Leadership)* #h(1fr) São Paulo, SP \
_Bachelor of Computer Engineering_ #h(1fr) Expected Dec 2026
- Project-Based Learning with real-world corporate partners, delivering industry-grade solutions throughout coursework.

#v(6pt)
