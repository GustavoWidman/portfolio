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
#section("Educação")
*INTELI Instituto de Tecnologia e Liderança* #h(1fr) São Paulo, SP \
_Bacharelado em Engenharia da Computação_ #h(1fr) Previsão Dez 2026
- Foco em Aprendizagem Baseada em Projetos (PBL) com parceiros corporativos reais.
- Liderança: Presidente da EchoSec (Liga de Cibersegurança).

#v(6pt)

// --- SKILLS ---
#section("Habilidades Técnicas")
- *Linguagens*: Rust (Avançado), Go, C/C++, Python, TypeScript, SQL, Assembly (x86).
- *Infraestrutura & DevOps*: Nix/NixOS, Docker, Kubernetes, GitHub Actions, WireGuard, Hardening Linux.
- *Segurança*: Testes de Intrusão em Redes, Red Teaming, Conformidade ISO 27001, Engenharia Reversa.
- *Ferramentas & Libs*: Git, Neovim, Postgres, SQLite, Rayon (Rust), Serenity (Rust), Actix/Axum.
#v(6pt)

// --- EXPERIENCE ---
#section("Experiência Profissional")

*CamelSec* #h(1fr) Remoto \
_Chief Technology Officer (CTO)_ #h(1fr) Abr 2025 – Dez 2025
- Arquitetei uma infraestrutura totalmente reprodutível usando *NixOS*, reduzindo o drift de configuração a zero.
- Projetei redes internas seguras usando *WireGuard* e ambientes de staging redundantes para isolamento de dados.
- Liderei operações de Pentest e Red Team, identificando vulnerabilidades críticas em sistemas de clientes corporativos.
- Implementei verificações automáticas de conformidade alinhadas aos padrões ISO 27001.

*EchoSec (Liga de Cibersegurança)* #h(1fr) São Paulo, SP \
_Presidente e Conselheiro_ #h(1fr) Mar 2023 – Presente
- Liderei a liga de cibersegurança da universidade, organizando competições CTF (Capture The Flag).
- Mentorei mais de 20 membros em segurança ofensiva, exploração de binários e fundamentos de Linux.

*MW APP IT Consulting* #h(1fr) São Paulo, SP \
_Desenvolvedor Full Stack_ #h(1fr) Jan 2021 – Abr 2025
- Desenvolvi aplicações web full-stack usando *React/TypeScript*, *.NET/C\#*, e *Python/FastAPI*.
- Gerenciei bancos de dados *MS SQL*, *MySQL* e *SQLite* para clientes de alto tráfego, incluindo CESP, Hunter Douglas e CETESB.
- Entreguei features de produção ao longo de mais de *5 anos* de desenvolvimento profissional de software.

#v(6pt)

// --- PROJECTS ---
#section("Projetos Selecionados")

*Based Kernel (Rust, Assembly)* #h(1fr) #link("https://github.com/GustavoWidman/based-kernel")[GitHub]
- Desenvolvi um kernel x86-64 inicializável em Rust (`no_std`). Implementei drivers VGA, tratamento de interrupções (IDT) e gerenciamento de memória do zero.

*Nix Infrastructure (NixOS, CI/CD)* #h(1fr) #link("https://github.com/GustavoWidman/nix")[GitHub]
- Monorepo gerenciando 6 máquinas (Nuvem/Física). Configuração declarativa de servidores de e-mail, DNS (AdGuard) e VPNs mesh.

*Zero-Dependency RNN (Rust)* #h(1fr) #link("https://github.com/GustavoWidman/rnn-rust")[GitHub]
- Rede Neural Recorrente construída do zero. Superou PyTorch em velocidade de treinamento para cargas específicas via gerenciamento de memória manual.

*1 Billion Row Challenge (Rust, HPC)* #h(1fr) #link("https://github.com/GustavoWidman/1brc")[GitHub]
- Otimização de processamento de dados para lidar com 1 bilhão de linhas em segundos usando `mmap` e paralelismo `Rayon`.

*Cognitive Chatbot (Rust, LLM)* #h(1fr) #link("https://github.com/GustavoWidman/chatbot")[GitHub]
- Bot para Discord com "Livre Arbítrio" e memória RAG usando Vector DBs para fornecer contexto de longo prazo a LLMs.
