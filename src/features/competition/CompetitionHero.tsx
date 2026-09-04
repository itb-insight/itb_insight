import Image from "next/image";
import type { Competition } from "@/features/competition/types";

/**
 * Hero halaman kompetisi.
 *
 * SEMUANYA DIPOSISIKAN ABSOLUT pada koordinat Y dari Figma, karena posisi
 * ikon dan judul BERBEDA TIAP LOMBA (ikon: SAR 217, MO 221, BPC 214, OE 307).
 * Layout mengalir tidak akan pernah pas untuk keempatnya sekaligus.
 *
 * Nilai tetap untuk semua lomba:
 *   judul     x=33  lebar 328   Gabarito 400 28/34 center
 *   deskripsi x=35  lebar 324   Gabarito 400 12/18 center, SOLID #e6f4ff
 *   tombol    y=645 (teks y=654, tinggi kotak 32), Silabus 77x32,
 *             Guidebook 97x32, jarak 12, keduanya fill gradient
 *             #dee8fb -> #acc7ff dengan teks #1b3b7d
 *   ikon      dipusatkan horizontal
 *
 * Judul memakai gradient yang BERBEDA TIAP LOMBA (titleFrom/titleTo),
 * mengikuti warna ikonnya.
 *
 * KENAPA SEMUA PAKAI INLINE STYLE, BUKAN CLASS TAILWIND:
 * src/app/globals.css punya aturan global TANPA @layer —
 *   *, *::before, *::after { margin: 0; padding: 0 }
 *   h1..h6 { font-family; font-weight: 700; line-height: 1.2 }
 *   h1     { font-size: clamp(2rem, 5vw, 4rem) }
 *   p      { color; font-size: 1rem }
 *   img    { max-width: 100% }
 * CSS tanpa layer SELALU menang atas utility Tailwind (yang berada di
 * @layer utilities), berapa pun specificity-nya. Jadi pt-[100px], mt-[28px],
 * text-[28px], dan max-w-none semuanya kalah. Inline style menang atas
 * keduanya, dan tidak perlu mengubah globals.css milik tim.
 */
const BUTTON_Y = 645;

export default function CompetitionHero({ competition }: { competition: Competition }) {
  const titleGradient = `linear-gradient(180deg, ${competition.titleFrom} 0%, ${competition.titleTo} 100%)`;

  return (
    <>
      <Image
        src={competition.iconSrc}
        alt={`Logo ${competition.title}`}
        width={competition.iconWidth}
        height={competition.iconHeight}
        priority
        style={{
          position: "absolute",
          zIndex: 10,
          top: competition.heroIconY,
          left: (393 - competition.iconWidth) / 2,
          width: competition.iconWidth,
          height: competition.iconHeight,
          maxWidth: "none",
        }}
      />

      <h1
        style={{
          position: "absolute",
          zIndex: 10,
          top: competition.heroTitleY,
          left: 33,
          width: 328,
          textAlign: "center",
          fontFamily: "var(--font-primary)",
          fontSize: 28,
          fontWeight: 400,
          lineHeight: "34px",
          backgroundImage: titleGradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {competition.title}
      </h1>

      <p
        style={{
          position: "absolute",
          zIndex: 10,
          top: competition.heroDescY,
          left: 35,
          width: 324,
          textAlign: "center",
          fontFamily: "var(--font-primary)",
          fontSize: 12,
          fontWeight: 400,
          lineHeight: "18px",
          color: "#e6f4ff",
        }}
      >
        {competition.description}
      </p>

      <div
        style={{
          position: "absolute",
          zIndex: 10,
          top: BUTTON_Y,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <a
          href={competition.syllabusUrl}
          className="btn-solid"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 77,
            height: 32,
            fontFamily: "var(--font-primary)",
            fontSize: 12,
            lineHeight: "14px",
          }}
        >
          Silabus
        </a>
        <a
          href={competition.guidebookUrl}
          className="btn-solid"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 97,
            height: 32,
            fontFamily: "var(--font-primary)",
            fontSize: 12,
            lineHeight: "14px",
          }}
        >
          Guidebook
        </a>
      </div>
    </>
  );
}
