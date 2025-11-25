import { AlertTriangle, Maximize2, Terminal as TerminalIcon } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

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

  // Random offset between -30 and +30 minutes (in milliseconds)
  const randomMinutes = Math.random() * 60 - 30;
  const offsetMs = randomMinutes * 60 * 1000;

  // Apply offset
  const date = new Date(now.getTime() + offsetMs);

  // Format as "Nov 25 22:21"
  const monthAbbr = date.toLocaleString("en-US", { month: "short" });
  const day = String(date.getDate()).padStart(2, " ");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${monthAbbr} ${day} ${hours}:${minutes}`;
};

interface TerminalProps {
  startBoot?: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ startBoot = false }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const contentRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Progressive Boot Animation
  useEffect(() => {
    if (!startBoot) return;

    const interval = setInterval(() => {
      setLines((prev) => {
        if (prev.length >= BOOT_SEQUENCE.length) {
          setIsBooting(false);
          clearInterval(interval);
          return prev;
        }
        return [...prev, BOOT_SEQUENCE[prev.length]];
      });
    }, 200);

    return () => clearInterval(interval);
  }, [startBoot]);

  // Auto-scroll logic that stays contained within the terminal div
  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run this when lines or isMinimized change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [lines, isMinimized]);

  // Focus input when booting finishes
  useEffect(() => {
    if (!isBooting && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isBooting, isMinimized]);

  // Memoize command handler to prevent unnecessary re-renders
  const handleCommand = useCallback((cmd: string) => {
    setLines((prevLines) => {
      const newLines = [...prevLines, `widman@nixos:~$ ${cmd}`];
      const lowerCmd = cmd.toLowerCase().trim();

      // Easter Egg: rm -rf /
      if (lowerCmd.includes("rm -rf /") || lowerCmd.includes("rm -rf --no-preserve-root /")) {
        newLines.push(
          "CRITICAL: ROOT PERMISSION GRANTED.",
          "Deleting system files...",
          "KERNEL PANIC: Attempted to kill init!",
          "System is halting NOW.",
        );
        setLines(newLines);
        setInput("");

        // Trigger minimize after a delay
        setTimeout(() => {
          setIsMinimized(true);
          setLines([]); // Clear terminal for next restore
          setIsBooting(true); // Reset boot state for when restored (optional, or just show lines)
        }, 1500);
        return newLines;
      }

      switch (lowerCmd) {
        case "help":
          newLines.push(
            "Available commands:",
            "  whoami    - Bio & Role",
            "  stack     - Tech Stack",
            "  github    - Open GitHub Profile",
            "  linkedin  - Open LinkedIn Profile",
            "  exp       - Professional Experience",
            "  ls        - List projects",
            "  clear     - Clear terminal",
          );
          break;
        case "whoami":
          newLines.push(
            "Gustavo Widman.",
            "CTO @ CamelSec | Backend Engineer.",
            "Specialist in Systems Programming, NixOS Infrastructure,",
            "and Cybersecurity (Red Teaming).",
          );
          break;
        case "exp":
          newLines.push(
            "--- Professional Experience ---",
            "CTO @ CamelSec (Current)",
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
          newLines.push(
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
          newLines.push(
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
          newLines.push("user is not in the sudoers file. This incident will be reported.");
          break;
        case "linkedin":
          newLines.push("Opening LinkedIn...");
          window.open("https://www.linkedin.com/in/gustavo-widman", "_blank");
          break;
        case "github":
          newLines.push("Opening GitHub...");
          window.open("https://github.com/GustavoWidman", "_blank");
          break;
        case "clear":
          setInput("");
          return [];
        case "":
          break;
        default:
          newLines.push(`bash: command not found: ${cmd}`);
      }

      return newLines;
    });
    setInput("");
  }, []);

  // Memoize key down handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCommand(input);
      }
    },
    [input, handleCommand],
  );

  const renderLine = (line: string) => {
    if (line.startsWith("[ OK ]")) {
      return (
        <span>
          <span className="text-zinc-500">[ </span>
          <span className="text-green-500 font-bold">OK</span>
          <span className="text-zinc-500"> ]</span>
          {line.substring(6)}
        </span>
      );
    }
    if (line.includes("KERNEL PANIC") || line.includes("CRITICAL")) {
      return <span className="text-red-500 font-bold">{line}</span>;
    }
    return line;
  };

  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
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
        {lines.map((item) => {
          if (!item || typeof item !== "string") {
            return null;
          }

          return (
            <div
              className="mb-1.5 wrap-break-word leading-relaxed whitespace-pre-wrap"
              key={item + Math.random()}
            >
              {renderLine(item)}
            </div>
          );
        })}

        {!isBooting && (
          <div className="flex items-center gap-2 mt-2">
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

export default React.memo(Terminal);
