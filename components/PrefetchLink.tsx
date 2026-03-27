"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, useCallback } from "react";

type LinkProps = ComponentProps<typeof Link>;

export default function PrefetchLink({ href, onMouseEnter, onFocus, ...props }: LinkProps) {
  const router = useRouter();

  const prefetch = useCallback(() => {
    const url = typeof href === "string" ? href : href?.pathname;
    // PrefetchKind.FULL is not in the public types but is stable — it's what
    // <Link prefetch={true}> passes internally. AUTO (the default) only fetches
    // route metadata; FULL fetches the complete RSC payload.
    if (url) (router as any).prefetch(url, { kind: "full" });
  }, [router, href]);

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={(e) => { prefetch(); onMouseEnter?.(e); }}
      onFocus={(e) => { prefetch(); onFocus?.(e); }}
      {...props}
    />
  );
}
