import type { Competition } from "@/features/competition/types";
import { registerEnabled } from "@/features/competition/status";
import { externalLinkProps, variantHref } from "@/features/competition/format";

/**
 * Figma: frame "Contact n Register" 393x224 di y=3030.
 * Tombol dalam frame 222x32 di y=3126, jarak 12.
 *   Contact Us   99x32 — tanpa fill, hanya stroke gradient 2, teks #dee8fb
 *   Register Now 111x32 — fill gradient #dee8fb -> #acc7ff, teks #1b3b7d
 * Teks Gabarito 12/14.
 *
 * Contact Us disembunyikan selama contactUrl null (kontak resmi belum ada).
 * Tombol daftar ditutup secara default ("Pendaftaran Ditutup", bukan
 * tautan) dan baru menjadi "Register Now" kalau env REGISTER_OPEN_<kode>
 * bernilai true. Lihat status.ts registerEnabled.
 */
export default function ContactRegister({
  competition,
  y,
}: {
  competition: Competition;
  /** Y tombol; dihitung di mobileLayout.ts (Figma: 3126) */
  y: number;
}) {
  const base = {
    height: 32,
    fontFamily: "var(--font-primary)",
    fontSize: 12,
    lineHeight: "14px",
  };

  return (
    <div
      className="z-10 flex items-center justify-center gap-[12px]"
      style={{ position: "absolute", left: 0, right: 0, top: y, height: 32 }}
    >
      {competition.contactUrl ? (
        <a
          href={variantHref(competition.contactUrl, "mobile")}
          {...externalLinkProps(competition.contactUrl)}
          className="btn-outline flex items-center justify-center"
          style={{ ...base, width: 99 }}
        >
          Contact Us
        </a>
      ) : null}
      {competition.registerUrl && registerEnabled(competition) ? (
        <a
          href={competition.registerUrl}
          {...externalLinkProps(competition.registerUrl)}
          className="btn-solid flex items-center justify-center"
          style={{ ...base, width: 111 }}
        >
          Register Now
        </a>
      ) : (
        <span
          aria-disabled="true"
          className="btn-outline flex items-center justify-center"
          style={{ ...base, width: 150, opacity: 0.75, cursor: "default" }}
        >
          Pendaftaran Ditutup
        </span>
      )}
    </div>
  );
}
