#set page(margin: (left: 0.5in, right: 0.5in, top: 0.5in, bottom: 0.5in), paper: "a4")
#set text(font: "Times New Roman", size: 10pt)
#set par(leading: 0.48em, spacing: 0.4em)

#let section(title) = {
  v(11pt, weak: true)
  {
    set text(size: 12pt, weight: "bold")
    upper(title)
  }
  line(length: 100%, stroke: 0.4pt)
}

#align(center)[
  #text(size: 24.88pt, weight: "bold")[Gustavo Widman]
  #v(-2pt)
  #text(size: 9pt)[
    Rust Backend / Platform Engineer | Distributed Systems, Edge Infrastructure, Security\
    São Paulo, Brazil #h(0.25em) | #h(0.25em) #link("mailto:gustavowidman\@gmail.com")[gustavowidman\@gmail.com] #h(0.25em) | #h(0.25em) #link("https://linkedin.com/in/gustavo-widman")[linkedin.com/in/gustavo-widman] #h(0.25em) | #h(0.25em) #link("https://github.com/GustavoWidman")[github.com/GustavoWidman] #h(0.25em) | #h(0.25em) #link("https://guswid.com")[guswid.com]\
    Graduating Dec 2026; targeting Canada-based Rust backend/platform roles from Jan 2027.
  ]
]
#v(5pt)

#section("Professional Experience")

*Azion* #h(1fr) Remote \
_Software Engineer II (Rust)_ #h(1fr) Apr 2026 – Present
- Building *Rust* components for edge/CDN workloads where latency, memory use, and operational reliability shape the design.
- Working across application and security teams on performance-sensitive distributed systems and production debugging.
- Contributing to scalable edge components under tight CPU and memory budgets.

*CamelSec* #h(1fr) Remote \
_Technical Lead, Security Infrastructure_ #h(1fr) Apr 2025 – Dec 2025
- Led hands-on technical work for an early-stage cybersecurity consultancy across infrastructure, internal tools, and client security operations.
- Built reproducible *NixOS* environments across *10+ machines* and designed *WireGuard* networks with granular ACLs.
- Deployed isolated staging environments for client workloads and ran network/application security assessments for enterprise clients.

*MW APP IT Consulting* #h(1fr) São Paulo, SP \
_Software Engineer_ #h(1fr) Jan 2021 – Apr 2025
- Built and maintained production systems for *CESP*, *Hunter Douglas*, and *CETESB* across backend APIs, frontend UI, and SQL databases.
- Optimized SQL query paths by *up to 2.43x* across *MS SQL*, *MySQL*, and *SQLite*.
- Led small delivery teams coordinating implementation, review, deployment, and production fixes.

#v(5pt)

#section("Technical Skills")
- *Languages*: Rust, Go, C/C++, Python, TypeScript, C\#/.NET, Assembly (x86/x86-64), SQL.
- *Backend & Platform*: Linux services, REST APIs, WebSockets, HTTPS, PostgreSQL, MySQL, SQLite, MS SQL, CI/CD.
- *Rust Stack*: Tokio, Axum, Actix, Rayon, `no_std`, memory-mapped I/O, async/concurrency, low-latency services.
- *Infrastructure & Security*: Nix/NixOS, Docker, Kubernetes, WireGuard, Linux hardening, pentesting, reverse engineering.

#v(5pt)

#section("Selected Projects")

*upstreamer (Rust reverse proxy)* #h(1fr) #link("https://github.com/GustavoWidman/upstreamer")[GitHub]
- Built a reverse proxy in Rust with Kubernetes service discovery, hot config reload, active/passive health checks, rate limiting, and Prometheus metrics.
- Benchmarked *76,663 RPS* with *0.64ms p50* and *3.81ms p99.99* in the published setup.

*FerriSync (Rust file synchronization thesis)* #h(1fr) #link("https://guswid.com/blog/modernizing-rsync")[Write-up]
- Researching and prototyping an rsync-style synchronization engine for multi-gigabit networks, focused on rolling-hash bottlenecks, cache-aware lookup design, and multi-core delta computation.

*NixOS Infrastructure (Nix, WireGuard, CI/CD)* #h(1fr) #link("https://github.com/GustavoWidman/nix")[GitHub]
- Managing *6+ machines* with declarative NixOS configs for reproducible deploys, hardened hosts, DNS/mail services, and mesh VPNs.

*x86-64 Kernel (Rust, x86 Assembly)* #h(1fr) #link("https://github.com/GustavoWidman/based-kernel")[GitHub]
- Built a bootable Rust `no_std` kernel with an x86 assembly boot path, page-table setup, long-mode transition, interrupt handling, allocator setup, and VGA text output.

#v(5pt)

#section("Education")
*INTELI (Institute of Technology and Leadership)* #h(1fr) São Paulo, SP \
_Bachelor of Computer Engineering_ #h(1fr) Expected Dec 2026
