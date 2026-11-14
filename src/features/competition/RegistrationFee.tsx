import type { FeeTier } from "@/features/competition/types";
import { formatRupiah, lowestFee } from "@/features/competition/format";

/**
 * Figma: card "Frame 187" 339x156 di x=27 y=1756 — glassmorphism radius 20 border 4px.
 * Label y=1772 EXCRATCH 700 16/32 center · nilai y=1816 EXCRATCH 700 32/48 center.
 *
 * Satu harga: tampil apa adanya. Beberapa gelombang (Early Bird, Normal,
 * Extended): kartu ini menampilkan harga terendah dengan awalan "mulai",
 * dan rincian tiap gelombang ada di bagian detail lomba di bawah kanvas.
 *
 * Inline style dipakai karena globals.css punya aturan p tanpa @layer
 * (color dan font-size) yang mengalahkan utility Tailwind.
 * Lihat catatan lengkap di CompetitionHero.
 */
export default function RegistrationFee({ fees, y }: { fees: FeeTier[]; y: number }) {
  const tiered = fees.length > 1;
  const amount = lowestFee(fees.map((f) => f.amount));
  const cheapest = fees.find((f) => f.amount === amount) ?? fees[0];

  return (
    <div
      className="glass-card z-10 flex flex-col items-center justify-center"
      style={{ position: "absolute", top: y, left: 27, width: 339, height: 156 }}
    >
      <p
        className="text-grad"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          fontWeight: 700,
          lineHeight: "32px",
          textTransform: "uppercase",
        }}
      >
        Registration fee
      </p>
      <p
        className="text-grad"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 700,
          lineHeight: "48px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatRupiah(amount)}
      </p>
      <p
        style={{
          fontFamily: "var(--font-primary)",
          fontSize: 12,
          lineHeight: "16px",
          color: "#acc7ff",
        }}
      >
        {tiered
          ? `${cheapest.label ?? "Harga terendah"} · ${cheapest.unit.toLowerCase()} · ${fees.length} gelombang`
          : fees[0].unit}
      </p>
    </div>
  );
}
