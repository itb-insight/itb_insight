"use client";

import type { CSSProperties } from "react";
import { useCountdown } from "@/features/competition/CountdownSection";

/**
 * Angka hitung mundur desktop (HARI : JAM), sama logikanya dengan versi
 * mobile (useCountdown). Gaya teks dikirim dari CompetitionDesktopLayout
 * supaya tetap memakai ukuran fluid() yang sama dengan desain desktop.
 * Render awal "00" supaya HTML server dan client identik.
 */
export default function DesktopCountdown({
  target,
  digitStyle,
  colonStyle,
  labelStyle,
}: {
  target: string;
  digitStyle: CSSProperties;
  colonStyle: CSSProperties;
  labelStyle: CSSProperties;
}) {
  const t = useCountdown(target);

  return (
    <>
      <span style={digitStyle}>{t ? t.days : "00"}</span>
      <span style={colonStyle}>:</span>
      <span style={colonStyle}>{t ? t.hours : "00"}</span>

      <span style={labelStyle}>DAYS</span>
      <span style={labelStyle}>:</span>
      <span style={labelStyle}>HOURS</span>
    </>
  );
}
