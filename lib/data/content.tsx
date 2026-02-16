import { Container, Cpu, Server, Shield } from "lucide-react";
import { FaRust } from "react-icons/fa6";
import { RiJavaLine } from "react-icons/ri";
import { SiC, SiDocker, SiGithubactions, SiNixos, SiPython, SiWireguard } from "react-icons/si";
import { TbBrandGolang } from "react-icons/tb";
import type { Experience, Project, SkillCategory, TranslationData } from "@/lib/types";

export const IS_OPEN_TO_WORK = true;

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
      title2: "SOFTWARE",
      desc: "Building the kernel, hardening the infrastructure, and scaling the backend.",
      cta: "View Projects",
      github: "GitHub",
      resume: "Download CV",
    },
    about: {
      title: "01 / About Me",
      openToWork: "Open to Work",
      heading: (
        <>
          Full-stack engineering with a <br />
          <span className="text-zinc-500 dark:text-zinc-500">security-first mindset.</span>
        </>
      ),
      p1: (
        <>
          I am a Computer Engineering student at{" "}
          <span className="text-black dark:text-white font-semibold">INTELI</span> and a{" "}
          <span className="text-black dark:text-white font-semibold">Software Developer</span>
        </>
      ),
      p2: (
        <>
          My expertise spans from the metal up. I write{" "}
          <span className="text-black dark:text-white font-semibold">Rust</span> kernels for fun,
          architect reproducible{" "}
          <span className="text-black dark:text-white font-semibold">NixOS</span> infrastructures
          for work, and break them both during{" "}
          <span className="text-black dark:text-white font-semibold">red team</span> operations.
        </>
      ),
      p3: (
        <>
          Whether configuring high-security VPNs with WireGuard or building distributed Go
          microservices, I prioritize correctness, security, and performance.
        </>
      ),
    },
    stack: {
      title: "02 / The Stack",
      categories: [
        {
          title: "Systems & Low Level",
          description:
            "Where software meets hardware. I specialize in building performant, memory-safe systems near the metal.",
        },
        {
          title: "DevOps & Infrastructure",
          description:
            "Infrastructure as Code is not just a buzzword. I build reproducible, hardened environments that scale.",
        },
        {
          title: "Backend & Security",
          description:
            "Architecting distributed systems and ensuring they remain secure against modern threats.",
        },
      ],
    },
    experience: {
      title: "03 / Professional Experience",
      present: "Present",
      jobs: [
        {
          company: "CamelSec",
          positions: [
            {
              role: "Chief Technology Officer (CTO)",
              description: [
                "Leading technical strategy and infrastructure for a cybersecurity consulting startup.",
                "Performing advanced penetration testing and red teaming operations for enterprise clients.",
                "Architecting fully reproducible, hardened infrastructure using NixOS and Home Manager.",
                "Designing secure internal networks using WireGuard with redundant staging environments.",
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
                "Full Stack development using Python, Node.js, and C# on the backend.",
                "Frontend development with React, Vite, and TypeScript.",
                "Database management for MS SQL, MySQL, and SQLite.",
                "Clients served: CESP (Database Management), Hunter Douglas (E-commerce) and CETESB.",
              ],
            },
          ],
        },
      ],
    },
    projects: {
      title: "04 / Selected Works",
      viewSource: "View Source",
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
      title2: "SOFTWARE",
      desc: "Desenvolvendo o kernel, protegendo a infraestrutura e escalando o backend.",
      cta: "Ver Projetos",
      github: "GitHub",
      resume: "Baixar CV",
    },
    about: {
      title: "01 / Sobre Mim",
      openToWork: "Disponível",
      heading: (
        <>
          Engenharia Full-stack com foco em <br />
          <span className="text-zinc-500 dark:text-zinc-500">segurança em primeiro lugar.</span>
        </>
      ),
      p1: (
        <>
          Sou estudante de Engenharia da Computação no{" "}
          <span className="text-black dark:text-white font-semibold">INTELI</span> e{" "}
          <span className="text-black dark:text-white font-semibold">CTO na CamelSec</span>.
        </>
      ),
      p2: (
        <>
          Minha expertise vai do hardware ao software. Escrevo kernels em{" "}
          <span className="text-black dark:text-white font-semibold">Rust</span> por diversão,
          arquiteto infraestruturas{" "}
          <span className="text-black dark:text-white font-semibold">NixOS</span> reprodutíveis
          profissionalmente e quebro ambos em operações de{" "}
          <span className="text-black dark:text-white font-semibold">red team</span>.
        </>
      ),
      p3: (
        <>
          Seja configurando VPNs seguras com WireGuard ou construindo microsserviços distribuídos em
          Go, priorizo corretude, segurança e performance.
        </>
      ),
    },
    stack: {
      title: "02 / Stack Tecnológico",
      categories: [
        {
          title: "Sistemas & Baixo Nível",
          description:
            "Onde software encontra hardware. Especialista em construir sistemas performáticos e memory-safe próximos ao metal.",
        },
        {
          title: "DevOps & Infraestrutura",
          description:
            'Infrastructure as Code não é só buzzword. Construo ambientes reprodutíveis e "hardened" que escalam.',
        },
        {
          title: "Backend & Segurança",
          description:
            "Arquitetando sistemas distribuídos e garantindo segurança contra ameaças modernas.",
        },
      ],
    },
    experience: {
      title: "03 / Experiência Profissional",
      present: "Atualmente",
      jobs: [
        {
          company: "CamelSec",
          positions: [
            {
              role: "Chief Technology Officer (CTO)",
              description: [
                "Liderando estratégia técnica e infraestrutura para uma startup de consultoria em segurança.",
                "Executando testes de intrusão avançados e operações de red team para clientes corporativos.",
                "Arquitetando infraestrutura totalmente reprodutível e segura usando NixOS e Home Manager.",
                "Projetando redes internas seguras usando WireGuard com ambientes de staging redundantes.",
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
                "Desenvolvimento Full Stack de sistemas utilizando Python, JavaScript (NodeJS) e C# no back-end.",
                "Desenvolvimento Front-end com React, Vite e TypeScript.",
                "Gerenciamento de banco de dados MS SQL, MySQL e SQLite.",
                "Clientes atendidos: CESP (banco de dados), Hunter Douglas (site de e-commerce) e CETESB.",
              ],
            },
          ],
        },
      ],
    },
    projects: {
      title: "04 / Projetos Selecionados",
      viewSource: "Código",
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
  },
};

export const STATIC_PROJECTS: Project[] = [
  {
    id: "1",
    title: "Rust x86 Kernel",
    description: "",
    tags: ["Rust", "OS Dev", "x86 Assembly", "No Std"],
    githubUrl: "https://github.com/GustavoWidman/based-kernel",
  },
  {
    id: "2",
    title: "NixOS Infrastructure",
    description: "",
    tags: ["Nix", "NixOS", "DevOps", "Self-Hosting"],
    githubUrl: "https://github.com/GustavoWidman/nix",
  },
  {
    id: "3",
    title: "Zero-Dependency RNN",
    description: "",
    tags: ["Rust", "Machine Learning", "HPC", "Math"],
    githubUrl: "https://github.com/GustavoWidman/rnn-rust",
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
    id: "camelsec",
    company: "CamelSec",
    logo: (
      <img
        src="/icons/camelsec_logo.jpg"
        alt="CamelSec Logo"
        className="w-full h-full object-cover rounded"
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
      <img
        src="/icons/echosec_logo.jpg"
        alt="EchoSec Logo"
        className="w-full h-full object-cover rounded"
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
      <img
        src="/icons/mwapp_logo.jpg"
        alt="MW APP IT Consulting Logo"
        className="w-full h-full object-cover rounded"
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
    id: "backend",
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
