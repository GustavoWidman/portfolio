"use client";

import { AlertTriangle, Maximize2, Terminal as TerminalIcon } from "lucide-react";
import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";
const COMMIT_HASH = process.env.NEXT_PUBLIC_COMMIT_HASH ?? "unknown";
const IS_DEV = process.env.NODE_ENV === "development";

const BOOT_SEQUENCE = [
  "Initializing boot sequence...",
  "[ OK ] Loaded: rustc v1.91.1 (stable)",
  "[ OK ] Rebuilding: nixos-rebuild switch --flake .#infra",
  "[ OK ] Connected: WireGuard VPN (secure-tunnel)",
  "[ OK ] System Ready.",
  "Type 'help' for available commands.",
];

const generateLsLikeDate = () => {
  const now = new Date();
  const randomMinutes = Math.random() * 60 - 30;
  const offsetMs = randomMinutes * 60 * 1000;
  const date = new Date(now.getTime() + offsetMs);

  const monthAbbr = date.toLocaleString("en-US", { month: "short" });
  const day = String(date.getDate()).padStart(2, " ");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${monthAbbr} ${day} ${hours}:${minutes}`;
};

interface TerminalLine {
  id: number;
  text: string;
}

interface TerminalState {
  lines: TerminalLine[];
  nextId: number;
  isBooting: boolean;
  isMinimized: boolean;
}

type TerminalAction =
  | { type: "ADD_LINE"; line: string }
  | { type: "SET_LINES"; lines: string[] }
  | { type: "FINISH_BOOT" }
  | { type: "MINIMIZE" }
  | { type: "RESTORE" };

function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case "ADD_LINE":
      return {
        ...state,
        lines: [...state.lines, { id: state.nextId, text: action.line }],
        nextId: state.nextId + 1,
      };
    case "SET_LINES":
      return {
        ...state,
        lines: action.lines.map((text, i) => ({ id: state.nextId + i, text })),
        nextId: state.nextId + action.lines.length,
      };
    case "FINISH_BOOT":
      return { ...state, isBooting: false };
    case "MINIMIZE":
      return { lines: [], nextId: 0, isBooting: true, isMinimized: true };
    case "RESTORE":
      return { ...state, isMinimized: false };
    default:
      return state;
  }
}

interface TerminalProps {
  startBoot?: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ startBoot = false }) => {
  const [state, dispatch] = useReducer(terminalReducer, {
    lines: [],
    nextId: 0,
    isBooting: true,
    isMinimized: false,
  });
  const [input, setInput] = React.useState("");
  const contentRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!startBoot) return;

    let lineIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex >= BOOT_SEQUENCE.length) {
        dispatch({ type: "FINISH_BOOT" });
        clearInterval(interval);
        return;
      }
      dispatch({ type: "ADD_LINE", line: BOOT_SEQUENCE[lineIndex] });
      lineIndex++;
    }, 200);

    return () => clearInterval(interval);
  }, [startBoot]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [state.lines, state.isMinimized]);

  useEffect(() => {
    if (!state.isBooting && !state.isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isBooting, state.isMinimized]);

  const handleCommand = useCallback(
    (cmd: string) => {
      const existingTexts = state.lines.map((l) => l.text);
      const newTexts = [...existingTexts, `widman@nixos:~$ ${cmd}`];
      const lowerCmd = cmd.toLowerCase().trim();

      if (lowerCmd.includes("rm -rf /") || lowerCmd.includes("rm -rf --no-preserve-root /")) {
        newTexts.push(
          "CRITICAL: ROOT PERMISSION GRANTED.",
          "Deleting system files...",
          "KERNEL PANIC: Attempted to kill init!",
          "System is halting NOW.",
        );
        dispatch({ type: "SET_LINES", lines: newTexts });
        setInput("");

        setTimeout(() => {
          dispatch({ type: "MINIMIZE" });
        }, 1500);
        return;
      }

      if (lowerCmd.startsWith("cv")) {
        const args = lowerCmd.split(" ");
        if (args.length === 1) {
          newTexts.push("Usage: cv [en|pt]");
          newTexts.push("Example: cv en");
        } else {
          const lang = args[1];
          if (["en", "english", "us"].includes(lang)) {
            newTexts.push("Downloading CV (English)...");
            window.open("/resume-en.pdf", "_blank");
          } else if (["pt", "br", "portuguese"].includes(lang)) {
            newTexts.push("Downloading CV (Portuguese)...");
            window.open("/resume-pt.pdf", "_blank");
          } else {
            newTexts.push(`Error: Language '${lang}' not found. Available: en, pt`);
          }
        }
        dispatch({ type: "SET_LINES", lines: newTexts });
        setInput("");
        return;
      }

      switch (lowerCmd) {
        case "help":
          newTexts.push(
            "Available commands:",
            "  whoami    - Bio & Role",
            "  stack     - Tech Stack",
            "  github    - Open GitHub Profile",
            "  linkedin  - Open LinkedIn Profile",
            "  exp       - Professional Experience",
            "  ls        - List projects",
            "  cv [lang] - Download Resume (en/pt)",
            "  blog      - Read my blog",
            "  version   - Show version info",
            "  clear     - Clear terminal",
          );
          break;
        case "version":
          newTexts.push(
            `portfolio v${APP_VERSION}`,
            `commit: ${COMMIT_HASH}`,
            `mode: ${IS_DEV ? "development" : "production"}`,
            `built with Next.js 15 + React 19 + Nix`,
          );
          break;
        case "blog":
          newTexts.push("Opening blog...");
          router.push("/blog");
          break;
        case "whoami":
          newTexts.push(
            "Gustavo Widman.",
            "Backend Engineer.",
            "Specialist in Systems Programming, NixOS Infrastructure,",
            "and Cybersecurity (Red Teaming).",
          );
          break;
        case "exp":
          newTexts.push(
            "--- Professional Experience ---",
            "CTO @ CamelSec (August 2025 - December 2025)",
            " > Orchestrating NixOS-based infrastructure",
            " > Leading Pentesting & Red Team operations",
            "",
            "EchoSec (2023-Present)",
            " > Counselor / President / Member",
            "",
            "MW APP IT Consulting (2021-2025)",
            " > Full-Stack Developer",
            " > Managed client projects with Python, ",
            " > React, Vue, MSSQL, C# and more...",
          );
          break;
        case "stack":
          newTexts.push(
            "--- Systems & Low Level ---",
            "Rust, C, Assembly (x86), Kernel Dev",
            "",
            "--- DevOps & Cloud ---",
            "NixOS, Docker, K8s, WireGuard, CI/CD",
            "",
            "--- High Level ---",
            "Go, Python, Java, TypeScript",
          );
          break;
        case "ls":
          newTexts.push(
            "total 6",
            `drwx------ 1 widman rust   1024 ${generateLsLikeDate()} based-kernel`,
            `drwx------ 1 widman nixos  1024 ${generateLsLikeDate()} nix`,
            `drwx------ 1 widman rust   1024 ${generateLsLikeDate()} rust-rnn`,
            `drwx------ 1 widman rust   1024 ${generateLsLikeDate()} chatbot`,
            `drwx------ 1 widman rust   1024 ${generateLsLikeDate()} 1brc`,
            `drwx------ 1 widman golang 1024 ${generateLsLikeDate()} screenium`,
          );
          break;
        case "sudo":
          newTexts.push("user is not in the sudoers file. This incident will be reported.");
          break;
        case "linkedin":
          newTexts.push("Opening LinkedIn...");
          window.open("https://www.linkedin.com/in/gustavo-widman", "_blank");
          break;
        case "github":
          newTexts.push("Opening GitHub...");
          window.open("https://github.com/GustavoWidman", "_blank");
          break;
        case "clear":
          setInput("");
          dispatch({ type: "SET_LINES", lines: [] });
          return;
        case "":
          break;
        default:
          newTexts.push(`bash: command not found: ${cmd}`);
      }

      dispatch({ type: "SET_LINES", lines: newTexts });
      setInput("");
    },
    [router, state.lines],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCommand(input);
      }
    },
    [input, handleCommand],
  );

  if (state.isMinimized) {
    return (
      <button
        type="button"
        onClick={() => dispatch({ type: "RESTORE" })}
        className="w-full h-12 bg-zinc-900 border border-red-500/50 rounded-xl overflow-hidden shadow-2xl flex items-center justify-between px-4 cursor-pointer hover:bg-zinc-800 transition-colors animate-pulse"
        style={{
          contain: "layout style paint",
        }}
        aria-label="Restore terminal window"
      >
        <div className="flex items-center gap-2 text-red-400 font-mono text-xs">
          <AlertTriangle size={14} />
          <span>SYSTEM CRASHED (Minimized) - Click to restore kernel</span>
        </div>
        <Maximize2 size={14} className="text-zinc-500" />
      </button>
    );
  }

  return (
    <div className="w-full h-full bg-black border border-zinc-800 rounded-xl overflow-hidden font-mono text-sm shadow-2xl flex flex-col">
      {/* Terminal Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-600/50" />
          <div className="w-3 h-3 rounded-full bg-zinc-600/50" />
          <div className="w-3 h-3 rounded-full bg-zinc-600/50" />
        </div>
        <div className="text-zinc-500 text-xs font-medium flex items-center gap-2 opacity-60">
          <TerminalIcon size={12} />
          <span>widman@nixos:~/workspace</span>
        </div>
        <div className="w-3"></div>
      </div>

      {/* Terminal Content */}
      <button
        ref={contentRef}
        type="button"
        className="flex flex-col flex-1 overflow-y-auto p-4 bg-black text-zinc-300 selection:bg-white selection:text-black custom-scrollbar scroll-smooth cursor-text border-none text-left disabled:cursor-not-allowed"
        onClick={() => inputRef.current?.focus()}
        onKeyDown={() => inputRef.current?.focus()}
      >
        {state.lines.map((item) => {
          if (!item || !item.text) {
            return null;
          }

          return <TerminalLine key={item.id} line={item.text} />;
        })}

        {!state.isBooting && (
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">widman@nixos:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none flex-1 text-white caret-white p-0"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        )}
      </button>
    </div>
  );
};

const TerminalLine: React.FC<{ line: string }> = React.memo(({ line }) => {
  if (line.startsWith("widman@nixos:~$")) {
    const prompt = "widman@nixos:~$";
    const rest = line.substring(prompt.length);
    return (
      <div className="mb-1.5 wrap-break-word leading-relaxed whitespace-pre-wrap">
        <span className="text-white font-bold">{prompt}</span>
        <span>{rest}</span>
      </div>
    );
  }
  if (line.startsWith("[ OK ]")) {
    return (
      <div className="mb-1.5 wrap-break-word leading-relaxed whitespace-pre-wrap">
        <span>
          <span className="text-zinc-500">[ </span>
          <span className="text-green-500 font-bold">OK</span>
          <span className="text-zinc-500"> ]</span>
          {line.substring(6)}
        </span>
      </div>
    );
  }
  if (line.includes("KERNEL PANIC") || line.includes("CRITICAL")) {
    return (
      <div className="mb-1.5 wrap-break-word leading-relaxed whitespace-pre-wrap">
        <span className="text-red-500 font-bold">{line}</span>
      </div>
    );
  }
  return <div className="mb-1.5 wrap-break-word leading-relaxed whitespace-pre-wrap">{line}</div>;
});

TerminalLine.displayName = "TerminalLine";

export default React.memo(Terminal);
