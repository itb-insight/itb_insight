import { LAYOUT_SLOTS } from "@/features/events/layoutSlots";
import { blendStyle } from "@/features/events/blend";
import { sectionStyle, u } from "@/features/events/scale";
import styles from "@/features/events/EventsBackdrop.module.css";

/**
 * Latar halaman detail /event/[slug], sama dengan latar /event: gradient
 * navy per section, ornamen SVG Figma, dan sambungan berbaur antar section.
 * Isinya slot dari layoutSlots.ts, tanpa foto dan teks.
 *
 * Tinggi halaman detail tidak diketahui di server, jadi slot diulang
 * CYCLES kali lalu dipotong (overflow: hidden) di ujung konten. Di layar
 * sempit kolom slot dibuat minimal MIN_WIDTH lebarnya (lalu dipusatkan),
 * supaya ornamen tidak menyusut jadi kecil sekali seperti kanvas /event di
 * ponsel. 3 putaran x 8 slot cukup untuk halaman terpanjang di 390px.
 *
 * Semua ornamen memakai file SVG yang sama dengan /event, jadi sekali
 * dimuat langsung ter-cache. loading="lazy": slot di luar layar tidak
 * memuat apa pun sampai di-scroll mendekat.
 */
const CYCLES = 3;
const MIN_WIDTH = 1100;

export default function EventsBackdrop() {
  const n = LAYOUT_SLOTS.length;
  const slots = Array.from({ length: n * CYCLES }, (_, i) => LAYOUT_SLOTS[i % n]);

  return (
    <div aria-hidden="true" className={styles.backdrop}>
      <div className={styles.column} style={{ width: `max(100%, ${MIN_WIDTH}px)` }}>
        {slots.map((slot, i) => (
          <div
            key={i}
            style={{
              ...sectionStyle,
              // Slot pertama tiap putaran dirancang menempel di bawah hero
              // /event, jadi saat diulang ia juga dibaurkan ke slot sebelumnya.
              ...blendStyle(i > 0 && (slot.blendWithPrevious || i % n === 0)),
              background: `linear-gradient(180deg, ${slot.bgTop} 0%, ${slot.bgBottom} 100%)`,
            }}
          >
            {slot.layers.map((layer, j) =>
              layer.kind === "decor" ? (
                // SVG vektor: next/image tidak mengoptimalkan SVG, <img> biasa sudah tepat.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={j}
                  src={layer.src}
                  alt=""
                  loading="lazy"
                  style={{
                    position: "absolute",
                    left: u(layer.cx - layer.w / 2),
                    top: u(layer.cy - layer.h / 2),
                    width: u(layer.w),
                    height: u(layer.h),
                    maxWidth: "none",
                  }}
                />
              ) : null,
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
