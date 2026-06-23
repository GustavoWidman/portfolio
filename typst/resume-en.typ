#set page(margin: (left: 0.5in, right: 0.5in, top: 0.5in, bottom: 0.5in), paper: "a4")
#set text(font: "Times New Roman", size: 10pt)
#set par(leading: 0.5em, spacing: 0.5em)

#let section(title) = {
  v(12pt, weak: true)
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
    São Paulo, Brazil #h(0.25em) | #h(0.25em) #link("mailto:gustavowidman\@gmail.com")[gustavowidman\@gmail.com] #h(0.25em) | #h(0.25em) #link("https://linkedin.com/in/gustavo-widman")[linkedin.com/in/gustavo-widman] #h(0.25em) | #h(0.25em) #link("https://github.com/GustavoWidman")[github.com/GustavoWidman] #h(0.25em) | #h(0.25em) #link("https://guswid.com")[guswid.com]
  ]
]
#v(6pt)

#section("Professional Experience")

*Azion* #h(1fr) Remote \
_Software Engineer II (Rust)_ #h(1fr) Apr 2026 – Present
- Building *Rust* systems for edge/CDN workloads, focused on throughput, latency, and operational reliability.
- Working with application and security teams on performance-sensitive CDN internals.
- Contributing to distributed edge components under tight CPU and memory budgets.

*CamelSec* #h(1fr) Remote \
_Technical Lead, Security Infrastructure_ #h(1fr) Apr 2025 – Dec 2025
- Owned technical strategy across infrastructure, internal tooling, and security operations for a cybersecurity consultancy.
- Built reproducible *NixOS* environments and hardened operational workflows across *10+ machines*.
- Designed *WireGuard*-based internal networks and redundant staging environments for isolated client workloads.
- Ran penetration testing and red-team engagements for enterprise clients.

*MW APP IT Consulting* #h(1fr) São Paulo, SP \
_Software Engineer_ #h(1fr) Jan 2021 – Apr 2025
- Built software for enterprise clients across backend, frontend, and database layers.
- Optimized database query performance by *up to 2.43x* across *MS SQL*, *MySQL*, and *SQLite*.
- Led engineering teams delivering software for *CESP*, *Hunter Douglas*, and *CETESB*.

#v(6pt)

#section("Technical Skills")
- *Languages*: Rust, Go, C/C++, Python, TypeScript, C\#/.NET, Assembly (x86/x86-64), SQL.
- *Systems & Infrastructure*: Linux, Nix/NixOS, Docker, Kubernetes, WireGuard, GitHub Actions.
- *Rust Stack*: Tokio, Actix, Axum, Rayon, `no_std`, memory-mapped I/O, concurrency, low-latency services.
- *Security*: Network Penetration Testing, Red Teaming, ISO 27001 Compliance, Reverse Engineering.

#v(6pt)

#section("Selected Projects")

*upstreamer (Rust reverse proxy)* #h(1fr) #link("https://github.com/GustavoWidman/upstreamer")[GitHub]
- Built a reverse proxy in Rust with Kubernetes service discovery, hot config reload, active/passive health checks, and Prometheus metrics.
- Benchmarked *76,663 RPS* with *0.64ms p50* and *3.81ms p99.99*, ahead of HAProxy, nginx, Caddy, and Apache in the published setup.

*FerriSync (Rust file synchronization research)* #h(1fr) #link("https://guswid.com/blog/modernizing-rsync")[Write-up]
- Researching and prototyping an rsync-style Rust synchronization engine around rolling-hash bottlenecks, cache-aware lookup design, and multi-core delta computation.
- Framed around backup, storage, and data-center synchronization workloads rather than application-layer features.

*NixOS Infrastructure* #h(1fr) #link("https://github.com/GustavoWidman/nix")[GitHub]
- Managed *6+ machines* with declarative NixOS configs for hardened infrastructure, DNS, mail, and mesh VPNs.

*x86-64 Kernel (Rust, x86 Assembly)* #h(1fr) #link("https://github.com/GustavoWidman/based-kernel")[GitHub]
- Built a bootable Rust `no_std` kernel with an x86 assembly bootloader, page-table setup, protected-to-long-mode transition, interrupt handling, a memory allocator, and VGA text output.

*One Billion Row Challenge (Rust)* #h(1fr) #link("https://github.com/GustavoWidman/1brc")[GitHub]
- Processed *1B rows in 1.8 seconds* using `rayon` parallelism and memory-mapped I/O.

#v(6pt)

#section("Leadership & volunteering")

*EchoSec (Cybersecurity League)* #h(1fr) São Paulo, SP \
_President & Counselor_ #h(1fr) Mar 2023 – Present
- Organized Capture The Flag (CTF) events and hands-on security workshops.
- Mentored members in Linux fundamentals, binary exploitation, and offensive security practice.

#v(6pt)

#section("Education")
*INTELI (Institute of Technology and Leadership)* #h(1fr) São Paulo, SP \
_Bachelor of Computer Engineering_ #h(1fr) Expected Dec 2026
- Project-based program with industry-sponsored software delivery.

#v(6pt)
