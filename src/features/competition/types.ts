export type TimelineStatus = "done" | "active" | "upcoming";

export interface TimelineItem {
  id: string;
  title: string;
  /** Teks tanggal apa adanya seperti di desain, mis. "12 September 2026" */
  dateLabel: string;
  /** ISO date — dipakai untuk urutan & penentuan status */
  date: string;
  status?: TimelineStatus;
}

/**
 * Nilai yang hanya dipakai layout desktop.
 *
 * Desktop dan mobile memakai konten yang sama (judul, deskripsi, timeline,
 * biaya) tapi warna dan ukuran gambarnya memang beda — bukan hasil salah
 * salin. Karena itu bagian visual desktop dipisah di sini, bukan menumpang
 * titleFrom/accentFrom milik mobile.
 */
export interface CompetitionDesktopDesign {
  /** Logo versi desktop — file dan ukurannya beda dari ikon mobile */
  logoSrc: string;
  logoWidth: number;
  /** Lebar maksimum kolom hero (SAR lebih sempit dari yang lain) */
  heroMaxWidth: number;
  /** Gradient judul hero */
  titleFrom: string;
  titleTo: string;
  /** Gradient garis, titik, dan glow timeline */
  timelineFrom: string;
  timelineTo: string;
  /**
   * Deskripsi yang sudah dipecah per baris, untuk <br /> manual di desktop.
   * Kalau digabung dengan spasi hasilnya sama persis dengan `description`.
   * Boleh dikosongkan — nanti pakai `description` dan membungkus sendiri.
   */
  descriptionLines?: string[];
}

export interface Competition {
  slug: string;
  title: string;
  /** Paragraf deskripsi di hero */
  description: string;
  /** Path ikon/badge SVG hasil export Figma, mis. "/assets/robot-badge.svg" */
  iconSrc: string;
  /** Gradient judul hero, beda tiap lomba */
  titleFrom: string;
  titleTo: string;
  /** Warna aksen timeline (titik + garis), beda tiap lomba */
  accentFrom: string;
  accentTo: string;
  /** Koordinat Y hero, beda tiap lomba (dari Figma) */
  heroIconY: number;
  heroTitleY: number;
  heroDescY: number;
  /** Koordinat timeline, beda tiap lomba (dari Figma) */
  timelineTitleY: number;
  timelineTextY: number;
  timelineDotX: number;
  /** Ukuran ikon hero sesuai frame Figma */
  iconWidth: number;
  iconHeight: number;
  /**
   * Deadline pendaftaran (ISO). null = countdown menampilkan 00 : 00,
   * sama seperti keadaan di Figma sekarang. Isi tanggalnya kalau sudah
   * final, hitung mundurnya otomatis hidup.
   */
  registrationDeadline: string | null;
  /** Biaya pendaftaran dalam rupiah (angka murni) */
  registrationFee: number;
  /** Total prizepool dalam rupiah (angka murni) */
  prizePool: number;
  syllabusUrl: string;
  guidebookUrl: string;
  contactUrl: string;
  registerUrl: string;
  timeline: TimelineItem[];
  desktop: CompetitionDesktopDesign;
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    keywords: string[];
  };
}
