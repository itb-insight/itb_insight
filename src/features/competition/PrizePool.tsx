import type { Prize } from "@/features/competition/types";
import { formatRupiah, joinIndonesian } from "@/features/competition/format";

/**
 * Figma: label "TOTAL PRIZEPOOL" y=1998 EXCRATCH 700 20/18, lalu enam kotak
 * 44x61 di y=2039 yang di desain masih KOSONG (nominal belum ada).
 *
 * Nominal aslinya ternyata 8 digit (Rp15.800.000, Rp10.000.000), tidak muat
 * di enam kotak, dan ada lomba yang hadiahnya belum bernominal ("Uang
 * Tunai"). Jadi enam kotak diganti satu kartu kaca selebar deretan kotak
 * (x=55..336), dengan baris hadiah tambahan di bawahnya kalau ada.
 * Kartu berakhir paling bawah di y~2160, jauh di atas judul timeline (2262).
 *
 * Inline style: lihat catatan di CompetitionHero.
 */
export default function PrizePool({
  prize,
  titleY,
  boxY,
}: {
  prize: Prize;
  /** Y judul dan kartu; dihitung di mobileLayout.ts (Figma: 1998 dan 2039) */
  titleY: number;
  boxY: number;
}) {
  const main = prize.amount !== null ? formatRupiah(prize.amount) : (prize.fallback ?? "TBA");

  return (
    <>
      <h2
        className="text-grad z-10 text-center"
        style={{
          position: "absolute",
          top: titleY,
          left: 60,
          width: 269,
          fontFamily: "var(--font-display)",
          fontSize: 20,
          fontWeight: 700,
          lineHeight: "19px",
          textTransform: "uppercase",
        }}
      >
        Total Prizepool
      </h2>

      <div
        className="glass-chip z-10 flex flex-col items-center justify-center"
        style={{
          position: "absolute",
          top: boxY,
          left: 55,
          width: 281,
          minHeight: 61,
          padding: "10px 12px",
          gap: 4,
          textAlign: "center",
        }}
      >
        <span
          className="text-grad"
          style={{
            fontFamily: "var(--font-display)",
            // 20px: "IDR 15.800.000" (14 karakter EXCRATCH) muat satu baris di 257px.
            fontSize: 20,
            fontWeight: 700,
            lineHeight: "28px",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            textTransform: "uppercase",
          }}
        >
          {main}
        </span>
        {prize.extras?.length ? (
          <span
            style={{
              fontFamily: "var(--font-primary)",
              fontSize: 13,
              lineHeight: "18px",
              color: "#dee8fb",
            }}
          >
            + {joinIndonesian(prize.extras)}
          </span>
        ) : null}
      </div>
    </>
  );
}
