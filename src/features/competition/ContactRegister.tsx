import type { Competition } from "@/features/competition/types";

/**
 * Figma: frame "Contact n Register" 393x224 di y=3030.
 * Tombol dalam frame 222x32 di y=3126, jarak 12.
 *   Contact Us   99x32 — tanpa fill, hanya stroke gradient 2, teks #dee8fb
 *   Register Now 111x32 — fill gradient #dee8fb -> #acc7ff, teks #1b3b7d
 * Teks Gabarito 12/14.
 */
export default function ContactRegister({ competition }: { competition: Competition }) {
  const base = {
    width: 0,
    height: 32,
    fontFamily: "var(--font-primary)",
    fontSize: 12,
    lineHeight: "14px",
  };

  return (
    <div
      className="z-10 flex items-center justify-center gap-[12px]"
      style={{ position: "absolute", left: 0, right: 0, top: 3126, height: 32 }}
    >
      <a
        href={competition.contactUrl}
        className="btn-outline flex items-center justify-center"
        style={{ ...base, width: 99 }}
      >
        Contact Us
      </a>
      <a
        href={competition.registerUrl}
        className="btn-solid flex items-center justify-center"
        style={{ ...base, width: 111 }}
      >
        Register Now
      </a>
    </div>
  );
}
