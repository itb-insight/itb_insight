import { DESIGN_HEIGHT, DESIGN_WIDTH } from "@/features/events/scale";

/**
 * SAMBUNGAN ANTAR SECTION
 * Frame-frame di Figma dirancang untuk ditumpuk, tapi hanya 2 dari 6
 * sambungannya yang benar-benar menyambung. Hasil ukur di render Figma
 * (selisih baris terbawah frame atas vs baris teratas frame bawah):
 *   Insight Festival  -> Exhibition Manager    0.9   nyambung
 *   Exhibition Manager -> Play-Tech           14.2   putus
 *   Play-Tech          -> Show-Tech           17.0   putus
 *   Show-Tech          -> Insight on Stage    17.5   putus
 *   Insight on Stage   -> Inspirates           1.8   nyambung
 *   Inspirates         -> Alumni Gathering    13.5   putus
 * (pembanding: dua baris bersebelahan di dalam satu frame ~0.6)
 *
 * Section yang tepi atasnya putus (blendWithPrevious) ditumpuk BLEND_HEIGHT
 * piksel desain ke atas section sebelumnya, dan bagian atasnya diberi masker
 * transparan -> penuh, sehingga kedua tepi berbaur.
 *
 * Masker memakai kurva smoothstep (landai di kedua ujung), bukan garis lurus.
 * Peralihan linear meninggalkan "tepi" yang masih terlihat di titik awal dan
 * akhir pita; smoothstep menghilangkannya.
 *
 * Batas aman konten untuk BLEND_HEIGHT = 240:
 *   - teks paling atas section ini mulai di y=286        (> 240)
 *   - konten paling bawah section sebelumnya di y=752    (< 1024 - 240)
 * Jangan naikkan melewati ~270 tanpa memeriksa ulang batas ini.
 */
export const BLEND_HEIGHT = 240;

function smoothMask(heightPercent: number): string {
  const stops: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const alpha = t * t * (3 - 2 * t); // smoothstep
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(t * heightPercent).toFixed(3)}%`);
  }
  return `linear-gradient(180deg, ${stops.join(", ")})`;
}

// Margin persen dihitung dari LEBAR container, jadi 240/1728 lebar = 240px desain.
// Masker persen dihitung dari TINGGI section, jadi 240/1024.
const MASK = smoothMask((BLEND_HEIGHT / DESIGN_HEIGHT) * 100);
const BLEND_STYLE = {
  marginTop: `${(-(BLEND_HEIGHT / DESIGN_WIDTH) * 100).toFixed(4)}%`,
  maskImage: MASK,
  WebkitMaskImage: MASK,
} as const;

/** Gaya tumpuk + masker untuk section yang dibaurkan ke section sebelumnya. */
export function blendStyle(enabled: boolean) {
  return enabled ? BLEND_STYLE : null;
}
