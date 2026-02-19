import { detectLanguage, shouldSkipIntro } from "@/lib/language-server";
import { HomeClient } from "@/components/portfolio";

interface HomePageProps {
  searchParams: Promise<{ lang?: string; intro?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const [serverLang, skipIntro] = await Promise.all([
    detectLanguage(),
    shouldSkipIntro(params.intro),
  ]);
  
  return <HomeClient lang={serverLang} skipIntro={skipIntro} />;
}
