import { NEURON_PLACEMENTS } from "@/features/competition/ornaments";
import {
  BACKGROUND_LAYERS,
  BLOB_LAYERS,
  BLOB_OFFSET_Y,
} from "@/features/competition/background";
import type { MobileLayout } from "@/features/competition/mobileLayout";

/**
 * Latar halaman kompetisi. Empat lapis, dari bawah ke atas:
 *
 *  1. Gradient dasar + dua overlay beropacity 50% (lihat background.ts).
 *  2. Neuron — pola heksagon, satu gambar yang sama diulang 14 kali dengan
 *     ukuran, rotasi, dan opacity dari Figma.
 *  3. Blob — tiga bentuk besar ber-blur.
 *
 * URUTAN NEURON DI BAWAH BLOB ITU DISENGAJA. Di Figma, "Group 732" (blob)
 * berada di atas frame-frame yang memuat neuron besar, sehingga blob yang
 * blur dan semi-transparan itu menyamarkan pola neuron. Kalau neuron dicat
 * paling akhir, polanya jadi jauh lebih tegas daripada desain.
 */
export default function PageBackground({
  slug,
  height,
  layout,
}: {
  slug: string;
  height: number;
  /**
   * Tata letak hasil hitung (mobileLayout.ts). Gradient diskalakan ke
   * tinggi kanvas baru; neuron dan blob dipindah lewat layout.warp() agar
   * tetap dekat dengan blok yang tadinya ada di depannya.
   */
  layout: MobileLayout;
}) {
  const neurons = NEURON_PLACEMENTS[slug] ?? [];
  const blobShiftY = BLOB_OFFSET_Y[slug] ?? 0;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* 1. Gradient dasar dan dua overlay */}
      {BACKGROUND_LAYERS.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: l.top * layout.scale,
            height: l.height * layout.scale,
            opacity: l.opacity,
            background: `linear-gradient(180deg, ${l.from} 0%, ${l.to} 100%)`,
          }}
        />
      ))}

      {/* 2. Neuron */}
      {neurons.map((n, i) => (
        <img
          key={i}
          src="/deco/neuron.png"
          alt=""
          style={{
            // globals.css punya "img { max-width: 100% }" tanpa @layer, yang
            // mengalahkan utility Tailwind. Tanpa maxWidth di sini, ornamen
            // yang lebih lebar dari frame dipaksa mengecil dan posisinya
            // meleset jauh dari desain.
            maxWidth: "none",
            position: "absolute",
            left: n.x,
            // Pusat neuron dipetakan, lalu dikembalikan ke sudut kiri-atas.
            top: layout.warp(n.y + n.h / 2) - n.h / 2,
            width: n.w,
            height: n.h,
            opacity: n.o,
            // Figma memakai scaleMode "FILL": gambar DIPOTONG untuk menutupi
            // kotak dengan rasio terjaga, bukan direntangkan.
            objectFit: "cover",
            transform: n.r ? `rotate(${n.r}deg)` : undefined,
          }}
        />
      ))}

      {/* 3. Blob — ukuran SVG apa adanya, dipusatkan pada titik tengah bentuk.
             Opacity dan blur sudah ada di dalam SVG, jangan ditambah lagi. */}
      {BLOB_LAYERS.map((b, i) => (
        <img
          key={i}
          src={b.src}
          alt=""
          width={b.w}
          height={b.h}
          style={{
            maxWidth: "none",
            position: "absolute",
            width: b.w,
            height: b.h,
            left: b.cx - b.w / 2,
            top: layout.warp(b.cy + blobShiftY) - b.h / 2,
          }}
        />
      ))}

      {/* 4. Pudar ke warna awal bagian Detail Lomba (#294d97, lihat
             CompetitionInfo.module.css .mobile). Tanpa ini ada garis lurus
             di sambungan kanvas dan bagian di bawahnya, karena blob dan
             neuron mewarnai dasar kanvas sedikit berbeda. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 240,
          background: "linear-gradient(180deg, rgba(41, 77, 151, 0) 0%, #294d97 100%)",
        }}
      />
    </div>
  );
}
