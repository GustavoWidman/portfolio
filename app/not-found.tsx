import { detectLanguage } from "@/lib/language-server";
import NotFoundClient from "@/components/shared/NotFoundClient";

export default async function NotFound() {
  const lang = await detectLanguage();
  return <NotFoundClient lang={lang} />;
}
