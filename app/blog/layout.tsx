import type { ReactNode } from "react";
import { detectLanguage } from "@/lib/language-server";
import BlogLayoutClient from "@/components/blog/BlogLayoutClient";

interface BlogLayoutProps {
  children: ReactNode;
}

export default async function BlogLayout({ children }: BlogLayoutProps) {
  const serverLang = await detectLanguage();
  return <BlogLayoutClient serverLang={serverLang}>{children}</BlogLayoutClient>;
}
