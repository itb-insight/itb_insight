import type { EventItem } from "@/features/events/types";
import { u, sectionStyle } from "@/features/events/scale";
import { blendStyle } from "@/features/events/blend";
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
 * Sambungan antar section (blendWithPrevious, BLEND_HEIGHT, masker
 * smoothstep) dijelaskan di blend.ts. Logika yang sama dipakai latar
 * halaman detail (EventsBackdrop.tsx).
 */
export default function EventSection({ event, index }: { event: EventItem; index: number }) {
  const blend = blendStyle(event.blendWithPrevious);

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
