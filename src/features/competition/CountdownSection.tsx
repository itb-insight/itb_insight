"use client";

import { useEffect, useState } from "react";

type Remaining = { days: string; hours: string };

function diff(target: number): Remaining {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { days: pad(Math.floor(s / 86400)), hours: pad(Math.floor((s % 86400) / 3600)) };
}

/**
 * Figma: judul y=1034 EXCRATCH 700 28/32 center dua baris.
 * Card "Frame 187" 336x144 di x=29 y=1130 — glassmorphism radius 20 border 4px.
 * Angka y=1166 EXCRATCH 700 32/38 · label DAYS/HOURS y=1214 Gabarito 400 16/24.
 * Hanya DAYS dan HOURS, tanpa menit dan detik.
 *
 * Di Figma angkanya masih "00 : 00" karena deadline pendaftaran belum final.
 * Selama registrationDeadline masih null, komponen ini menampilkan 00 : 00
 * persis seperti desain dan TIDAK menghitung apa pun. Begitu tanggalnya diisi
 * di data.ts, hitung mundurnya hidup sendiri tanpa mengubah komponen ini.
 *
 * Client Component — satu-satunya bagian yang butuh JS di browser.
 * Render awal "00" supaya HTML server dan client identik (no hydration mismatch).
 *
 * Inline style dipakai karena globals.css punya aturan global tanpa @layer
 * yang mengalahkan utility Tailwind. Lihat catatan di CompetitionHero.
 */
const displayFont = "var(--font-display)";

const numberStyle = {
  fontFamily: displayFont,
  fontSize: 32,
  fontWeight: 700,
  lineHeight: "38px",
  fontVariantNumeric: "tabular-nums",
} as const;

const labelStyle = {
  marginTop: 10,
  fontFamily: "var(--font-primary)",
  fontSize: 16,
  fontWeight: 400,
  lineHeight: "24px",
} as const;

export default function CountdownSection({ deadline }: { deadline: string | null }) {
  const [t, setT] = useState<Remaining | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const target = new Date(deadline).getTime();
    setT(diff(target));
    const id = setInterval(() => setT(diff(target)), 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <>
      <h2
        className="text-grad"
        style={{
          position: "absolute",
          zIndex: 10,
          top: 1034,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: displayFont,
          fontSize: 28,
          fontWeight: 700,
          lineHeight: "32px",
          textTransform: "uppercase",
        }}
      >
        Registration
        <br />
        countdown
      </h2>

      <div
        className="glass-card flex items-center justify-center"
        style={{
          position: "absolute",
          zIndex: 10,
          top: 1130,
          left: 29,
          width: 336,
          height: 144,
        }}
      >
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start px-[36px]">
          <div className="text-center">
            <div className="text-grad" style={numberStyle}>
              {t ? t.days : "00"}
            </div>
            <div className="text-grad" style={labelStyle}>
              DAYS
            </div>
          </div>

          <div className="text-center">
            <div className="text-grad" style={numberStyle}>
              :
            </div>
            <div className="text-grad" style={labelStyle}>
              :
            </div>
          </div>

          <div className="text-center">
            <div className="text-grad" style={numberStyle}>
              {t ? t.hours : "00"}
            </div>
            <div className="text-grad" style={labelStyle}>
              HOURS
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
