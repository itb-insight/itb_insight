import type { ComponentType } from "react";
import CompeDetail1 from "@/features/compe-desktop/CompeDetail1";
import CompeDetail2 from "@/features/compe-desktop/CompeDetail2";
import CompeDetail3 from "@/features/compe-desktop/CompeDetail3";
import CompeDetail4 from "@/features/compe-desktop/CompeDetail4";

/**
 * Menghubungkan slug kompetisi ke layout desktop-nya.
 *
 * Sementara ini keempat layout desktop masih menyimpan datanya sendiri di
 * dalam file masing-masing, sedangkan versi mobile membacanya dari
 * features/competition/data.ts. Peta di bawah yang menjembatani keduanya
 * supaya satu route /competition/[slug] bisa melayani dua-duanya.
 *
 * Langkah berikutnya: gabungkan keempat file itu jadi satu komponen yang
 * menerima objek Competition, lalu peta ini tidak diperlukan lagi.
 */
const DESKTOP_BY_SLUG: Record<string, ComponentType> = {
  "safety-and-rescue-robot-competition": CompeDetail1,
  "microdrone-obstacle-race": CompeDetail2,
  "business-plan-competition": CompeDetail3,
  "olimpiade-engineering": CompeDetail4,
};

export default function CompetitionDesktop({ slug }: { slug: string }) {
  const Detail = DESKTOP_BY_SLUG[slug];
  if (!Detail) return null;
  return <Detail />;
}
