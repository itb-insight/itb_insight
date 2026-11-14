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
import CompetitionDesktopLayout from "@/features/compe-desktop/CompetitionDesktopLayout";
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi";
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi";
import { getCompetition, getCompetitionSlugs } from "@/features/competition/data";
import { competitionJsonLd, competitionMetadata } from "@/features/competition/seo";
import { countdownFor } from "@/features/competition/status";
import { mobileLayout } from "@/features/competition/mobileLayout";
import CompetitionInfo from "@/features/competition/info/CompetitionInfo";


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

  // Dihitung saat render; ISR menyegarkannya paling lambat tiap jam.
  const countdown = countdownFor(competition);
  // Y tiap blok di kanvas mobile dihitung, bukan koordinat tetap Figma.
  const layout = mobileLayout(competition);

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
      <div className="mobile-shell-root md:hidden">
        <div
          className="mobile-shell-wrapper"
          style={{ "--mobile-shell-height": `${layout.height}px` } as React.CSSProperties}
        >
          <div className="mobile-shell">
            <div className="relative" style={{ height: layout.height }}>
              <PageBackground slug={competition.slug} height={layout.height} layout={layout} />

              <MobileHeader />

              <main>
                <CompetitionHero competition={competition} />
                <CountdownSection
                  target={countdown.target}
                  title={countdown.title}
                  titleY={layout.countdownTitleY}
                  cardY={layout.countdownCardY}
                />
                <RegistrationFee fees={competition.fees} y={layout.feeY} />
                <PrizePool
                  prize={competition.prize}
                  titleY={layout.prizeTitleY}
                  boxY={layout.prizeBoxY}
                />
                <Timeline
                  items={competition.timeline}
                  accentFrom={competition.accentFrom}
                  accentTo={competition.accentTo}
                  titleY={layout.timelineTitleY}
                  textY={layout.timelineTextY}
                  dotX={competition.timelineDotX}
                />
                <ContactRegister competition={competition} y={layout.contactY} />
              </main>
            </div>
          </div>
        </div>

        {/* Detail lomba: alur biasa di bawah kanvas, karena kanvas Figma
            setinggi tetap dan tidak punya ruang untuk bagian baru. */}
        <CompetitionInfo competition={competition} showFees variant="mobile" />

        <FooterHifi />
      </div>

      <div className="hidden md:block">
        <NavbarHifi />
        <CompetitionDesktopLayout competition={competition} countdown={countdown} />
        <FooterHifi />
      </div>
    </>
  );
}
