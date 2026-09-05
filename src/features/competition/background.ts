/**
 * Susunan lapisan latar halaman kompetisi.
 *
 * Nilainya TIDAK dibaca dari JSON Figma, melainkan diukur dari hasil render
 * tiap node secara terpisah lewat Figma REST API, lalu disampel pikselnya.
 * Cara itu ditempuh karena data JSON-nya menyesatkan:
 *
 *  1. gradientHandlePositions kedua rectangle overlay TERTULIS SAMA
 *     ([0.5,1] -> [0.5,0]), padahal hasil render-nya BERLAWANAN ARAH.
 *     Menyusunnya searah membuat rectangle pertama berakhir terang di y=847
 *     lalu rectangle kedua mulai gelap di titik yang sama — muncul garis
 *     sambungan yang keras, yang di Figma tidak ada.
 *
 *  2. Dua rectangle lain yang ada di JSON (y=1699 dan y=1968) dikembalikan
 *     KOSONG oleh Figma saat dirender sendiri, alias tidak terlihat.
 *     Kalau ikut dipasang, muncul dua garis sambungan lagi.
 *
 * Hasil sampel render Figma (kolom x=5):
 *   base  y=0     h=3536  atas #091b3f  ->  bawah #294d97   opacity 1
 *   ov1   y=-5    h=852   atas #1a3a7c  ->  bawah #abc5fd   opacity 0.5
 *   ov2   y=847   h=852   atas #abc7ff  ->  bawah #163066   opacity 0.5
 *
 * ov1 berakhir terang tepat saat ov2 mulai terang, jadi sambungannya mulus.
 */

export interface BackgroundLayer {
  /** px dari puncak frame */
  top: number;
  height: number;
  /** warna di sisi ATAS lapisan */
  from: string;
  /** warna di sisi BAWAH lapisan */
  to: string;
  opacity: number;
}

export const BACKGROUND_LAYERS: BackgroundLayer[] = [
  { top: 0, height: 3536, from: "#091b3f", to: "#294d97", opacity: 1 },
  { top: -5, height: 852, from: "#1a3a7c", to: "#abc5fd", opacity: 0.5 },
  { top: 847, height: 852, from: "#abc7ff", to: "#163066", opacity: 0.5 },
];

/**
 * Tiga bentuk vector besar ber-blur yang memberi semburat warna.
 * SVG hasil export SUDAH membawa opacity dan blur-nya sendiri, jadi jangan
 * menerapkan opacity lagi lewat CSS. Kanvas SVG lebih besar daripada bentuk
 * aslinya karena blur menambah margin, maka SVG dirender pada ukuran aslinya
 * lalu dipusatkan pada titik tengah bentuk yang sama seperti di Figma.
 */
export interface BlobLayer {
  src: string;
  /** ukuran asli kanvas SVG */
  w: number;
  h: number;
  /** titik tengah bentuk, relatif terhadap sudut kiri-atas frame */
  cx: number;
  cy: number;
}

export const BLOB_LAYERS: BlobLayer[] = [
  { src: "/deco/blob-1.svg", w: 746, h: 719, cx: -83.5, cy: 893 },
  { src: "/deco/blob-2.svg", w: 1194, h: 720, cx: 142.6, cy: 1240.8 },
  { src: "/deco/blob-3.svg", w: 1122, h: 1845, cx: 210, cy: 2150.5 },
];

/** Business Plan Competition menggeser blob-nya 8px ke atas. */
export const BLOB_OFFSET_Y: Record<string, number> = {
  "business-plan-competition": -8,
};
