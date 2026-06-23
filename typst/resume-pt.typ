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
    São Paulo, Brasil #h(0.25em) | #h(0.25em) #link("mailto:gustavowidman\@gmail.com")[gustavowidman\@gmail.com] #h(0.25em) | #h(0.25em) #link("https://linkedin.com/in/gustavo-widman")[linkedin.com/in/gustavo-widman] #h(0.25em) | #h(0.25em) #link("https://github.com/GustavoWidman")[github.com/GustavoWidman] #h(0.25em) | #h(0.25em) #link("https://guswid.com")[guswid.com]
  ]
]
#v(6pt)

#section("Experiência Profissional")

*Azion* #h(1fr) Remoto \
_Software Engineer II (Rust)_ #h(1fr) Abr 2026 – Presente
- Construindo sistemas em *Rust* para cargas de edge/CDN, com foco em throughput, latência e confiabilidade operacional.
- Atuando em partes internas da CDN com os times de aplicação e segurança.
- Contribuindo em componentes distribuídos de edge sob orçamento apertado de CPU e memória.

*CamelSec* #h(1fr) Remoto \
_Technical Lead, Security Infrastructure_ #h(1fr) Abr 2025 – Dez 2025
- Liderei a estratégia técnica de infraestrutura, tooling interno e operações de segurança em uma consultoria de cibersegurança.
- Construí ambientes reprodutíveis em *NixOS* e fluxos operacionais endurecidos em *10+ máquinas*.
- Projetei redes internas com *WireGuard* e ambientes redundantes para workloads isolados de clientes.
- Executei pentests e operações de red team para clientes corporativos.

*MW APP IT Consulting* #h(1fr) São Paulo, SP \
_Software Engineer_ #h(1fr) Jan 2021 – Abr 2025
- Entreguei software para clientes corporativos em backend, frontend e banco de dados.
- Otimizei performance de queries em *até 2,43x* em *MS SQL*, *MySQL* e *SQLite*.
- Liderei times de engenharia em entregas para *CESP*, *Hunter Douglas* e *CETESB*.

#v(6pt)

#section("Habilidades Técnicas")
- *Linguagens*: Rust, Go, C/C++, Python, TypeScript, C\#/.NET, Assembly (x86/x86-64), SQL.
- *Sistemas & Infraestrutura*: Linux, Nix/NixOS, Docker, Kubernetes, WireGuard, GitHub Actions.
- *Stack Rust*: Tokio, Actix, Axum, Rayon, `no_std`, I/O mapeado em memória, concorrência, serviços de baixa latência.
- *Segurança*: Testes de Intrusão em Redes, Red Teaming, Conformidade ISO 27001, Engenharia Reversa.

#v(6pt)

#section("Projetos Selecionados")

*upstreamer (reverse proxy em Rust)* #h(1fr) #link("https://github.com/GustavoWidman/upstreamer")[GitHub]
- Construí um reverse proxy em Rust com service discovery via Kubernetes, reload de configuração sem downtime, health checks ativos/passivos e métricas Prometheus.
- Medi *76.663 RPS* com *0,64ms p50* e *3,81ms p99.99*, à frente de HAProxy, nginx, Caddy e Apache no cenário publicado.

*FerriSync (pesquisa de sincronização de arquivos em Rust)* #h(1fr) #link("https://guswid.com/blog/modernizing-rsync")[Artigo]
- Pesquisando e prototipando um motor de sincronização em Rust no estilo rsync, focado em gargalos de rolling hash, lookup cache-aware e delta computation multi-core.
- Direcionado a workloads de backup, storage e sincronização em data centers, sem foco em features de camada de aplicação.

*Infraestrutura NixOS* #h(1fr) #link("https://github.com/GustavoWidman/nix")[GitHub]
- Gerenciei *6+ máquinas* com configurações declarativas em NixOS para infraestrutura endurecida, DNS, mail e VPN mesh.

*Kernel x86-64 em Rust* #h(1fr) #link("https://github.com/GustavoWidman/based-kernel")[GitHub]
- Construí um kernel inicializável em Rust `no_std` com bootloader em assembly x86, configuração de paginação, transição para long mode, tratamento de interrupções, allocator e saída em VGA.

*One Billion Row Challenge (Rust)* #h(1fr) #link("https://github.com/GustavoWidman/1brc")[GitHub]
- Processei *1B de linhas em 1,8 segundos* usando paralelismo com `rayon` e I/O mapeado em memória.

#v(6pt)

#section("Liderança & voluntariado")

*EchoSec (Liga de Cibersegurança)* #h(1fr) São Paulo, SP \
_Presidente & Conselheiro_ #h(1fr) Mar 2023 – Presente
- Organizei eventos de Capture The Flag (CTF) e workshops práticos de segurança.
- Mentorei membros em fundamentos de Linux, exploração de binários e prática de segurança ofensiva.

#v(6pt)

#section("Educação")
*INTELI (Instituto de Tecnologia e Liderança)* #h(1fr) São Paulo, SP \
_Bacharelado em Engenharia da Computação_ #h(1fr) Previsão Dez 2026
- Curso baseado em projetos com entregas de software para parceiros da indústria.

#v(6pt)
