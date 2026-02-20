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
      className={`w-full py-2 px-3 text-[10px] font-mono text-zinc-400 dark:text-zinc-600 flex items-center justify-center gap-2 ${className}`}
    >
      <span>v{APP_VERSION}</span>
      <span className="text-zinc-300 dark:text-zinc-700">|</span>
      <span className="text-zinc-500 dark:text-zinc-500">{shortHash}</span>
      {IS_DEV && (
        <>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold">
            DEV
          </span>
        </>
      )}
    </div>
  );
};

export default React.memo(VersionFooter);
