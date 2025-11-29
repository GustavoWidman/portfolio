import { Download } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface ResumeButtonProps {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  position?: "top" | "bottom";
  className?: string;
}

const ResumeButton: React.FC<ResumeButtonProps> = ({
  children,
  align = "right",
  position = "bottom",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDownload = (lang: "en" | "pt") => {
    const url = lang === "pt" ? "/resume-pt.pdf" : "/resume-en.pdf";
    window.open(url, "_blank");
    setIsOpen(false);
  };

  const alignClass =
    align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

  const positionClass = position === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="cursor-pointer w-full h-full block text-left"
      >
        {children}
      </button>

      {isOpen && (
        <div
          className={`absolute ${positionClass} ${alignClass} w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 z-50 animate-fade-in`}
          style={{ transform: "translateZ(0)" }}
        >
          <div className="px-3 py-2 text-[10px] font-mono uppercase text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/50 mb-1">
            Select Language
          </div>

          <button
            type="button"
            onClick={() => handleDownload("en")}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between group transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="font-bold">EN</span> English
            </span>
            <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            type="button"
            onClick={() => handleDownload("pt")}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-between group transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="font-bold">PT</span> Português (BR)
            </span>
            <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeButton;
