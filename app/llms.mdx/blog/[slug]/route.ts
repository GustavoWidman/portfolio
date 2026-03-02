import { getLLMText, getAllLLMSlugs, getBlogEntry } from "@/lib/get-llm-text";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// Cache forever - content is static
export const revalidate = false;

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;

  // Get language from cookie or default to English
  const cookieStore = await cookies();
  const headersList = await headers();

  const langCookie = cookieStore.get("lang")?.value;
  const acceptLanguage = headersList.get("accept-language");

  // Determine language preference
  let lang: "en" | "pt" = "en";
  if (langCookie === "pt" || langCookie === "en") {
    lang = langCookie;
  } else if (acceptLanguage?.includes("pt")) {
    lang = "pt";
  }

  // Try to get the post in the preferred language, fallback to English
  let entry = getBlogEntry(slug, lang);
  if (!entry && lang === "pt") {
    entry = getBlogEntry(slug, "en");
  }

  if (!entry) {
    notFound();
  }

  const markdown = await getLLMText(entry);

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export function generateStaticParams() {
  return getAllLLMSlugs().map((slug) => ({ slug }));
}
