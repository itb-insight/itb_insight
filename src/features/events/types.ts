/** Kotak posisi dalam piksel desain (frame Figma 1728 x 1024). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Satu lapisan di dalam section event, sesuai urutan di Figma.
 *   decor   — ornamen (pola gelombang, blob, elips) hasil export SVG Figma
 *   photo   — foto kegiatan
 *   content — judul, tanggal, deskripsi, tombol
 */
export type EventLayer =
  | {
      kind: "decor";
      src: string;
      /** titik tengah bentuk, relatif ke kiri-atas frame */
      cx: number;
      cy: number;
      /** ukuran kanvas SVG (sudah termasuk margin blur / tekstur) */
      w: number;
      h: number;
    }
  | { kind: "photo" }
  | { kind: "content" };

export interface EventItem {
  slug: string;
  /**
   * true = tepi atas section ini tidak menyambung dengan tepi bawah section
   * sebelumnya, bahkan di Figma-nya sendiri. Section ini lalu ditumpuk
   * sedikit ke atas dan dibaurkan. Lihat BLEND_HEIGHT di EventSection.tsx.
   */
  blendWithPrevious: boolean;
  /** Teks judul apa adanya dari Figma. "\n" berarti pindah baris paksa. */
  title: string;
  description: string;
  /** Nama hari di badge, misal "Sabtu" */
  day: string;
  /** Teks tanggal persis seperti desain, misal "28 November, 2026" */
  dateLabel: string;
  /** Tanggal ISO untuk <time> dan JSON-LD */
  date: string;
  location: string;
  registerUrl: string;
  buttonLabel: string;

  /** Warna badge hari, beda tiap event */
  badgeColor: string;
  badgeOpacity: number;

  /** Gradient latar dari atas ke bawah. Event genap arahnya terbalik. */
  bgTop: string;
  bgBottom: string;

  titleBox: Box;
  rowBox: Box;
  descBox: Box;
  buttonBox: Box;
  photoBox: Box;

  layers: EventLayer[];
}
