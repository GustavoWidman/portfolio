"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { normalizeToTimezoneMidnight } from "@/lib/helpers";

interface ScheduledPostCardProps {
  title: string;
  date: string | Date;
  tags: string[];
  lang: "en" | "pt";
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdown(targetDate: Date): TimeRemaining {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate),
  );
  const targetDateRef = useRef(targetDate);

  useEffect(() => {
    targetDateRef.current = targetDate;
    const update = () => setTimeRemaining(calculateTimeRemaining(targetDateRef.current));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeRemaining;
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  if (typeof window === "undefined") {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl md:text-3xl font-bold text-zinc-700 dark:text-zinc-300 font-mono tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        {label}
      </span>
    </div>
  );
}

export default function ScheduledPostCard({ title, date, tags, lang }: ScheduledPostCardProps) {
  const targetDate = useMemo(() => normalizeToTimezoneMidnight(date), [date]);
  const countdown = useCountdown(targetDate);

  const labels =
    lang === "en"
      ? { days: "Days", hours: "Hrs", minutes: "Min", seconds: "Sec", comingSoon: "Coming Soon" }
      : { days: "Dias", hours: "Hrs", minutes: "Min", seconds: "Seg", comingSoon: "Em Breve" };

  return (
    <div className="group relative flex flex-col p-6 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-transparent dark:from-emerald-900/10" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
            {labels.comingSoon}
          </span>
        </div>

        <h2 className="text-xl font-bold mb-4 text-zinc-800 dark:text-white">{title}</h2>

        <div className="flex justify-center gap-3 md:gap-4 mb-4 py-4 border-y border-zinc-200 dark:border-zinc-800">
          <CountdownUnit value={countdown.days} label={labels.days} />
          <span className="text-2xl text-zinc-400 font-bold">:</span>
          <CountdownUnit value={countdown.hours} label={labels.hours} />
          <span className="text-2xl text-zinc-400 font-bold">:</span>
          <CountdownUnit value={countdown.minutes} label={labels.minutes} />
          <span className="text-2xl text-zinc-400 font-bold">:</span>
          <CountdownUnit value={countdown.seconds} label={labels.seconds} />
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-[10px] uppercase tracking-wider font-medium rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
