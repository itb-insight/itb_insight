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
 * Baris disusun dengan flex, bukan posisi absolut per elemen, supaya badge
 * yang lebih panjang ("Roadshow") atau tanggal yang lebih panjang
 * ("2–20 November, 2026") mendorong elemen berikutnya, bukan menimpanya.
 * Lebar minimum badge (87) dan kolom tanggal (253 = 419 - 166) membuat
 * posisi untuk teks standar tetap sama persis dengan Figma.
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
  fontFamily: "var(--font-primary)",
  fontSize: u(28),
  fontWeight: 400,
  lineHeight: u(34),
  color: "#ffffff",
  whiteSpace: "nowrap",
} as const;

const iconStyle = { width: u(48), height: u(48), maxWidth: "none", flex: "none" } as const;

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export default function EventDateRow({ event }: { event: EventItem }) {
  const { x, y } = event.rowBox;

  return (
    <div
      style={{
        position: "absolute",
        left: u(x),
        top: u(y),
        height: u(48),
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ikon kalender */}
      {/* SVG: next/image tidak mengoptimalkan SVG, <img> biasa sudah tepat */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/events/icon-date.svg" alt="" aria-hidden="true" style={iconStyle} />

      {/* badge hari: warna event + lapisan kaca */}
      <span
        style={{
          position: "relative",
          marginLeft: u(16),
          minWidth: u(87),
          height: u(48),
          padding: `0 ${u(8)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: u(6),
          overflow: "hidden",
          background: hexToRgba(event.badgeColor, event.badgeOpacity),
        }}
      >
        <span
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, background: "rgba(237, 237, 237, 0.2)" }}
        />
        <span style={{ ...textStyle, position: "relative" }}>{event.day}</span>
      </span>

      {/* tanggal: kolom minimal 253 agar ikon pin jatuh di +419 seperti Figma */}
      <span style={{ marginLeft: u(15), minWidth: u(253), paddingRight: u(20) }}>
        {event.date ? (
          <time dateTime={event.date} style={textStyle}>
            {event.dateLabel}
          </time>
        ) : (
          <span style={textStyle}>{event.dateLabel}</span>
        )}
      </span>

      {/* ikon pin */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/events/icon-pin.svg" alt="" aria-hidden="true" style={iconStyle} />

      {/* lokasi */}
      <span style={{ ...textStyle, marginLeft: u(4) }}>{event.location}</span>
    </div>
  );
}
