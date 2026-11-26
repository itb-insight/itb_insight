"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/features/events/detail/EventDetail.module.css";

/** Lebar layar ini ke bawah memakai encode kecil. Sama dengan breakpoint mobile halaman detail. */
const MOBILE_QUERY = "(max-width: 760px)";

/**
 * Video latar hero halaman detail (bisu, berulang, dekoratif).
 *
 * Poster/LCP tetap <Image> di DetailHero; video ini menimpanya dan baru
 * terlihat setelah benar-benar diputar. src baru dipasang setelah halaman
 * selesai dimuat dan main thread menganggur, jadi video tidak berebut
 * bandwidth dengan konten. Tidak diunduh sama sekali dengan
 * prefers-reduced-motion atau Save-Data (pola yang sama dengan
 * ScrollVideoBackground di landing).
 */
export default function HeroVideo({ desktop, mobile }: { desktop: string; mobile: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const start = () => {
      const video = ref.current;
      if (!video) return;
      video.src = window.matchMedia(MOBILE_QUERY).matches ? mobile : desktop;
      // Autoplay bisu kadang ditolak (mode hemat daya): poster tetap tampil.
      video.play().catch(() => {});
    };
    const schedule = () => {
      // Safari belum punya requestIdleCallback
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(start, { timeout: 3000 });
      } else {
        timeoutId = window.setTimeout(start, 200);
      }
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      window.removeEventListener("load", schedule);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [desktop, mobile]);

  return (
    <video
      ref={ref}
      className={`${styles.heroVideo} ${playing ? styles.heroVideoOn : ""}`}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setPlaying(true)}
    />
  );
}
