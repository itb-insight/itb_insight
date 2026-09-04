import { formatRupiah } from "@/features/competition/format";

/**
 * Figma: card "Frame 187" 339x156 di x=27 y=1756 — glassmorphism radius 20 border 4px.
 * Label y=1772 EXCRATCH 700 16/32 center · nilai y=1816 EXCRATCH 700 32/48 center.
 *
 * Inline style dipakai karena globals.css punya aturan p tanpa @layer
 * (color dan font-size) yang mengalahkan utility Tailwind.
 * Lihat catatan lengkap di CompetitionHero.
 */
export default function RegistrationFee({ fee }: { fee: number }) {
  return (
    <div
      className="glass-card z-10 flex flex-col items-center justify-center"
      style={{ position: "absolute", top: 1756, left: 27, width: 339, height: 156 }}
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
        {formatRupiah(fee)}
      </p>
    </div>
  );
}
