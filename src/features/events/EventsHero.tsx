import Image from "next/image";
import { DESIGN_WIDTH, u, sectionStyle } from "@/features/events/scale";
import EventsHeroCollage from "@/features/events/EventsHeroCollage";

/**
 * Hero "EVENTS." — Figma frame "Desktop - 12", 1728 x 1024.
 *
 * Lapisan (bawah ke atas), sama seperti di Figma:
 *   1. latar gradient #091b3f -> #294d97
 *   2. kolase foto dokumentasi (EventsHeroCollage), tertutup tirai
 *   3. tirai (HERO_CURTAIN, 1728 x 556), semi-transparan
 *      (HERO_CURTAIN_OPACITY) — lihat catatan di bawah
 *   4. teks "EVENTS." EXCRATCH 700 250/238.75, #dee8fb
 *   5. panel terang di y=556 (tebal HERO_PANEL_HEIGHT), gradient #dee8fb -> #acc7ff, yang MENUTUP
 *      bagian bawah huruf — karena itu hurufnya tampak terpotong rata
 *
 * Teks tetap teks asli (bukan bagian dari gambar) supaya terbaca mesin
 * pencari dan pembaca layar.
 *
 * TENTANG GAMBAR TIRAI
 * Di Figma, tirai = sorot lampu berbentuk segitiga yang di-blur oleh 39 strip
 * vertikal dengan efek BACKGROUND_BLUR 180. Efek itu tidak bisa diekspor
 * lewat API (kalau strip dirender sendirian, tidak ada apa-apa di belakangnya
 * untuk di-blur), dan tidak bisa ditiru persis dengan CSS backdrop-filter
 * karena cara Figma menangani tepi tiap strip berbeda.
 *
 * Maka gambar ini disusun dari render Figma frame tersebut. Hanya area tepat
 * di bawah huruf "EVENTS." — yang di render Figma tertimpa huruf — diisi
 * ulang dengan emulasi blur, lalu dikunci ke warna asli Figma di batasnya
 * (loncatan warna di sambungan rata-rata 0.17 dari 255). Area itu tertutup
 * huruf HTML, jadi praktis yang terlihat adalah piksel asli Figma.
 */
export const HERO_CURTAIN = "/events/hero-curtain.webp";

/**
 * >>> ATUR TRANSPARANSI DI SINI <<<
 * Opacity tirai biru di atas kolase foto (EventsHeroCollage), dipakai desktop
 * dan mobile. 1 = tirai penuh (foto tidak terlihat), 0 = foto saja.
 */
export const HERO_CURTAIN_OPACITY = 0.6;

/**
 * >>> ATUR TEBAL PANEL TERANG DI BAWAH "EVENTS." DI SINI <<<
 * Dalam piksel desain (kanvas lebar 1728). Figma aslinya 468. Mobile memakai
 * angka yang sama, diskalakan ke lebar layar (EventsHeroMobile).
 */
export const HERO_PANEL_HEIGHT = 140;

/** Tinggi tirai / kolase (piksel desain, dari Figma). */
const CURTAIN_HEIGHT = 556;

export default function EventsHero({ className }: { className?: string }) {
  return (
    <section
      className={className}
      aria-labelledby="events-hero-title"
      style={{
        ...sectionStyle,
        aspectRatio: `${DESIGN_WIDTH} / ${CURTAIN_HEIGHT + HERO_PANEL_HEIGHT}`,
        background: "linear-gradient(180deg, #091b3f 0%, #294d97 100%)",
      }}
    >
      {/* Gambar terbesar di layar pertama (LCP), jadi dimuat paling awal.
          Next 16 menandai prop `priority` sebagai deprecated; dokumentasinya
          menyarankan loading="eager" + fetchPriority="high". */}
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: u(CURTAIN_HEIGHT) }}>
        <EventsHeroCollage />
        <Image
          src={HERO_CURTAIN}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          style={{ opacity: HERO_CURTAIN_OPACITY }}
        />
      </div>

      <h1
        id="events-hero-title"
        style={{
          position: "absolute",
          left: u(126),
          top: u(367),
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: u(250),
          fontWeight: 700,
          lineHeight: u(238.75),
          color: "#dee8fb",
          whiteSpace: "nowrap",
        }}
      >
        EVENTS.
      </h1>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: u(-5),
          top: u(CURTAIN_HEIGHT),
          width: u(1733),
          height: u(HERO_PANEL_HEIGHT),
          background: "linear-gradient(180deg, #dee8fb 0%, #acc7ff 100%)",
        }}
      />
    </section>
  );
}
