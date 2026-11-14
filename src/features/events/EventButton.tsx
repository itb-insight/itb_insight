import type { CSSProperties } from "react";
import type { Box } from "@/features/events/types";
import { u } from "@/features/events/scale";
import styles from "@/features/events/EventButton.module.css";
import { isDisabledMapHref } from "@/lib/maps";
import { ComingSoonPill, comingSoonHostClass } from "@/shared/components/ComingSoon/ComingSoon";

/**
 * Tombol section event dengan state hover dari Figma.
 * Spesifikasi warna dan alasannya ada di EventButton.module.css.
 *
 * Murni CSS (:hover), bukan Client Component — tidak menambah JavaScript ke
 * halaman, dan tetap berfungsi kalau JavaScript gagal dimuat (PRD ACS-06).
 *
 * href null = event belum dibuka (Coming Soon): dirender sebagai teks
 * biasa, bukan tautan, tanpa state hover.
 */
export default function EventButton({
  box,
  flow = false,
  href,
  label,
  ariaLabel,
}: {
  /** Kotak di kanvas desktop (piksel desain). Tidak dipakai kalau flow. */
  box?: Box;
  /** true = tata letak mobile: mengalir di dokumen, ukuran dalam px. */
  flow?: boolean;
  href: string | null;
  label: string;
  ariaLabel: string;
}) {
  const common = {
    fontFamily: "var(--font-primary)",
    fontWeight: 400,
  } as const;

  const flowStyle = {
    // Mobile: sama persis tampilannya (isi, tepi, hover), tapi tidak absolut.
    position: "relative",
    width: "100%",
    maxWidth: 300,
    height: 56,
    borderRadius: 12,
    "--border": "4px",
    "--radius-inner": "8px",
    ...common,
    fontSize: 18,
    lineHeight: "22px",
  } as CSSProperties;

  const canvasStyle = box
    ? ({
        left: u(box.x),
        top: u(box.y),
        width: u(box.w),
        height: u(box.h),
        borderRadius: u(12),
        "--border": u(4),
        // radius bagian dalam = radius luar - tebal tepi
        "--radius-inner": u(8),
        ...common,
        fontSize: u(16),
        lineHeight: u(20),
      } as CSSProperties)
    : flowStyle;

  const style = flow ? flowStyle : canvasStyle;

  // NEXT_PUBLIC_MAPS_DISABLED=true: the map button (Insight Festival "Lihat Peta") is greyed
  // out like Coming Soon, keeps its label, and shows the "Coming Soon!" pill on hover / tap.
  if (isDisabledMapHref(href)) {
    return (
      <span
        tabIndex={0}
        aria-disabled="true"
        aria-label={`${ariaLabel} (Coming Soon)`}
        className={`${styles.button} ${styles.disabled} ${styles.comingSoon} ${comingSoonHostClass}`}
        style={style}
      >
        {label}
        <ComingSoonPill placement="top" />
      </span>
    );
  }

  if (href === null) {
    return (
      <span aria-disabled="true" className={`${styles.button} ${styles.disabled}`} style={style}>
        {label}
      </span>
    );
  }

  return (
    <a href={href} aria-label={ariaLabel} className={styles.button} style={style}>
      {label}
    </a>
  );
}
