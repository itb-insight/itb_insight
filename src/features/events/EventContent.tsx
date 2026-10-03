import type { EventItem } from "@/features/events/types";
import { u } from "@/features/events/scale";
import EventDateRow from "@/features/events/EventDateRow";
import EventButton from "@/features/events/EventButton";

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

      <EventDateRow event={event} />

      <p
        style={{
          position: "absolute",
          left: u(d.x),
          top: u(d.y),
          width: u(d.w),
          margin: 0,
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

      <EventButton
        box={b}
        href={event.registerUrl}
        label={event.buttonLabel}
        ariaLabel={`${event.buttonLabel} ${event.title.replace(/\n/g, " ")}`}
      />
    </>
  );
}
