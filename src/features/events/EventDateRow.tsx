import type { EventItem } from "@/features/events/types";
import { u } from "@/features/events/scale";

/**
 * Baris tanggal & lokasi: [ikon kalender] [badge hari] tanggal   [pin] lokasi
 *
 * Posisi tiap elemen relatif terhadap kiri-atas baris (dari Figma, sama di
 * ketujuh event):
 *   ikon kalender   +0     48x48
 *   badge hari      +64    87x48, radius 6
 *   tanggal         +166,  +7
 *   ikon pin        +419   48x48
 *   lokasi          +471,  +7
 * Teks: Gabarito 400 28/34, putih.
 *
 * Badge terdiri dari dua lapis seperti di Figma:
 *   1. warna khas event (badgeColor) pada opacity 73%
 *   2. lapisan kaca #d9d9d9 opacity 20% dengan efek GLASS
 *
 * Efek GLASS Figma tidak membawa parameter apa pun lewat API. Nilainya
 * dicari secara numerik: warna badge di render Figma ketujuh event
 * dicocokkan dengan hasil tumpukan dua lapis di atas. Paling pas ketika
 * lapisan kaca = rgba(237, 237, 237, 0.2) — opacity tetap 20% seperti Figma,
 * GLASS-nya setara dengan mencerahkan abu-abu #d9d9d9 menjadi #ededed.
 * Selisih rata-rata terhadap Figma: 0.47 dari 255.
 */
const textStyle = {
  position: "absolute",
  fontFamily: "var(--font-primary)",
  fontSize: u(28),
  fontWeight: 400,
  lineHeight: u(34),
  color: "#ffffff",
  whiteSpace: "nowrap",
} as const;

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function EventDateRow({ event }: { event: EventItem }) {
  const { x, y } = event.rowBox;

  return (
    <>
      {/* ikon kalender */}
      {/* SVG: next/image tidak mengoptimalkan SVG, <img> biasa sudah tepat */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/events/icon-date.svg"
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", left: u(x), top: u(y), width: u(48), height: u(48), maxWidth: "none" }}
      />

      {/* badge hari: warna event + lapisan kaca */}
      <span
        style={{
          position: "absolute",
          left: u(x + 64),
          top: u(y),
          width: u(87),
          height: u(48),
          borderRadius: u(6),
          overflow: "hidden",
          background: hexToRgba(event.badgeColor, event.badgeOpacity),
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(237, 237, 237, 0.2)",
          }}
        />
        <span
          style={{
            ...textStyle,
            left: 0,
            right: 0,
            top: u(6),
            textAlign: "center",
          }}
        >
          {event.day}
        </span>
      </span>

      {/* tanggal */}
      <time dateTime={event.date} style={{ ...textStyle, left: u(x + 166), top: u(y + 7) }}>
        {event.dateLabel}
      </time>

      {/* ikon pin */}
      {/* SVG: next/image tidak mengoptimalkan SVG, <img> biasa sudah tepat */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/events/icon-pin.svg"
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", left: u(x + 419), top: u(y), width: u(48), height: u(48), maxWidth: "none" }}
      />

      {/* lokasi */}
      <span style={{ ...textStyle, left: u(x + 471), top: u(y + 7) }}>{event.location}</span>
    </>
  );
}
