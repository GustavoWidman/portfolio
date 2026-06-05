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
    São Paulo, Brasil #h(0.25em) | #h(0.25em) #link("mailto:gustavowidman\@gmail.com")[gustavowidman\@gmail.com] #h(0.25em) | #h(0.25em) #link("https://linkedin.com/in/gustavo-widman")[linkedin.com/in/gustavo-widman] #h(0.25em) | #h(0.25em) #link("https://github.com/GustavoWidman")[github.com/GustavoWidman] #h(0.25em) | #h(0.25em) #link("https://guswid.com")[guswid.com]
  ]
]
#v(6pt)

// --- EXPERIENCE ---
#section("Experiência Profissional")

*Azion* #h(1fr) Remoto \
_Software Engineer II (Rust)_ #h(1fr) Abr 2026 – Presente
- Desenvolvo sistemas de alta performance em *Rust* para edge computing e workloads de CDN.
- Trabalho com o time de aplicação e segurança para melhorar performance, confiabilidade e segurança operacional da plataforma.
- Construo componentes de computação distribuída focados em execução de baixa latência e infraestrutura de edge escalável.

*CamelSec* #h(1fr) Remoto \
_Chief Technology Officer (CTO)_ #h(1fr) Abr 2025 – Dez 2025
- Arquitetei infraestrutura completamente reprodutível com *NixOS*, reduzindo drift de deployment a quase zero em *10+ máquinas*.
- Projetei redes internas zero-trust usando *WireGuard* com *políticas ACL* granulares para isolamento seguro de dados de clientes.
- Liderei *pentests mensais* para clientes corporativos (Sapore, SIT, FAMMA), identificando vulnerabilidades críticas em *menos de 5 horas* por avaliação em média.
- Implementei validação automatizada de conformidade *ISO 27001*, garantindo alinhamento contínuo da postura de segurança.
- Implantei ambientes de staging redundantes com segregação estrita de dados para cargas de trabalho sensíveis.

*MW APP IT Consulting* #h(1fr) São Paulo, SP \
_Desenvolvedor Full Stack_ #h(1fr) Jan 2021 – Abr 2025
- Construí aplicações full-stack em produção com *React/TypeScript*, *.NET/C\#* e *Python/FastAPI* para clientes corporativos de alto tráfego.
- Otimizei performance de queries em *até 2,43x* em *MS SQL*, *MySQL* e *SQLite*.
- Liderei pequenas equipes entregando software para *CESP*, *Hunter Douglas* e *CETESB* ao longo de *4+ anos*.

#v(6pt)

// --- SKILLS ---
#section("Habilidades Técnicas")
- *Linguagens*: Rust, Go, C/C++, Python, TypeScript, C\#/.NET, Assembly (x86), SQL.
- *Infraestrutura & DevOps*: Nix/NixOS, Docker, Kubernetes, GitHub Actions, WireGuard, Hardening Linux.
- *Segurança*: Testes de Intrusão em Redes, Red Teaming, Conformidade ISO 27001, Engenharia Reversa.
- *Ferramentas & Frameworks*: Git, FastAPI, NestJS, Drizzle/Prisma, Gin, Gorm, Rayon, Tokio, Actix, Axum.
- *Sistemas de Banco de Dados*: PostgreSQL, MySQL, SQLite, MS SQL Server.

#v(6pt)

// --- PROJECTS ---
#section("Projetos")

*High-Performance API (Rust / Docker)* #h(1fr) #link("https://github.com/GustavoWidman/rinha-de-backend")[GitHub]
- Escalei uma API REST para *2.917 RPS* com *latência P50 de 0,5ms* usando `actix-web`, balanceamento de carga `nginx` e `SQLite` otimizado com write-ahead logging e connection pooling.

*"One Billion Row Challenge" (Rust, HPC)* #h(1fr) #link("https://github.com/GustavoWidman/1brc")[GitHub]
- Otimizei ingestão de dados para processar *1B de linhas em 1,8 segundos* usando paralelismo `rayon` e I/O mapeado em memória, alcançando performance de ponta sem SIMD otimizado manualmente.

*Nix Config Collection (NixOS, CI/CD)* #h(1fr) #link("https://github.com/GustavoWidman/nix")[GitHub]
- Gerenciei *6+ máquinas* com configs declarativas NixOS para infra hardened, DNS, e-mail e VPNs mesh.

*Educational x86-64 Kernel (Rust, x86 Assembly)* #h(1fr) #link("https://github.com/GustavoWidman/based-kernel")[GitHub]
- Construí um kernel inicializável em Rust (`no_std`) com bootloader em assembly x86, mudança para modo protegido, arena allocator, tratamento de interrupções (IDT) e driver de texto VGA.

#section("Experiência de Liderança")

*EchoSec (Liga de Cibersegurança)* #h(1fr) São Paulo, SP \
_Presidente & Conselheiro_ #h(1fr) Mar 2023 – Presente
- Organizei e liderei competições Capture The Flag (CTF), desenvolvendo habilidades práticas de segurança ofensiva na comunidade.
- Mentorei *20+ membros* em fundamentos de Linux, exploração de binários e metodologias de red teaming.

#v(6pt)

// --- EDUCATION ---
#section("Educação")
*INTELI (Instituto de Tecnologia e Liderança)* #h(1fr) São Paulo, SP \
_Bacharelado em Engenharia da Computação_ #h(1fr) Previsão Dez 2026
- Aprendizagem Baseada em Projetos com parceiros corporativos reais, entregando soluções de nível industrial durante o curso.

#v(6pt)
