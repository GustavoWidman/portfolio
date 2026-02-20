"use client";

import { SearchProvider } from "fumadocs-ui/contexts/search";
import SearchDialog from "fumadocs-ui/components/dialog/search-default";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function BlogSearchProvider({
  children,
  lang = "en",
}: {
  children: ReactNode;
  lang?: "en" | "pt";
}) {
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSubdomain(window.location.hostname.startsWith("blog."));
    }
  }, []);

  return (
    <SearchProvider
      SearchDialog={(props) => (
        <SearchDialog
          {...props}
          api={isSubdomain ? "/api/search?subdomain=true" : "/api/search"}
          type="static"
          defaultTag={lang}
        />
      )}
    >
      {children}
    </SearchProvider>
  );
}
