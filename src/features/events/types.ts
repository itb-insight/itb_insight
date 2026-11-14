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

/** Foto, dipakai di /event maupun halaman detail. */
export interface EventImage {
  src: string;
  alt: string;
  /** CSS object-position, untuk foto yang titik pentingnya tidak di tengah */
  position?: string;
}

/**
 * Slot tata letak /event: bagian visual yang terikat pada posisi section.
 * Lihat layoutSlots.ts.
 */
export interface EventSlot {
  /** Nama frame Figma asal slot ini (dokumentasi saja) */
  figmaFrame: string;
  /**
   * true = tepi atas section ini tidak menyambung dengan tepi bawah section
   * sebelumnya, bahkan di Figma-nya sendiri. Section ini lalu ditumpuk
   * sedikit ke atas dan dibaurkan. Lihat BLEND_HEIGHT di EventSection.tsx.
   */
  blendWithPrevious: boolean;
  /** Gradient latar dari atas ke bawah. */
  bgTop: string;
  bgBottom: string;
  /** Sisi foto. Teks selalu di sisi seberangnya. */
  photoSide: "left" | "right";
  layers: EventLayer[];
}

/** Isi satu section di /event. Lihat data.ts. */
export interface EventCopy {
  /** id section (anchor #slug di /event) */
  slug: string;
  /** "\n" = pindah baris paksa. Jumlah baris menentukan posisi vertikal blok. */
  title: string;
  description: string;
  /** Teks di badge, misal "Sabtu", "Roadshow", "Segera" */
  day: string;
  /** Teks tanggal persis seperti tampil, misal "28 November, 2026" */
  dateLabel: string;
  /** Tanggal ISO untuk <time> dan JSON-LD. null = belum diumumkan. */
  date: string | null;
  location: string;
  badgeColor: string;
  photo: EventImage;
  /** null = tombol nonaktif (Coming Soon) */
  buttonHref: string | null;
  buttonLabel: string;
  /** Slug halaman detail /event/<slug>, kalau ada */
  detailSlug?: string;
  status?: "coming-soon";
}

/** Section /event yang siap dirender: slot + isi + posisi hasil hitung. */
export interface EventItem extends EventSlot, EventCopy {
  badgeOpacity: number;
  titleBox: Box;
  rowBox: Box;
  descBox: Box;
  buttonBox: Box;
  photoBox: Box;
}

/* ------------------------------------------------------------------ */
/* Halaman detail /event/[slug]                                        */
/* ------------------------------------------------------------------ */

export interface DetailCta {
  label: string;
  href: string;
  /** Tautan ke situs lain: dibuka di tab baru */
  external?: boolean;
}

export interface DetailHighlight {
  /** Judul pendek opsional, misal "Live Band Performance" */
  title?: string;
  text: string;
}

export interface RundownItem {
  /** Kosong = urutan tanpa jam (misal sesi Inspirates di sekolah) */
  time?: string;
  title: string;
  note?: string;
  /** Ditonjolkan (puncak acara) */
  star?: boolean;
}

export interface RundownGroup {
  title?: string;
  /** Nuansa latar: pagi atau malam */
  tone?: "day" | "night";
  items: RundownItem[];
}

export interface Attraction {
  name: string;
  description: string;
}

export interface AttractionGroup {
  /** id anchor, misal "playtech" */
  id: string;
  title: string;
  area?: string;
  /** Satuan jumlah, misal "wahana", "instalasi", "alat" */
  unit: string;
  items: Attraction[];
}

export interface SchoolVisit {
  school: string;
  /** ISO, misal "2026-11-11" */
  date: string;
  time: string;
}

export interface SeminarSession {
  label: string;
  time: string;
  room: string;
  capacity: string;
}

export interface EventDetail {
  slug: string;
  name: string;
  tagline: string;
  /** 1-3 kalimat di hero */
  summary: string;
  aboutTitle: string;
  about: string[];
  /** Warna aksen event: titik timeline, nomor, garis daftar */
  accent: string;

  /** Untuk JSON-LD (ISO, boleh dengan jam dan zona WIB) */
  startDate: string;
  endDate?: string;

  facts: {
    date: string;
    time: string;
    venue: string;
    audience: string;
    ticket: string;
    registration: string;
    quota?: string;
  };

  hero: EventImage;
  aboutImage: EventImage;
  /** Gambar OpenGraph JPG 1200x630 (WebP belum didukung semua aplikasi chat) */
  ogImage: string;
  ctas: DetailCta[];

  highlightsTitle: string;
  highlights: DetailHighlight[];

  rundown?: { title: string; groups: RundownGroup[] };
  attractions?: { title: string; groups: AttractionGroup[] };
  schoolVisits?: SchoolVisit[];
  seminar?: {
    sessions: SeminarSession[];
    whoFor: string;
    learn: string[];
    register: string[];
    registerUrl: string;
  };

  bring?: string[];
  rules?: string[];
  checkIn?: string[];
  faq?: { q: string; a: string }[];
  gallery: EventImage[];

  /** Ringkasan untuk kartu "Event lainnya" */
  card: { when: string; where: string; image: EventImage };
  seoDescription: string;
}
