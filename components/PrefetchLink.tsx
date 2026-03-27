"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, useCallback } from "react";

type LinkProps = ComponentProps<typeof Link>;

export default function PrefetchLink({ href, onMouseEnter, onFocus, ...props }: LinkProps) {
  const router = useRouter();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const url = typeof href === "string" ? href : href?.pathname;
      if (url) router.prefetch(url);
      onMouseEnter?.(e);
    },
    [router, href, onMouseEnter],
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      const url = typeof href === "string" ? href : href?.pathname;
      if (url) router.prefetch(url);
      onFocus?.(e);
    },
    [router, href, onFocus],
  );

  return (
    <Link href={href} prefetch={false} onMouseEnter={handleMouseEnter} onFocus={handleFocus} {...props} />
  );
}
