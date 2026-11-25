import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "@/features/events/EventsHeroCollage.module.css";

/**
 * Kolase foto dokumentasi di belakang tirai biru hero "EVENTS."
 * (EventsHero + EventsHeroMobile).
 *
 * Dua baris, masing-masing setinggi separuh kotak. Tiap foto tampil dengan
 * rasio aslinya (w / h), jadi lebarnya berbeda-beda: lanskap, 16:9, dan
 * potret dicampur supaya sambungan antar foto di baris atas dan bawah tidak
 * segaris. Baris bawah juga digeser ke kiri (EventsHeroCollage.module.css).
 *
 * Tiap baris berisi foto lebih banyak dari yang muat; sisanya terpotong di
 * kanan (overflow: hidden), jadi tidak ada ruang kosong di lebar layar mana
 * pun. Ganti / tambah foto cukup di daftar ini (w dan h = ukuran file asli).
 *
 * Tingkat transparansi tirai di atas kolase: HERO_CURTAIN_OPACITY di
 * EventsHero.tsx.
 */
type Photo = { src: string; w: number; h: number };

const ROWS: Photo[][] = [
  [
    { src: "/events/tech-xhibition/hero.webp", w: 1994, h: 1332 },
    { src: "/events/insight-on-stage/hero.webp", w: 2400, h: 1600 },
    { src: "/events/inspirates/highlight-1.webp", w: 1600, h: 2400 },
    { src: "/events/technology-seminar/hero.webp", w: 2400, h: 1350 },
    { src: "/events/playtech-showtech/hero.webp", w: 2400, h: 1600 },
    { src: "/events/inspirates/hero.webp", w: 2400, h: 1600 },
    { src: "/events/tech-xhibition/gallery-2.webp", w: 2400, h: 1600 },
  ],
  [
    { src: "/events/playtech-showtech/gallery-1.webp", w: 2400, h: 1600 },
    { src: "/events/technology-seminar/gallery-5.webp", w: 2336, h: 1306 },
    { src: "/events/inspirates/gallery-1.webp", w: 2400, h: 1600 },
    { src: "/events/insight-on-stage/gallery-2.webp", w: 2400, h: 1600 },
    { src: "/events/inspirates/highlight-3.webp", w: 1600, h: 2400 },
    { src: "/events/tech-xhibition/gallery-4.webp", w: 2400, h: 1600 },
    { src: "/events/playtech-showtech/gallery-4.webp", w: 2400, h: 1600 },
  ],
];

export default function EventsHeroCollage() {
  return (
    <div aria-hidden="true" className={styles.collage}>
      {ROWS.map((row, r) => (
        <div key={r} className={styles.row}>
          {row.map(({ src, w, h }) => (
            <div key={src} className={styles.tile} style={{ "--ratio": w / h } as CSSProperties}>
              <Image
                src={src}
                alt=""
                fill
                // tinggi baris ~16% (desktop) / ~26% (mobile) lebar layar
                sizes="(max-width: 899px) 40vw, 25vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
