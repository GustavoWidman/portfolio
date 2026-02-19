import { detectLanguage } from "@/lib/language-server";
import NotFoundClient from "@/components/shared/NotFoundClient";

export default async function NotFound() {
  const serverLang = await detectLanguage();
  return <NotFoundClient serverLang={serverLang} />;
}
