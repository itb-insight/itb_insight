import type { CSSProperties } from "react";
import type { Box } from "@/features/events/types";
import { u } from "@/features/events/scale";
import styles from "@/features/events/EventButton.module.css";

/**
 * Tombol "Registrasi" dengan state hover dari Figma.
 * Spesifikasi warna dan alasannya ada di EventButton.module.css.
 *
 * Murni CSS (:hover), bukan Client Component — tidak menambah JavaScript ke
 * halaman, dan tetap berfungsi kalau JavaScript gagal dimuat (PRD ACS-06).
 */
export default function EventButton({
  box,
  href,
  label,
  ariaLabel,
}: {
  box: Box;
  href: string;
  label: string;
  ariaLabel: string;
}) {
  const style = {
    left: u(box.x),
    top: u(box.y),
    width: u(box.w),
    height: u(box.h),
    borderRadius: u(12),
    "--border": u(4),
    // radius bagian dalam = radius luar - tebal tepi
    "--radius-inner": u(8),
    fontFamily: "var(--font-primary)",
    fontSize: u(16),
    fontWeight: 400,
    lineHeight: u(20),
  } as CSSProperties;

  return (
    <a href={href} aria-label={ariaLabel} className={styles.button} style={style}>
      {label}
    </a>
  );
}
