"use client";

import { useEffect, useRef } from "react";

interface IntroLine {
  id: number;
  text: string;
}

const bootText = [
  "> KERNEL: Initializing...",
  "> CPU: Intel Core i9-13900K @ 5.8GHz detected",
  "> MEM: 64GB DDR5 OK",
  "> LOADING: NixOS configuration...",
  "> MOUNT: /dev/nvme0n1p2 -> /",
  "> NETWORK: WireGuard interface [wg0] UP",
  "> SYSTEM: Starting window manager...",
  "> USER: widman (UID 1000)",
  "> ACCESS GRANTED.",
];

interface IntroProps {
  onComplete: () => void;
}

const Intro = ({ onComplete }: IntroProps) => {
  const linesRef = useRef<IntroLine[]>([]);
  const progressRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lineIndex = 0;
    let animationFrame: number;
    let lastProgressUpdate = 0;
    let lastLineUpdate = 0;
    let isComplete = false;

    const updateProgress = (progress: number) => {
      progressRef.current = progress;
      const progressEl = container.querySelector("[data-progress]") as HTMLElement;
      const progressText = container.querySelector("[data-progress-text]");
      if (progressEl) {
        progressEl.style.transform = `scaleX(${progress / 100})`;
      }
      if (progressText) {
        progressText.textContent = `${progress}%`;
      }
    };

    const addLine = (id: number, text: string) => {
      linesRef.current = [...linesRef.current, { id, text }];
      const linesContainer = container.querySelector("[data-lines]");
      if (linesContainer) {
        const lineEl = document.createElement("div");
        lineEl.textContent = text;
        lineEl.className = "text-zinc-500";
        linesContainer.appendChild(lineEl);
        if (id === bootText.length - 1) {
          lineEl.className = "text-white animate-pulse";
        }
      }
    };

    const animate = (timestamp: number) => {
      if (isComplete) return;

      if (timestamp - lastProgressUpdate >= 30) {
        progressRef.current = Math.min(progressRef.current + 2, 100);
        updateProgress(progressRef.current);
        lastProgressUpdate = timestamp;
      }

      if (timestamp - lastLineUpdate >= 150 && lineIndex < bootText.length) {
        addLine(lineIndex, bootText[lineIndex]);
        lineIndex++;
        lastLineUpdate = timestamp;
      }

      if (timestamp >= 1500 && !isComplete) {
        isComplete = true;
        updateProgress(100);
        setTimeout(onComplete, 800);
        return;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      isComplete = true;
      cancelAnimationFrame(animationFrame);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-mono text-xs md:text-sm text-zinc-400 p-8 cursor-wait">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex flex-col gap-1 h-[200px] justify-end overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
          <div data-lines className="flex flex-col gap-1" />
        </div>

        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            data-progress
            className="h-full bg-white transition-none"
            style={{
              transform: "scaleX(0)",
              transformOrigin: "left",
            }}
          />
        </div>

        <div className="flex justify-between text-zinc-600 text-[10px] uppercase tracking-widest">
          <span>Boot Sequence</span>
          <span data-progress-text>0%</span>
        </div>
      </div>
    </div>
  );
};

export default Intro;
