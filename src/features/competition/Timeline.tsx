import type { TimelineItem } from "@/features/competition/types";

/**
 * Timeline halaman kompetisi.
 *
 * Koordinatnya BERBEDA TIAP LOMBA, jadi diambil dari data (Figma):
 *   judul       timelineTitleY  (SAR 2272, MO 2265, BPC 2262, OE 2267)
 *   teks item   timelineTextY   (SAR 2342, MO 2335, BPC 2332, OE 2337)
 *   titik       timelineDotX    (SAR 68, MO 68, BPC 52, OE 98)
 *
 * Pola yang konsisten di keempatnya:
 *   titik  y = teks y + 14, ukuran 24x24, jarak antar item 88
 *   garis  x = titik x + 12, mulai y = titik y + 12, tebal 2
 *   teks   x = titik x + 36, nama 20/24, tanggal 16/24
 *
 * Warna titik dan garis mengikuti warna ikon lomba (accentFrom/accentTo):
 *   SAR merah muda · MO ungu · BPC hijau · OE biru
 *
 * Inline style dipakai karena globals.css punya aturan global tanpa @layer
 * yang mengalahkan utility Tailwind. Lihat catatan di CompetitionHero.
 */
const STEP = 88;
const DOT_SIZE = 24;
const DOT_OFFSET_Y = 14;
const TEXT_OFFSET_X = 36;

export default function Timeline({
  items,
  accentFrom,
  accentTo,
  titleY,
  textY,
  dotX,
}: {
  items: TimelineItem[];
  accentFrom: string;
  accentTo: string;
  titleY: number;
  textY: number;
  dotX: number;
}) {
  if (items.length === 0) return null;

  const accent = `linear-gradient(180deg, ${accentFrom} 0%, ${accentTo} 100%)`;
  const dotY = textY + DOT_OFFSET_Y;
  const lineHeight = (items.length - 1) * STEP;

  return (
    <>
      <h2
        className="text-grad"
        style={{
          position: "absolute",
          zIndex: 10,
          top: titleY,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 700,
          lineHeight: "38px",
          textTransform: "uppercase",
        }}
      >
        Timeline
      </h2>

      {/* Garis vertikal penghubung */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          zIndex: 10,
          top: dotY + DOT_SIZE / 2,
          left: dotX + DOT_SIZE / 2 - 1,
          width: 2,
          height: lineHeight,
          background: accent,
        }}
      />

      <ol style={{ display: "contents" }}>
        {items.map((item, i) => (
          <li key={item.id} style={{ display: "contents" }}>
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                zIndex: 10,
                top: dotY + i * STEP,
                left: dotX,
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: 999,
                background: accent,
              }}
            />
            <div
              style={{
                position: "absolute",
                zIndex: 10,
                top: textY + i * STEP,
                left: dotX + TEXT_OFFSET_X,
              }}
            >
              <p
                className="text-grad"
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: 20,
                  fontWeight: 400,
                  lineHeight: "24px",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </p>
              <p
                className="text-grad"
                style={{
                  fontFamily: "var(--font-primary)",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "24px",
                  whiteSpace: "nowrap",
                }}
              >
                <time dateTime={item.date}>{item.dateLabel}</time>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
