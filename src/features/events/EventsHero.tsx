import Image from "next/image";
import { u, sectionStyle } from "@/features/events/scale";

/**
 * Hero "EVENTS." — Figma frame "Desktop - 12", 1728 x 1024.
 *
 * Lapisan (bawah ke atas), sama seperti di Figma:
 *   1. latar gradient #091b3f -> #294d97
 *   2. tirai (HERO_CURTAIN, 1728 x 556) — lihat catatan di bawah
 *   3. teks "EVENTS." EXCRATCH 700 250/238.75, #dee8fb
 *   4. panel terang di y=556, gradient #dee8fb -> #acc7ff, yang MENUTUP
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

export default function EventsHero() {
  return (
    <section
      aria-labelledby="events-hero-title"
      style={{
        ...sectionStyle,
        background: "linear-gradient(180deg, #091b3f 0%, #294d97 100%)",
      }}
    >
      {/* Gambar terbesar di layar pertama (LCP), jadi dimuat paling awal.
          Next 16 menandai prop `priority` sebagai deprecated; dokumentasinya
          menyarankan loading="eager" + fetchPriority="high". */}
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: u(556) }}>
        <Image
          src={HERO_CURTAIN}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
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
          top: u(556),
          width: u(1733),
          height: u(468),
          background: "linear-gradient(180deg, #dee8fb 0%, #acc7ff 100%)",
        }}
      />
    </section>
  );
}
