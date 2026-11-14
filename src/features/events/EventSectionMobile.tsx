import Image from "next/image";
import type { EventItem } from "@/features/events/types";
import { DESIGN_HEIGHT, DESIGN_WIDTH } from "@/features/events/scale";
import { blendStyleMobile } from "@/features/events/blend";
import EventButton from "@/features/events/EventButton";
import styles from "@/features/events/EventMobile.module.css";

/**
 * Satu section event untuk layar < 900px: satu kolom, foto di atas.
 *
 *   foto -> judul -> [kalender] [hari] tanggal   [pin] lokasi -> deskripsi -> tombol
 *
 * Yang dipakai ulang dari data desktop: gradient latar (bgTop/bgBottom),
 * ornamen SVG (layers), tanda sambungan (blendWithPrevious), foto, badge, dan
 * tombol. Ornamen aslinya ditempatkan di kanvas 1728 x 1024; di sini kanvas
 * itu diskalakan menutupi tinggi section dan dipusatkan (EventMobile.module.css
 * .decorCanvas), dengan posisi dalam persen supaya ikut skala.
 *
 * Ukuran teks: judul clamp(26px, 8.8vw, 56px), tanggal 19px, deskripsi 17px,
 * tombol 18px. Teks rata kiri (bukan justify seperti desktop: di kolom sempit
 * justify membuat celah antar kata).
 */
function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function EventSectionMobile({
  event,
  className,
}: {
  event: EventItem;
  index: number;
  className?: string;
}) {
  const titleId = `${event.slug}-title-m`;
  const plainTitle = event.title.replace(/-\n/g, "-").replace(/\n/g, " ");

  return (
    <section
      className={`${styles.section} ${className ?? ""}`}
      aria-labelledby={titleId}
      style={{
        ...blendStyleMobile(event.blendWithPrevious),
        background: `linear-gradient(180deg, ${event.bgTop} 0%, ${event.bgBottom} 100%)`,
      }}
    >
      <div aria-hidden="true" className={styles.decor}>
        <div className={styles.decorCanvas}>
          {event.layers.map((layer, i) =>
            layer.kind === "decor" ? (
              // SVG vektor: next/image tidak mengoptimalkan SVG, <img> biasa sudah tepat.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={layer.src}
                alt=""
                loading="lazy"
                style={{
                  position: "absolute",
                  left: `${((layer.cx - layer.w / 2) / DESIGN_WIDTH) * 100}%`,
                  top: `${((layer.cy - layer.h / 2) / DESIGN_HEIGHT) * 100}%`,
                  width: `${(layer.w / DESIGN_WIDTH) * 100}%`,
                  height: `${(layer.h / DESIGN_HEIGHT) * 100}%`,
                  maxWidth: "none",
                }}
              />
            ) : null,
          )}
        </div>
      </div>

      <div className={styles.inner}>
        <div className={styles.photo}>
          <Image
            src={event.photo.src}
            alt={event.photo.alt}
            fill
            sizes="(max-width: 899px) 100vw, 1px"
            style={{ objectFit: "cover", objectPosition: event.photo.position ?? "50% 50%" }}
          />
        </div>

        <h2 id={titleId} className={styles.title}>
          {event.title}
        </h2>

        <div className={styles.row}>
          <div className={styles.rowGroup}>
            {/* SVG: <img> biasa sudah tepat */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/events/icon-date.svg" alt="" aria-hidden="true" className={styles.icon} />
            <span
              className={styles.badge}
              style={{ background: hexToRgba(event.badgeColor, event.badgeOpacity) }}
            >
              <span className={styles.badgeText}>{event.day}</span>
            </span>
            {event.date ? (
              <time dateTime={event.date} className={styles.rowText}>
                {event.dateLabel}
              </time>
            ) : (
              <span className={styles.rowText}>{event.dateLabel}</span>
            )}
          </div>
          <div className={styles.rowGroup}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/events/icon-pin.svg" alt="" aria-hidden="true" className={styles.icon} />
            <span className={styles.rowText}>{event.location}</span>
          </div>
        </div>

        <p className={styles.desc}>{event.description}</p>

        <EventButton
          flow
          href={event.buttonHref}
          label={event.buttonLabel}
          ariaLabel={`${event.buttonLabel} ${plainTitle}`}
        />
      </div>
    </section>
  );
}
