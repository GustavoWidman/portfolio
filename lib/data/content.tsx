import Image from "next/image";
import { Container, Cpu, Server, Shield } from "lucide-react";
import { FaRust } from "react-icons/fa6";
import { RiJavaLine } from "react-icons/ri";
import { SiC, SiDocker, SiGithubactions, SiNixos, SiPython, SiWireguard } from "react-icons/si";
import { TbBrandGolang } from "react-icons/tb";
import type { Experience, Project, SkillCategory, TranslationData } from "@/lib/types";

export const IS_OPEN_TO_WORK = false;

export const DATA: Record<string, TranslationData> = {
  en: {
    nav: {
      about: "About",
      stack: "Stack",
      exp: "Experience",
      work: "Work",
      contact: "Contact",
      blog: "Blog",
    },
    hero: {
      subtitle: "Gustavo Widman // Rust Platform & Distributed Systems",
      title1: "SYSTEMS &",
      title2: "SOFTWARE",
      desc: "Edge/CDN systems, infrastructure security, and reproducible operations in Rust.",
      cta: "View Projects",
      github: "GitHub",
      resume: "Download CV",
    },
    about: {
      title: "01 / About Me",
      openToWork: "Open to Work",
      heading: (
        <>
          Rust platform engineering for <br />
          <span className="text-zinc-500 dark:text-zinc-500">
            edge systems, secure infrastructure, and distributed services.
          </span>
        </>
      ),
      p1: (
        <>
          I am a Computer Engineering student at{" "}
          <span className="text-black dark:text-white font-semibold">INTELI</span> and a{" "}
          <span className="text-black dark:text-white font-semibold">
            Rust Software Engineer at Azion
          </span>
          {"."}
        </>
      ),
      p2: (
        <>
          My main work is in{" "}
          <span className="text-black dark:text-white font-semibold">
            Rust platform engineering
          </span>
          {", "}
          <span className="text-black dark:text-white font-semibold">distributed systems</span>
          {", and "}
          <span className="text-black dark:text-white font-semibold">edge/CDN infrastructure</span>.
          I like building systems that stay fast, predictable, and easy to operate.
        </>
      ),
      p3: (
        <>
          I also spend a lot of time on{" "}
          <span className="text-black dark:text-white font-semibold">infrastructure security</span>
          {", "}
          <span className="text-black dark:text-white font-semibold">NixOS</span>, and network
          design, especially where secure operations and low-level behavior meet.
        </>
      ),
    },
    stack: {
      title: "02 / The Stack",
      categories: [
        {
          title: "Rust platform & low-level systems",
          description:
            "Rust services, networking paths, kernels, memory-aware code, and systems tooling built close to the machine.",
        },
        {
          title: "Edge, infrastructure & operations",
          description:
            "Edge/CDN systems, reproducible NixOS environments, deployment plumbing, and the operational work that keeps services stable.",
        },
        {
          title: "Infrastructure security",
          description:
            "Security engineering, hardened networks, red team work, and the service layers that support secure platforms.",
        },
      ],
    },
    experience: {
      title: "03 / Professional Experience",
      present: "Present",
      jobs: [
        {
          company: "Azion",
          positions: [
            {
              role: "Software Engineer II (Rust)",
              description: [
                "Building Rust systems for edge workloads with an emphasis on throughput, latency, and operational reliability.",
                "Working on CDN internals with the application and security teams, focusing on performance-sensitive paths.",
                "Contributing to distributed computing work where systems behavior and resource efficiency matter.",
              ],
            },
          ],
        },
        {
          company: "CamelSec",
          positions: [
            {
              role: "Technical Lead, Security Infrastructure",
              description: [
                "Led technical strategy across infrastructure, internal tooling, and security operations for a cybersecurity consultancy.",
                "Ran penetration testing and red team engagements for enterprise clients.",
                "Built reproducible NixOS environments and hardened operational workflows with Home Manager.",
                "Designed secure WireGuard-based networks with redundant staging environments.",
              ],
            },
          ],
        },
        {
          company: "MW APP IT Consulting",
          positions: [
            {
              role: "Software Engineer",
              description: [
                "Delivered client systems across Python, Node.js, and C# backends with React and TypeScript frontends where needed.",
                "Handled application data layers across MS SQL, MySQL, and SQLite.",
                "Worked across internal tools, line-of-business systems, and e-commerce projects for clients including CESP, Hunter Douglas, and CETESB.",
              ],
            },
          ],
        },
      ],
    },
    projects: {
      title: "04 / Selected Works",
      viewSource: "View Source",
      readArticle: "Read Article",
      list: [
        {
          id: "1",
          title: "upstreamer",
          description:
            "A Rust reverse proxy for edge workloads with Kubernetes service discovery, hot config reload, health checks, and published benchmarks against nginx, HAProxy, Caddy, and Apache.",
        },
        {
          id: "2",
          title: "FerriSync / modernizing rsync",
          description:
            "A long-form Rust systems write-up on why rsync is CPU-bound on modern networks and how cache-aware, multi-core delta computation could change that.",
        },
        {
          id: "3",
          title: "NixOS Infrastructure",
          description:
            "The NixOS monorepo behind my public and private infrastructure: reproducible hosts, CI, mail, DNS, VPNs, and day-to-day operational tooling.",
        },
        {
          id: "4",
          title: "Rust x86-64 Kernel",
          description:
            "A bootable Rust `no_std` kernel with paging, interrupts, memory management, and bare-metal drivers built to understand the platform from the bottom up.",
        },
        {
          id: "5",
          title: "1 Billion Row Challenge",
          description:
            "A Rust 1BRC solution built around memory-mapped I/O and parallel processing to push data-heavy workloads under tight CPU budgets.",
        },
        {
          id: "6",
          title: "Cognitive Discord Bot",
          description:
            "A Rust bot with long-lived memory, retrieval, and tool-driven behavior for experimenting with stateful agents in production-like conditions.",
        },
      ],
    },
    footer: {
      title: "Ready to collaborate?",
      subtitle:
        "From edge/CDN systems to secure infrastructure, I'm ready to build Rust platforms that hold up under load.",
      email: "Email Me",
      linkedin: "LinkedIn",
      resume: "Download Resume",
    },
    notFound: {
      title: "404",
      subtitle: "Page Not Found",
      description: "The page you're looking for doesn't exist or has been moved.",
      backHome: "Back to Home",
      viewProjects: "View Projects",
      readBlog: "Read Blog",
    },
    curl: {
      name: "Gustavo Widman",
      title: "Rust Platform Engineer",
      sites: "https://guswid.com | https://r3dlust.com",
      source: "src: https://github.com/GustavoWidman/portfolio",
      aboutHeader: "About",
      aboutText: [
        "Rust platform engineer",
        "focused on edge/CDN",
        "systems, distributed",
        "services, and infra security.",
      ],
      socialsHeader: "Socials",
      github: "https://github.com/GustavoWidman",
      linkedin: "https://linkedin.com/in/gustavo-widman",
      email: "gustavowidman@gmail.com",
      site: "https://guswid.com",
      blogHeader: "Blog Posts",
    },
  },
  pt: {
    nav: {
      about: "Sobre",
      stack: "Stack",
      exp: "Experiência",
      work: "Projetos",
      contact: "Contato",
      blog: "Blog",
    },
    hero: {
      subtitle: "Gustavo Widman // Plataforma Rust & Sistemas Distribuídos",
      title1: "SISTEMAS &",
      title2: "SOFTWARE",
      desc: "Sistemas de edge/CDN, segurança de infraestrutura e operações reprodutíveis em Rust.",
      cta: "Ver Projetos",
      github: "GitHub",
      resume: "Baixar CV",
    },
    about: {
      title: "01 / Sobre Mim",
      openToWork: "Disponível",
      heading: (
        <>
          Engenharia de plataforma em Rust para <br />
          <span className="text-zinc-500 dark:text-zinc-500">
            sistemas de edge, infraestrutura segura e serviços distribuídos.
          </span>
        </>
      ),
      p1: (
        <>
          Sou estudante de Engenharia da Computação no{" "}
          <span className="text-black dark:text-white font-semibold">INTELI</span> e{" "}
          <span className="text-black dark:text-white font-semibold">
            Software Engineer em Rust na Azion
          </span>
          {"."}
        </>
      ),
      p2: (
        <>
          Meu foco principal está em{" "}
          <span className="text-black dark:text-white font-semibold">
            engenharia de plataforma em Rust
          </span>
          {", "}
          <span className="text-black dark:text-white font-semibold">sistemas distribuídos</span>
          {" e "}
          <span className="text-black dark:text-white font-semibold">
            infraestrutura de edge/CDN
          </span>
          {"."} Gosto de construir sistemas rápidos, previsíveis e fáceis de operar.
        </>
      ),
      p3: (
        <>
          Também passo bastante tempo com{" "}
          <span className="text-black dark:text-white font-semibold">
            segurança de infraestrutura
          </span>
          {", "}
          <span className="text-black dark:text-white font-semibold">NixOS</span> e desenho de
          redes, principalmente onde operação segura encontra comportamento de baixo nível.
        </>
      ),
    },
    stack: {
      title: "02 / Stack Tecnológico",
      categories: [
        {
          title: "Plataforma Rust & sistemas de baixo nível",
          description:
            "Serviços em Rust, caminhos de rede, kernels, código atento a memória e tooling de sistemas perto da máquina.",
        },
        {
          title: "Edge, infraestrutura & operações",
          description:
            "Sistemas de edge/CDN, ambientes reprodutíveis em NixOS, automação de deploy e o trabalho operacional que mantém serviços estáveis.",
        },
        {
          title: "Segurança de infraestrutura",
          description:
            "Engenharia de segurança, redes endurecidas, red team e as camadas de serviço que sustentam plataformas seguras.",
        },
      ],
    },
    experience: {
      title: "03 / Experiência Profissional",
      present: "Atualmente",
      jobs: [
        {
          company: "Azion",
          positions: [
            {
              role: "Software Engineer II (Rust)",
              description: [
                "Construindo sistemas em Rust para cargas de edge com foco em throughput, latência e confiabilidade operacional.",
                "Atuando em partes internas da CDN com os times de aplicação e segurança, com atenção aos caminhos sensíveis de performance.",
                "Contribuindo em trabalho de computação distribuída onde comportamento de sistema e eficiência de recursos importam.",
              ],
            },
          ],
        },
        {
          company: "CamelSec",
          positions: [
            {
              role: "Technical Lead, Security Infrastructure",
              description: [
                "Liderei a estratégia técnica em infraestrutura, tooling interno e operações de segurança de uma consultoria de cibersegurança.",
                "Executei testes de intrusão e operações de red team para clientes corporativos.",
                "Construí ambientes reprodutíveis em NixOS e fluxos operacionais endurecidos com Home Manager.",
                "Projetei redes baseadas em WireGuard com ambientes de staging redundantes.",
              ],
            },
          ],
        },
        {
          company: "MW APP IT Consulting",
          positions: [
            {
              role: "Software Engineer",
              description: [
                "Entreguei sistemas para clientes com backends em Python, Node.js e C#, usando React e TypeScript no frontend quando necessário.",
                "Cuidei das camadas de dados em MS SQL, MySQL e SQLite.",
                "Atuei em ferramentas internas, sistemas de negócio e projetos de e-commerce para clientes como CESP, Hunter Douglas e CETESB.",
              ],
            },
          ],
        },
      ],
    },
    projects: {
      title: "04 / Projetos Selecionados",
      viewSource: "Código",
      readArticle: "Ler Artigo",
      list: [
        {
          id: "1",
          title: "upstreamer",
          description:
            "Um reverse proxy em Rust para cargas de edge com service discovery via Kubernetes, reload de configuração sem downtime, health checks e benchmark público contra nginx, HAProxy, Caddy e Apache.",
        },
        {
          id: "2",
          title: "FerriSync / modernizando o rsync",
          description:
            "Um write-up longo de sistemas em Rust sobre por que o rsync ficou limitado por CPU nas redes atuais e como delta computation com cache awareness e multi-core pode mudar isso.",
        },
        {
          id: "3",
          title: "Infraestrutura NixOS",
          description:
            "O monorepo NixOS por trás da minha infraestrutura pública e privada: hosts reprodutíveis, CI, mail, DNS, VPNs e tooling operacional do dia a dia.",
        },
        {
          id: "4",
          title: "Kernel x86-64 em Rust",
          description:
            "Um kernel inicializável em Rust `no_std` com paging, interrupções, gerenciamento de memória e drivers bare-metal, construído para entender a plataforma da base ao topo.",
        },
        {
          id: "5",
          title: "1 Billion Row Challenge",
          description:
            "Uma solução em Rust para o 1BRC baseada em I/O mapeado em memória e processamento paralelo para empurrar cargas pesadas sob orçamento apertado de CPU.",
        },
        {
          id: "6",
          title: "Bot Cognitivo (Discord)",
          description:
            "Um bot em Rust com memória de longa duração, retrieval e comportamento guiado por ferramentas para experimentar agentes com estado em condições próximas de produção.",
        },
      ],
    },
    footer: {
      title: "Pronto para colaborar?",
      subtitle:
        "De sistemas de edge/CDN a infraestrutura segura, estou pronto para construir plataformas em Rust que aguentam carga.",
      email: "Me envie um email",
      linkedin: "LinkedIn",
      resume: "Baixar CV",
    },
    notFound: {
      title: "404",
      subtitle: "Página Não Encontrada",
      description: "A página que você está procurando não existe ou foi movida.",
      backHome: "Voltar ao Início",
      viewProjects: "Ver Projetos",
      readBlog: "Ler Blog",
    },
    curl: {
      name: "Gustavo Widman",
      title: "Engenheiro de Plataforma Rust",
      sites: "https://guswid.com | https://r3dlust.com",
      source: "src: https://github.com/GustavoWidman/portfolio",
      aboutHeader: "Sobre",
      aboutText: [
        "Engenheiro de plataforma",
        "Rust focado em edge/CDN,",
        "sistemas distribuídos e",
        "segurança de infraestrutura.",
      ],
      socialsHeader: "Social",
      github: "https://github.com/GustavoWidman",
      linkedin: "https://linkedin.com/in/gustavo-widman",
      email: "gustavowidman@gmail.com",
      site: "https://guswid.com",
      blogHeader: "Posts do Blog",
    },
  },
};

export const STATIC_PROJECTS: Project[] = [
  {
    id: "1",
    title: "upstreamer",
    description: "",
    tags: ["Rust", "Reverse Proxy", "Kubernetes", "Edge"],
    githubUrl: "https://github.com/GustavoWidman/upstreamer",
    blogPostSlug: "upstreamer",
  },
  {
    id: "2",
    title: "FerriSync / modernizing rsync",
    description: "",
    tags: ["Rust", "Distributed Systems", "File Sync", "Research"],
    blogPostSlug: "modernizing-rsync",
  },
  {
    id: "3",
    title: "NixOS Infrastructure",
    description: "",
    tags: ["NixOS", "Infrastructure", "Security", "Self-Hosting"],
    githubUrl: "https://github.com/GustavoWidman/nix",
    blogPostSlug: "nix-intro",
  },
  {
    id: "4",
    title: "Rust x86-64 Kernel",
    description: "",
    tags: ["Rust", "Kernel", "x86-64", "no_std"],
    githubUrl: "https://github.com/GustavoWidman/based-kernel",
    blogPostSlug: "based-kernel",
  },
  {
    id: "5",
    title: "1 Billion Row Challenge",
    description: "",
    tags: ["Rust", "Data Processing", "Parallelism", "mmap"],
    githubUrl: "https://github.com/GustavoWidman/1brc",
    blogPostSlug: "1brc",
  },
  {
    id: "6",
    title: "Cognitive Discord Bot",
    description: "",
    tags: ["Rust", "Agents", "Retrieval", "Discord"],
    githubUrl: "https://github.com/GustavoWidman/chatbot",
  },
];

export const STATIC_EXPERIENCE: Experience[] = [
  {
    id: "azion",
    company: "Azion",
    logo: (
      <Image
        src="/icons/azion_logo.jpg"
        alt="Azion Logo"
        fill
        sizes="48px"
        className="object-cover rounded"
      />
    ),
    positions: [
      {
        role: "Software Engineer II (Rust)",
        startDate: "2026-04-22",
        endDate: undefined,
        description: [],
        techStack: ["Rust", "Edge Computing", "CDN", "Distributed Systems", "High Performance"],
      },
    ],
  },
  {
    id: "camelsec",
    company: "CamelSec",
    logo: (
      <Image
        src="/icons/camelsec_logo.jpg"
        alt="CamelSec Logo"
        fill
        sizes="48px"
        className="object-cover rounded"
      />
    ),
    positions: [
      {
        role: "Technical Lead, Security Infrastructure",
        startDate: "2025-04-01",
        endDate: "2025-12-31",
        description: [],
        techStack: [
          "NixOS",
          "Rust",
          "WireGuard",
          "ISO 27001",
          "Linux Hardening",
          "Pentesting",
          "AI Agents",
        ],
      },
    ],
  },
  {
    id: "mwapp",
    company: "MW APP IT Consulting",
    logo: (
      <Image
        src="/icons/mwapp_logo.jpg"
        alt="MW APP IT Consulting Logo"
        fill
        sizes="48px"
        className="object-cover rounded"
      />
    ),
    positions: [
      {
        role: "Software Engineer",
        startDate: "2021-01-01",
        endDate: "2025-04-01",
        description: [],
        techStack: [
          "Vite",
          "React",
          "TypeScript",
          "Python",
          "NodeJS",
          "C# / .NET",
          "MSSQL",
          "MySQL",
        ],
      },
    ],
  },
];

export const SKILL_ICONS: SkillCategory[] = [
  {
    id: "low-level",
    icon: <Cpu size={20} />,
    skills: [
      { name: "Rust", icon: <FaRust size={16} /> },
      { name: "C / C++", icon: <SiC size={16} /> },
      { name: "x86 Assembly", icon: <Cpu size={16} /> },
      { name: "Kernel Dev", icon: <Server size={16} /> },
      { name: "Edge/CDN", icon: <Server size={16} /> },
    ],
  },
  {
    id: "devops",
    icon: <Container size={20} />,
    skills: [
      { name: "Nix / NixOS", icon: <SiNixos size={16} /> },
      { name: "Docker / K8s", icon: <SiDocker size={16} /> },
      { name: "WireGuard", icon: <SiWireguard size={16} /> },
      { name: "CI/CD Pipelines", icon: <SiGithubactions size={16} /> },
    ],
  },
  {
    id: "security-services",
    icon: <Shield size={20} />,
    skills: [
      { name: "Go (Golang)", icon: <TbBrandGolang size={16} /> },
      { name: "Python", icon: <SiPython size={16} /> },
      { name: "Rust", icon: <FaRust size={16} /> },
      { name: "Pentesting", icon: <Shield size={16} /> },
      { name: "Java", icon: <RiJavaLine size={16} /> },
    ],
  },
];
