/**
 * Skala desain desktop.
 *
 * Frame Figma berukuran 1728 x 1024 (MacBook Pro 16"). Supaya tampilan sama
 * persis di layar dengan lebar berapa pun, setiap angka piksel desain diubah
 * ke satuan cqw (persen lebar container). Section memasang
 * `container-type: inline-size`, jadi 100cqw = lebar section.
 *
 *   u(64)  ->  "3.7037cqw"   (64 / 1728 * 100)
 *
 * Keuntungannya dibanding transform: scale():
 *   - murni CSS, langsung benar sejak HTML pertama dikirim server
 *     (tidak ada lompatan tata letak menunggu JavaScript)
 *   - teks tetap teks asli yang bisa dipilih, dibaca mesin pencari,
 *     dan tidak buram
 */
export const DESIGN_WIDTH = 1728;
export const DESIGN_HEIGHT = 1024;

export function u(px: number): string {
  return `${((px / DESIGN_WIDTH) * 100).toFixed(4)}cqw`;
}

/**
 * Gaya dasar untuk setiap section 1728 x 1024.
 * Inline style dipakai (bukan class Tailwind) karena src/app/globals.css
 * punya aturan global tanpa @layer — misalnya `* { margin: 0; padding: 0 }`
 * dan `img { max-width: 100% }` — yang selalu mengalahkan utility Tailwind.
 */
export const sectionStyle = {
  position: "relative",
  width: "100%",
  aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
  overflow: "hidden",
  containerType: "inline-size",
} as const;
