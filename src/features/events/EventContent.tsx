import type { EventItem } from "@/features/events/types";
import { u } from "@/features/events/scale";
import EventDateRow from "@/features/events/EventDateRow";
import EventButton from "@/features/events/EventButton";
import reveal from "@/features/events/EventReveal.module.css";

/**
 * Blok teks satu event: judul, baris tanggal, deskripsi, tombol.
 *
 * Spesifikasi dari Figma:
 *   judul      EXCRATCH 700 64/80, fill gradient biru di ATAS -> terang di
 *              BAWAH (#acc7ff -> #dee8fb). Diukur dari render Figma: huruf
 *              baris atas #b3ccfe, baris bawah #d5e1f9.
 *   deskripsi  Gabarito 400 20/24, putih, rata kiri-kanan (justify)
 *   tombol     lihat EventButton (termasuk state hover dari Figma)
 *
 * Posisi tiap elemen diambil per event (titleBox, rowBox, descBox,
 * buttonBox), karena judul satu baris membuat seluruh blok turun 36px agar
 * tetap di tengah secara vertikal — persis seperti di Figma.
 *
 * Semua gaya ditulis inline karena globals.css punya aturan h1..h6 dan p
 * tanpa @layer yang mengalahkan utility Tailwind.
 */
export default function EventContent({ event }: { event: EventItem }) {
  const { titleBox: t, descBox: d, buttonBox: b } = event;

  return (
    <>
      <h2
        id={`${event.slug}-title`}
        className={reveal.rise}
        style={{
          position: "absolute",
          left: u(t.x),
          top: u(t.y),
          width: u(t.w),
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: u(64),
          fontWeight: 700,
          lineHeight: u(80),
          whiteSpace: "pre-line",
          backgroundImage: "linear-gradient(180deg, #acc7ff 0%, #dee8fb 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {event.title}
      </h2>

      {/* Baris tanggal, deskripsi, dan tombol mengalir dalam satu kolom. Kalau
          baris tanggal pindah baris (lokasi panjang), sisanya ikut turun dan
          tidak saling menimpa. Jarak 24 dan tinggi minimum 120 / 52 sama
          dengan posisi Figma (row 48 + 24 -> desc 120 + 24 -> tombol 52). */}
      <div
        className={reveal.rise}
        style={{
          position: "absolute",
          left: u(t.x),
          top: u(event.rowBox.y),
          width: u(d.w),
          display: "flex",
          flexDirection: "column",
        }}
      >
        <EventDateRow event={event} />

        <p
          style={{
            margin: `${u(24)} 0 0`,
            minHeight: u(d.h),
            fontFamily: "var(--font-primary)",
            fontSize: u(20),
            fontWeight: 400,
            lineHeight: u(24),
            color: "#ffffff",
            textAlign: "justify",
          }}
        >
          {event.description}
        </p>

        <div style={{ position: "relative", marginTop: u(24), height: u(b.h) }}>
          <EventButton
            box={{ x: 0, y: 0, w: b.w, h: b.h }}
            href={event.buttonHref}
            label={event.buttonLabel}
            ariaLabel={`${event.buttonLabel} ${event.title.replace(/-\n/g, "-").replace(/\n/g, " ")}`}
          />
        </div>
      </div>
    </>
  );
}
