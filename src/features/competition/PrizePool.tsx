import { toDigitBoxes } from "@/features/competition/format";

/**
 * Figma: label "TOTAL PRIZEPOOL" y=1998 EXCRATCH 700 20/18.
 * Enam kotak 44x61 radius 9.1 di y=2039, x = 55, 102, 150, 197, 244, 292.
 *
 * Di Figma kotaknya KOSONG — isinya hanya pola neuron, belum ada angka,
 * karena nominalnya memang belum ditentukan. Selama prizePool masih 0,
 * kotaknya dibiarkan kosong persis seperti desain. Begitu nominal aslinya
 * diisi di data.ts, angkanya muncul otomatis.
 *
 * Inline style: lihat catatan di CompetitionHero.
 */
const BOX_X = [55, 102, 150, 197, 244, 292];

export default function PrizePool({ amount }: { amount: number }) {
  const digits = amount > 0 ? toDigitBoxes(amount, BOX_X.length) : null;

  return (
    <>
      <h2
        className="text-grad z-10 text-center"
        style={{
          position: "absolute",
          top: 1998,
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

      {BOX_X.map((x, i) => (
        <span
          key={i}
          className="glass-chip z-10 grid place-items-center"
          style={{
            position: "absolute",
            top: 2039,
            left: x,
            width: 44,
            height: 61,
            fontFamily: "var(--font-display)",
            fontSize: 24,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {digits && <span className="text-grad">{digits[i]}</span>}
        </span>
      ))}
    </>
  );
}
