import type { EventItem } from "@/features/events/types";
import { u, sectionStyle, DESIGN_WIDTH, DESIGN_HEIGHT } from "@/features/events/scale";
import EventPhoto from "@/features/events/EventPhoto";
import EventContent from "@/features/events/EventContent";

/**
 * Satu section event, 1728 x 1024 desain.
 *
 * Latar: gradient vertikal bgTop -> bgBottom. Event ganjil gelap di atas,
 * event genap kebalikannya (terang di atas) — ini dibaca dari data Figma
 * tiap frame, bukan disamaratakan.
 *
 * Lapisan dirender PERSIS mengikuti urutan Figma (event.layers). Ornamen
 * adalah SVG hasil export Figma sendiri, jadi gradient, blur, rotasi, dan
 * tekstur grain-nya sudah benar. Kanvas SVG lebih besar daripada bentuknya
 * karena memuat margin blur, maka SVG dipusatkan pada titik tengah bentuk.
 *
 * Komposit lapisan ini sudah dibandingkan piksel demi piksel dengan render
 * Figma untuk ketujuh frame: selisih rata-rata 1.5 - 2.3 dari 255.
 *
 * SAMBUNGAN ANTAR SECTION
 * Frame-frame di Figma dirancang untuk ditumpuk, tapi hanya 2 dari 6
 * sambungannya yang benar-benar menyambung. Hasil ukur di render Figma
 * (selisih baris terbawah frame atas vs baris teratas frame bawah):
 *   Insight Festival  -> Exhibition Manager    0.9   nyambung
 *   Exhibition Manager -> Play-Tech           14.2   putus
 *   Play-Tech          -> Show-Tech           17.0   putus
 *   Show-Tech          -> Insight on Stage    17.5   putus
 *   Insight on Stage   -> Inspirates           1.8   nyambung
 *   Inspirates         -> Alumni Gathering    13.5   putus
 * (pembanding: dua baris bersebelahan di dalam satu frame ~0.6)
 *
 * Section yang tepi atasnya putus (blendWithPrevious) ditumpuk BLEND_HEIGHT
 * piksel desain ke atas section sebelumnya, dan bagian atasnya diberi masker
 * transparan -> penuh, sehingga kedua tepi berbaur.
 *
 * Masker memakai kurva smoothstep (landai di kedua ujung), bukan garis lurus.
 * Peralihan linear meninggalkan "tepi" yang masih terlihat di titik awal dan
 * akhir pita; smoothstep menghilangkannya.
 *
 * Batas aman konten untuk BLEND_HEIGHT = 240:
 *   - teks paling atas section ini mulai di y=286        (> 240)
 *   - konten paling bawah section sebelumnya di y=752    (< 1024 - 240)
 * Jangan naikkan melewati ~270 tanpa memeriksa ulang batas ini.
 */
const BLEND_HEIGHT = 240;

function smoothMask(heightPercent: number): string {
  const stops: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const alpha = t * t * (3 - 2 * t); // smoothstep
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(t * heightPercent).toFixed(3)}%`);
  }
  return `linear-gradient(180deg, ${stops.join(", ")})`;
}

export default function EventSection({ event, index }: { event: EventItem; index: number }) {
  // Margin persen dihitung dari LEBAR container, jadi 240/1728 lebar = 240px desain.
  // Masker persen dihitung dari TINGGI section, jadi 240/1024.
  const mask = smoothMask((BLEND_HEIGHT / DESIGN_HEIGHT) * 100);
  const blend = event.blendWithPrevious
    ? {
        marginTop: `${(-(BLEND_HEIGHT / DESIGN_WIDTH) * 100).toFixed(4)}%`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }
    : null;

  return (
    <section
      id={event.slug}
      aria-labelledby={`${event.slug}-title`}
      style={{
        ...sectionStyle,
        ...blend,
        background: `linear-gradient(180deg, ${event.bgTop} 0%, ${event.bgBottom} 100%)`,
      }}
    >
      {event.layers.map((layer, i) => {
        if (layer.kind === "decor") {
          return (
            // SVG vektor: next/image tidak mengoptimalkan SVG, jadi <img> biasa
            // adalah pilihan yang tepat di sini.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={layer.src}
              alt=""
              aria-hidden="true"
              // Ornamen di luar layar pertama tidak perlu dimuat duluan.
              loading={index === 0 ? "eager" : "lazy"}
              style={{
                position: "absolute",
                left: u(layer.cx - layer.w / 2),
                top: u(layer.cy - layer.h / 2),
                width: u(layer.w),
                height: u(layer.h),
                maxWidth: "none",
                pointerEvents: "none",
              }}
            />
          );
        }
        if (layer.kind === "photo") return <EventPhoto key={i} event={event} />;
        return <EventContent key={i} event={event} />;
      })}
    </section>
  );
}
