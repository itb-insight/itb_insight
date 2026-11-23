/**
 * Tiga kategori objek yang bisa diberi feedback, beserta warnanya.
 *
 * Dipakai bersama oleh widget Rating (bar) dan tabel Semua Feedback, supaya
 * lencana "Booth / Compe / Event" tidak ditulis dua kali dengan warna yang
 * berbeda tipis.
 *
 * Sumber: Figma node 1937:3828 (bar) dan 1939:3949 (tabel).
 */

export type KategoriFeedback = "booth" | "competition" | "event"

export interface GayaKategori {
  /** Tulisan di lencana — sengaja pendek, "Compe" bukan "Competition". */
  lencana: string
  /** Tulisan di legenda, versi panjang. */
  legenda: string
  /** Latar lencana. */
  bgLencana: string
  /** Teks lencana. */
  warnaLencana: string
  /** Isi segmen bar yang menyala, sekaligus garis tepi bar-nya. */
  bar: string
  /** Bulatan legenda — SENGAJA beda dari warna bar; begitu di Figma. */
  titik: string
}

export const KATEGORI: Record<KategoriFeedback, GayaKategori> = {
  booth: {
    lencana: "Booth",
    legenda: "Booth",
    bgLencana: "#1f3048",
    warnaLencana: "#acc7ff",
    bar: "linear-gradient(0deg, #517eda 1%, #acc7ff 100%)",
    titik: "#7fa9f6",
  },
  competition: {
    lencana: "Compe",
    legenda: "Competition",
    bgLencana: "#383634",
    warnaLencana: "#fffc86",
    bar: "linear-gradient(0deg, #fff236 0%, #feffca 100%)",
    titik: "#fad500",
  },
  event: {
    lencana: "Event",
    legenda: "Event",
    bgLencana: "#0e352a",
    warnaLencana: "#caf0c2",
    /* Arahnya 180deg, kebalikan dua lainnya — begitu di dump, bukan salah ketik. */
    bar: "linear-gradient(180deg, #d0ffc7 0%, #76df62 100%)",
    titik: "#6ccb59",
  },
}

/** Urutan tetap untuk legenda. */
export const URUTAN_KATEGORI: KategoriFeedback[] = ["booth", "competition", "event"]

/* Segmen bar yang mati ada sebagai token CSS --admin-bar-mati, bukan di sini,
   karena cuma CSS yang memakainya. */
