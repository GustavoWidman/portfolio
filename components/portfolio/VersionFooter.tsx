import React from "react";

interface VersionFooterProps {
  className?: string;
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";
const COMMIT_HASH = process.env.NEXT_PUBLIC_COMMIT_HASH ?? "unknown";
const IS_DEV = process.env.NODE_ENV === "development";

const VersionFooter: React.FC<VersionFooterProps> = ({ className = "" }) => {
  const shortHash = COMMIT_HASH.length > 7 ? COMMIT_HASH.slice(0, 7) : COMMIT_HASH;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 py-1 px-3 text-[10px] font-mono text-zinc-400 dark:text-zinc-600 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between z-50 ${className}`}
    >
      <span className="flex items-center gap-2">
        <span>v{APP_VERSION}</span>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        <span className="text-zinc-500 dark:text-zinc-500">{shortHash}</span>
      </span>
      {IS_DEV && (
        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold">
          DEV
        </span>
      )}
    </div>
  );
};

export default React.memo(VersionFooter);
