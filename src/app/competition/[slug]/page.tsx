import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MobileHeader from "@/features/competition/MobileHeader";
import PageBackground from "@/features/competition/PageBackground";
import CompetitionHero from "@/features/competition/CompetitionHero";
import CountdownSection from "@/features/competition/CountdownSection";
import RegistrationFee from "@/features/competition/RegistrationFee";
import PrizePool from "@/features/competition/PrizePool";
import Timeline from "@/features/competition/Timeline";
import ContactRegister from "@/features/competition/ContactRegister";
import { getCompetition, getCompetitionSlugs } from "@/features/competition/data";
import { competitionJsonLd, competitionMetadata } from "@/features/competition/seo";

/** Tinggi kanvas frame Figma (iPhone SAR/MO/BPC/OE Mobile). */
const CANVAS_HEIGHT = 3284;

/** ISR: HTML dibangun saat build, lalu di-refresh tiap 1 jam. */
export const revalidate = 3600;
export const dynamicParams = true;

/** SSG: semua halaman lomba dipre-render → TTFB cepat & ramah crawler. */
export async function generateStaticParams() {
  const slugs = await getCompetitionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getCompetition(slug);
  if (!competition) return { title: "Kompetisi tidak ditemukan" };
  return competitionMetadata(competition);
}

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const competition = await getCompetition(slug);
  if (!competition) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(competitionJsonLd(competition)),
        }}
      />

      {/*
        Desain ini kanvas tetap 393 x 3284 dengan tiap elemen diposisikan
        absolut pada koordinat Y yang sama persis dengan Figma. Karena itu
        posisinya cocok tanpa perlu tebak-tebakan margin.
      */}
      <div className="mobile-shell">
        <div className="relative" style={{ height: CANVAS_HEIGHT }}>
        <PageBackground slug={competition.slug} height={CANVAS_HEIGHT} />

        <MobileHeader />

        <main>
          <CompetitionHero competition={competition} />
          <CountdownSection deadline={competition.registrationDeadline} />
          <RegistrationFee fee={competition.registrationFee} />
          <PrizePool amount={competition.prizePool} />
          <Timeline
            items={competition.timeline}
            accentFrom={competition.accentFrom}
            accentTo={competition.accentTo}
            titleY={competition.timelineTitleY}
            textY={competition.timelineTextY}
            dotX={competition.timelineDotX}
          />
          <ContactRegister competition={competition} />
          </main>
        </div>
      </div>
    </>
  );
}
