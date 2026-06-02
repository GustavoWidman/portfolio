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
      subtitle: "Gustavo Widman // Engineering Portfolio",
      title1: "SYSTEMS &",
      title2: "HPC",
      desc: "Writing low-level software, tuning data-heavy workloads, and keeping the infrastructure tight.",
      cta: "View Projects",
      github: "GitHub",
      resume: "Download CV",
    },
    about: {
      title: "01 / About Me",
      openToWork: "Open to Work",
      heading: (
        <>
          Systems programming with a <br />
          <span className="text-zinc-500 dark:text-zinc-500">security-aware, infrastructure-heavy mindset.</span>
        </>
      ),
      p1: (
        <>
          I am a Computer Engineering student at{" "}
          <span className="text-black dark:text-white font-semibold">INTELI</span> and a{" "}
          <span className="text-black dark:text-white font-semibold">Rust Software Engineer at Azion</span>.
        </>
      ),
      p2: (
        <>
          Most of my time goes into{" "}
          <span className="text-black dark:text-white font-semibold">systems programming</span>,{" "}
          <span className="text-black dark:text-white font-semibold">performance work</span>, and
          reproducible{" "}
          <span className="text-black dark:text-white font-semibold">NixOS</span> infrastructure. I
          like understanding how software behaves close to the machine, not just at the service layer.
        </>
      ),
      p3: (
        <>
          Outside that core, I also work on{" "}
          <span className="text-black dark:text-white font-semibold">cybersecurity</span> and
          distributed systems: red team operations, hardened networks with WireGuard, and the services
          that support them.
        </>
      ),
    },
    stack: {
      title: "02 / The Stack",
      categories: [
        {
          title: "Systems, HPC & Low Level",
          description:
            "Rust-heavy work near the metal: kernels, memory-sensitive code, parallel workloads, and systems tooling.",
        },
        {
          title: "Infrastructure & Operations",
          description:
            "Reproducible NixOS environments, deployment plumbing, networking, and the day-to-day work of keeping systems sane.",
        },
        {
          title: "Security & Service Layers",
          description:
            "Offensive security work plus the protocols, data paths, and service code that support it.",
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
              role: "Chief Technology Officer (CTO)",
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
          company: "EchoSec",
          positions: [
            {
              role: "Counselor",
              description: [
                "Advising the current board on strategic decisions and community growth.",
                "Mentoring new members in CTF challenges and offensive security concepts.",
              ],
            },
            {
              role: "President",
              description: [
                "Led the cybersecurity league at INTELI, organizing workshops and events.",
                "Coordinated internal CTF competitions and external representation.",
              ],
            },
            {
              role: "Member",
              description: [
                "Participated in security research groups and initial league formation.",
                "Collaborated on open-source security tools and learning initiatives.",
              ],
            },
          ],
        },
        {
          company: "MW APP IT Consulting",
          positions: [
            {
              role: "Full Stack Developer",
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
          title: "Rust x86 Kernel",
          description:
            "A custom x86 kernel built from scratch in Rust (no_std). Features VGA drivers, interrupt handling, paging, and a functional Tic-Tac-Toe game running directly on bare metal.",
        },
        {
          id: "2",
          title: "NixOS Infrastructure",
          description:
            "Monorepo managing my entire digital infrastructure. Manages 5 machines (cloud & physical) with reproducible builds, hosting mail servers, DNS ad-blocking, and VPNs.",
        },
        {
          id: "3",
          title: "Zero-Dependency RNN",
          description:
            "A Recurrent Neural Network built from scratch in pure Rust. Hand-optimized memory management and math operations allow it to beat PyTorch and Keras in training speed.",
        },
        {
          id: "4",
          title: "Cognitive Discord Bot",
          description:
            "Sophisticated bot featuring a 'Free Will' engine and RAG memory. Integrates with LLMs via Vector DBs to maintain long-term personality and context awareness.",
        },
        {
          id: "5",
          title: "1 Billion Row Challenge",
          description:
            "High-performance solution to the 1BRC. Utilizes memory mapping (mmap) and intelligent parallelism (Rayon) to process gigabytes of data in seconds without the need for SIMD.",
        },
        {
          id: "6",
          title: "Screenium (Go Multiplexer)",
          description:
            "A modern remake of GNU Screen written in Go. Supports multiple parallel shell sessions, detaching/attaching, and robust session management.",
        },
      ],
    },
    footer: {
      title: "Ready to collaborate?",
      subtitle:
        "From low-level kernel development to high-availability distributed systems, I'm ready to build.",
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
      title: "Systems Programmer",
      sites: "https://guswid.com | https://r3dlust.com",
      source: "src: https://github.com/GustavoWidman/portfolio",
      aboutHeader: "About",
      aboutText: [
        "Systems programmer",
        "focused on low-level",
        "software, HPC, and",
        "reproducible infrastructure.",
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
      subtitle: "Gustavo Widman // Portfólio de Engenharia",
      title1: "SISTEMAS &",
      title2: "HPC",
      desc: "Escrevendo software de baixo nível, ajustando cargas pesadas e mantendo a infraestrutura sob controle.",
      cta: "Ver Projetos",
      github: "GitHub",
      resume: "Baixar CV",
    },
    about: {
      title: "01 / Sobre Mim",
      openToWork: "Disponível",
      heading: (
        <>
          Programação de sistemas com uma <br />
          <span className="text-zinc-500 dark:text-zinc-500">visão de segurança e muita infraestrutura.</span>
        </>
      ),
      p1: (
        <>
          Sou estudante de Engenharia da Computação no{" "}
          <span className="text-black dark:text-white font-semibold">INTELI</span> e{" "}
          <span className="text-black dark:text-white font-semibold">Software Engineer em Rust na Azion</span>.
        </>
      ),
      p2: (
        <>
          A maior parte do meu tempo vai para{" "}
          <span className="text-black dark:text-white font-semibold">programação de sistemas</span>,{" "}
          <span className="text-black dark:text-white font-semibold">trabalho de performance</span> e
          infraestrutura reprodutível em{" "}
          <span className="text-black dark:text-white font-semibold">NixOS</span>. Gosto de entender
          como o software se comporta perto da máquina, não só na camada de serviço.
        </>
      ),
      p3: (
        <>
          Fora desse núcleo, também atuo com{" "}
          <span className="text-black dark:text-white font-semibold">segurança</span> e sistemas
          distribuídos: operações de red team, redes endurecidas com WireGuard e os serviços que dão
          suporte a isso.
        </>
      ),
    },
    stack: {
      title: "02 / Stack Tecnológico",
      categories: [
        {
          title: "Sistemas, HPC & Baixo Nível",
          description:
            "Trabalho pesado em Rust perto do metal: kernels, código sensível à memória, cargas paralelas e tooling de sistemas.",
        },
        {
          title: "Infraestrutura & Operações",
          description:
            "Ambientes reprodutíveis em NixOS, automação de deploy, redes e a rotina de manter sistemas estáveis.",
        },
        {
          title: "Segurança & Camadas de Serviço",
          description:
            "Segurança ofensiva junto com os protocolos, fluxos de dados e serviços que a sustentam.",
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
              role: "Chief Technology Officer (CTO)",
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
          company: "EchoSec",
          positions: [
            {
              role: "Conselheiro",
              description: [
                "Aconselhando a diretoria atual em decisões estratégicas e crescimento da comunidade.",
                "Mentoria de novos membros em desafios CTF e conceitos de segurança ofensiva.",
              ],
            },
            {
              role: "Presidente",
              description: [
                "Liderei a liga de segurança cibernética do INTELI, organizando workshops e eventos.",
                "Coordenei competições internas de CTF e representação externa.",
              ],
            },
            {
              role: "Membro",
              description: [
                "Participei de grupos de pesquisa de segurança e da formação inicial da liga.",
                "Colaborei em ferramentas de segurança open-source e iniciativas de aprendizado.",
              ],
            },
          ],
        },
        {
          company: "MW APP IT Consulting",
          positions: [
            {
              role: "Desenvolvedor Full Stack",
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
          title: "Kernel x86 em Rust",
          description:
            "Um kernel x86 customizado construído do zero em Rust (no_std). Possui drivers VGA, tratamento de interrupções e um jogo da velha rodando diretamente no hardware.",
        },
        {
          id: "2",
          title: "Infraestrutura NixOS",
          description:
            "Monorepo gerenciando toda minha infraestrutura digital. Gerencia 5 máquinas com builds reprodutíveis, hospedando servidores de email, bloqueio de anúncios e VPNs.",
        },
        {
          id: "3",
          title: "RNN Zero-Dependências",
          description:
            "Implementação de RNN em Rust puro. Otimizada manualmente com operações matemáticas de baixo nível para superar PyTorch e Keras em velocidade de treino.",
        },
        {
          id: "4",
          title: "Bot Cognitivo (Discord)",
          description:
            "Bot sofisticado com 'Livre Arbítrio' e memória RAG. Integra-se com LLMs via bancos vetoriais para manter personalidade e contexto a longo prazo.",
        },
        {
          id: "5",
          title: "1 Billion Row Challenge",
          description:
            "Solução de alta performance para o 1BRC. Utiliza mapeamento de memória (mmap) e paralelismo inteligente (Rayon) para processar gigabytes de dados em segundos.",
        },
        {
          id: "6",
          title: "Screenium (Multiplexer Go)",
          description:
            "Um remake moderno do GNU Screen escrito em Go. Suporta múltiplas sessões de shell paralelas, anexar/desanexar e gerenciamento robusto de sessões.",
        },
      ],
    },
    footer: {
      title: "Pronto para colaborar?",
      subtitle:
        "De desenvolvimento de kernel baixo nível a sistemas distribuídos de alta disponibilidade, estou pronto para construir.",
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
      title: "Programador de Sistemas",
      sites: "https://guswid.com | https://r3dlust.com",
      source: "src: https://github.com/GustavoWidman/portfolio",
      aboutHeader: "Sobre",
      aboutText: [
        "Programador de sistemas",
        "focado em software",
        "de baixo nível, HPC e",
        "infraestrutura reprodutível.",
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
    title: "Rust x86 Kernel",
    description: "",
    tags: ["Rust", "OS Dev", "x86 Assembly", "No Std"],
    githubUrl: "https://github.com/GustavoWidman/based-kernel",
    blogPostSlug: "based-kernel",
  },
  {
    id: "2",
    title: "NixOS Infrastructure",
    description: "",
    tags: ["Nix", "NixOS", "DevOps", "Self-Hosting"],
    githubUrl: "https://github.com/GustavoWidman/nix",
    blogPostSlug: "nix-intro",
  },
  {
    id: "3",
    title: "Zero-Dependency RNN",
    description: "",
    tags: ["Rust", "Machine Learning", "HPC", "Math"],
    githubUrl: "https://github.com/GustavoWidman/rnn-rust",
    blogPostSlug: "rnn-rust",
  },
  {
    id: "4",
    title: "Cognitive Discord Bot",
    description: "",
    tags: ["Rust", "AI", "RAG", "Vector DB"],
    githubUrl: "https://github.com/GustavoWidman/chatbot",
  },
  {
    id: "5",
    title: "1 Billion Row Challenge",
    description: "",
    tags: ["Rust", "HPC", "Concurrency", "Systems"],
    githubUrl: "https://github.com/GustavoWidman/1brc",
  },
  {
    id: "6",
    title: "Screenium",
    description: "",
    tags: ["Go", "Systems", "CLI", "Terminal"],
    githubUrl: "https://github.com/GustavoWidman/screenium",
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
        techStack: [
          "Rust",
          "Edge Computing",
          "CDN",
          "Distributed Systems",
          "High Performance",
        ],
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
        role: "Chief Technology Officer (CTO)",
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
    id: "echosec",
    company: "EchoSec",
    logo: (
      <Image
        src="/icons/echosec_logo.jpg"
        alt="EchoSec Logo"
        fill
        sizes="48px"
        className="object-cover rounded"
      />
    ),
    positions: [
      {
        role: "Counselor",
        startDate: "2025-08-01",
        endDate: undefined,
        description: [],
        techStack: ["Advising", "Mentorship", "Education"],
      },
      {
        role: "President",
        startDate: "2024-03-01",
        endDate: "2024-07-30",
        description: [],
        techStack: ["Leadership", "Event Org", "CTF Mgmt"],
      },
      {
        role: "Member",
        startDate: "2023-09-01",
        endDate: "2024-03-17",
        description: [],
        techStack: ["CyberSecurity", "Research", "Linux", "Pentesting", "Teamwork"],
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
        role: "Full Stack Developer",
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
      { name: "HPC", icon: <Cpu size={16} /> },
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
