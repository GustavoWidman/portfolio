import { detectLanguage } from "@/lib/language-server";
import { HomeClient } from "@/components/portfolio";

export default async function HomePage() {
  const serverLang = await detectLanguage();
  return <HomeClient lang={serverLang} />;
}
