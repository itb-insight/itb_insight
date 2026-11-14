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

export interface FeeTier {
  /** "Early Bird", "Normal", ... Kosong kalau hanya satu harga. */
  label?: string;
  /** Rupiah, angka murni */
  amount: number;
  /** "Per tim" / "Per orang" */
  unit: string;
  /** Teks periode apa adanya, misal "20 – 31 Agustus 2026" */
  periodLabel?: string;
}

export interface Prize {
  /** Total hadiah uang dalam rupiah. null = nominal belum diumumkan. */
  amount: number | null;
  /** Teks pengganti saat amount null, misal "Uang Tunai" */
  fallback?: string;
  /** Hadiah lain selain uang, misal ["laptop", "medali"] */
  extras?: string[];
}

export interface CompetitionInfoData {
  /** Info singkat: format, peserta, cakupan, kuota, bahasa, lokasi */
  facts: { label: string; value: string }[];
  /** Tema/subtema, bidang materi, atau spesifikasi alat */
  topics?: { title: string; intro?: string; items: string[] };
  /** Syarat peserta */
  requirements: string[];
  /** Narahubung lomba. WhatsApp ditulis format lokal (08...). */
  contacts?: { name: string; line?: string; whatsapp?: string }[];
  /** Data/dokumen yang disiapkan saat mendaftar */
  documents?: string[];
  /** Berkas yang dikumpulkan per tahap */
  stageFiles?: { stage: string; files: string; deadline: string }[];
}

export interface CompetitionDesktopDesign {
  logoSrc: string;
  logoWidth: number;
  heroMaxWidth: number;
  titleFrom: string;
  titleTo: string;
  timelineFrom: string;
  timelineTo: string;
  descriptionLines?: string[];
}

export interface Competition {
  slug: string;
  /**
   * Kode singkat lomba (sama dengan teamUidPrefix di src/lib/competitions.ts).
   * Dipakai untuk env REGISTER_OPEN_<code>; lihat status.ts registerEnabled.
   */
  code: string;
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
   * Masa pendaftaran (ISO dengan zona WIB). Menentukan status buka/tutup,
   * tombol Register, dan target hitung mundur. Lihat status.ts.
   */
  registration: { opens: string; closes: string };
  /**
   * Target hitung mundur setelah pendaftaran ditutup: hari final.
   * title = judul section hitung mundur, dua baris di mobile.
   */
  finalCountdown: { date: string; title: [string, string] };
  /** Biaya pendaftaran per gelombang. Satu elemen = satu harga. */
  fees: FeeTier[];
  prize: Prize;
  /** null = belum ada tautannya: tombolnya disembunyikan */
  syllabusUrl: string | null;
  guidebookUrl: string | null;
  contactUrl: string | null;
  /**
   * Formulir pendaftaran eksternal (Google Form). Pendaftaran lomba tidak
   * lagi lewat website. null = belum ada tautan: tombol daftar selalu ditutup.
   */
  registerUrl: string | null;
  /** Detail lomba dari Form Informasi Competition. Lihat CompetitionInfo.tsx. */
  info: CompetitionInfoData;
  timeline: TimelineItem[];
  desktop: CompetitionDesktopDesign;
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    keywords: string[];
  };
}
