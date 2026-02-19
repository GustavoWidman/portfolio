"use client";

import { useEffect, useRef, useState } from "react";

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
  const [lines, setLines] = useState<IntroLine[]>([]);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    let lineIndex = 0;
    let currentProgress = 0;

    const textInterval = setInterval(() => {
      if (lineIndex >= bootText.length) {
        clearInterval(textInterval);
        return;
      }
      const currentIndex = lineIndex;
      setLines((prev) => [...prev, { id: currentIndex, text: bootText[currentIndex] }]);
      lineIndex++;
    }, 150);

    const progressInterval = setInterval(() => {
      currentProgress = Math.min(currentProgress + 2, 100);
      progressRef.current = currentProgress;
      setProgress(currentProgress);
    }, 30);

    const completionTimeout = setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(onComplete, 800);
    }, 1500);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
      clearTimeout(completionTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-mono text-xs md:text-sm text-zinc-400 p-8 cursor-wait">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex flex-col gap-1 h-[200px] justify-end overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
          {lines.map((line) => (
            <div
              key={line.id}
              className={
                line.id === lines[lines.length - 1]?.id
                  ? "text-white animate-pulse"
                  : "text-zinc-500"
              }
            >
              {line.text}
            </div>
          ))}
        </div>

        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-white transition-all duration-75 ease-out"
            style={{
              transform: `scaleX(${progress / 100})`,
              transformOrigin: "left",
            }}
          />
        </div>

        <div className="flex justify-between text-zinc-600 text-[10px] uppercase tracking-widest">
          <span>Boot Sequence</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default Intro;
