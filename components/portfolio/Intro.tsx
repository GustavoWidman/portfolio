"use client";

import { useEffect, useState } from "react";

interface IntroLine {
  id: number;
  text: string;
}

interface IntroProps {
  onComplete: () => void;
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

const Intro = ({ onComplete }: IntroProps) => {
  const [lines, setLines] = useState<IntroLine[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentLine = 0;

    // Type out lines - optimized array operation
    const textInterval = setInterval(() => {
      setLines((prev) => {
        const index = prev.length;
        if (index >= bootText.length) {
          clearInterval(textInterval);
          return prev;
        }
        return [...prev, { id: index, text: bootText[index] }];
      });
    }, 150);

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 800); // Wait a bit after 100% before finishing
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center font-mono text-xs md:text-sm text-zinc-400 p-8 cursor-wait">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex flex-col gap-1 min-h-[200px] justify-end">
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
