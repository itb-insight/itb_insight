import CompePage1 from "@/features/compe-page1/CompePage1";
import { getCompetitionFaq } from "@/features/competition/faq";

export default async function HomePage() {
  const faqs = await getCompetitionFaq();
  return <CompePage1 faqs={faqs} />;
}
