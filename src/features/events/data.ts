import "server-only";
import type { Box, EventCopy, EventItem, EventSlot } from "@/features/events/types";
import { LAYOUT_SLOTS } from "@/features/events/layoutSlots";

/**
 * Data halaman Events (desktop).
 *
 * Tampilan (ornamen, sisi foto, latar, sambungan) berasal dari Figma
 * "UI-UX Website ITB INSIGHT (Copy)" page Hi-Fi, frame "Event Info", dan
 * disimpan per slot di layoutSlots.ts.
 *
 * Isi di bawah (judul, deskripsi, tanggal, lokasi) berasal dari lembar
 * copywriting tiap divisi di docs/references/event/, BUKAN dari Figma.
 * Teks Figma lama masih placeholder ("Sabuga, ITB" untuk semua event) dan
 * catatan perencanaan internal.
 *
 * Event ke-n memakai slot ke-n. Jumlah event tidak boleh melebihi jumlah
 * slot; tambahkan slot dulu di layoutSlots.ts kalau perlu.
 *
 * Pindah ke Supabase/CMS nanti: cukup ganti isi getEvents() dengan fetch,
 * komponennya tidak perlu diubah.
 */

const EVENT_COPY: EventCopy[] = [
  {
    slug: "insight-festival",
    title: "Insight\nFestival",
    description:
      "Secara struktur, Insight Festival mengintegrasikan empat komponen utama, yaitu Technology Showcase, Final Day Competition, Technology Seminar, dan Insight on Stage, yang masing-masing merepresentasikan dimensi berbeda dari sains dan teknologi: eksplorasi, partisipasi, pendalaman, dan pengalaman imersif.",
    day: "Sabtu",
    dateLabel: "28 November, 2026",
    date: "2026-11-28",
    location: "ITB Ganesha",
    badgeColor: "#7245f5",
    photo: {
      src: "/events/tech-xhibition/hero.webp",
      alt: "Gapura ITB Insight Festival di Kampus ITB Ganesha",
    },
    buttonHref: "/event-map",
    buttonLabel: "Lihat Peta",
  },
  {
    slug: "tech-xhibition",
    title: "Tech-\nXhibition",
    description:
      "Lebih dari sekadar melihat, saatnya berinteraksi dengan teknologi! Tech-Xhibition menampilkan produk dan prototipe inovatif lewat demonstrasi langsung dan pengalaman interaktif bersama para exhibitor dari perusahaan, startup, komunitas, dan institusi pendidikan.",
    day: "Sabtu",
    dateLabel: "28 November, 2026",
    date: "2026-11-28",
    location: "Labtek V, ITB",
    badgeColor: "#c05150",
    photo: {
      src: "/events/tech-xhibition/gallery-1.webp",
      alt: "Pengunjung mencoba demo di booth exhibitor Tech-Xhibition",
    },
    buttonHref: "/event/tech-xhibition",
    buttonLabel: "Lihat Detail",
    detailSlug: "tech-xhibition",
  },
  {
    slug: "play-tech",
    title: "Play-Tech",
    description:
      "Coba berbagai permainan interaktif, sendiri atau bareng teman, yang memadukan keseruan dengan prinsip sains dan teknologi. Ada 18 wahana, mulai dari Robo Sumo, Wave & Go!, sampai kolam fluida non-Newtonian.",
    day: "Sabtu",
    dateLabel: "28 November, 2026",
    date: "2026-11-28",
    location: "CC Timur, ITB",
    badgeColor: "#7b7b7b",
    photo: {
      src: "/events/playtech-showtech/hero.webp",
      alt: "Pengunjung bersorak menonton robot gripper di Playtech",
    },
    buttonHref: "/event/playtech-showtech#playtech",
    buttonLabel: "Lihat Detail",
    detailSlug: "playtech-showtech",
  },
  {
    slug: "show-tech",
    title: "Show-Tech",
    description:
      "Demonstrasi dan instalasi teknologi dengan sentuhan visual dan artistik yang bikin penasaran. Dari Infinity Mirror, Piano Stairs, sampai Chroma Tunnel, temukan sains di balik cahaya dan suara.",
    day: "Sabtu",
    dateLabel: "28 November, 2026",
    date: "2026-11-28",
    location: "CC Timur, ITB",
    badgeColor: "#073c46",
    photo: {
      src: "/events/playtech-showtech/gallery-4.webp",
      alt: "Pengunjung melihat instalasi Infinity Mirror di Showtech",
      position: "70% 50%",
    },
    buttonHref: "/event/playtech-showtech#showtech",
    buttonLabel: "Lihat Detail",
    detailSlug: "playtech-showtech",
  },
  {
    slug: "technology-seminar",
    title: "Technology\nSeminar",
    description:
      "Forum diskusi interaktif yang mempertemukan akademisi, industri, dan generasi muda untuk mengeksplorasi perkembangan teknologi serta dampaknya terhadap kehidupan dan masa depan dunia kerja. Kursi terbatas, 100 peserta per sesi.",
    day: "Sabtu",
    dateLabel: "28 November, 2026",
    date: "2026-11-28",
    location: "CC Timur, ITB",
    badgeColor: "#3c5fb0",
    photo: {
      src: "/events/technology-seminar/hero.webp",
      alt: "Peserta bertanya kepada pembicara di Insight Seminar",
    },
    buttonHref: "/event/technology-seminar",
    buttonLabel: "Lihat Detail",
    detailSlug: "technology-seminar",
  },
  {
    slug: "insight-on-stage",
    title: "Insight\non Stage",
    description:
      "Panggung utama ITB INSIGHT 2026 dengan penampilan band, bintang tamu spesial, serta projection mapping dan light show yang memukau, dari pagi sampai malam. Terbuka untuk umum dan gratis, ajak teman dan keluargamu!",
    day: "Sabtu",
    dateLabel: "28 November, 2026",
    date: "2026-11-28",
    location: "ITB Ganesha",
    badgeColor: "#073c46",
    photo: {
      src: "/events/insight-on-stage/hero.webp",
      alt: "Penonton menyaksikan band di panggung Insight on Stage pada malam hari",
    },
    buttonHref: "/event/insight-on-stage",
    buttonLabel: "Lihat Detail",
    detailSlug: "insight-on-stage",
  },
  {
    slug: "inspirates",
    title: "Inspirates",
    description:
      "Program roadshow ITB Insight 2026 dari mahasiswa Teknik Fisika ITB ke sekolah. Kenali Teknik Fisika, temukan teknologi di sekitarmu, dan coba langsung alat demonstrasi karya mahasiswa.",
    day: "Roadshow",
    // MENUNGGU KONFIRMASI: lembar menulis 2-20 November, jadwal sekolahnya 11-17 November.
    dateLabel: "2–20 November, 2026",
    date: "2026-11-02",
    location: "Bandung",
    badgeColor: "#073c46",
    photo: {
      src: "/events/inspirates/hero.webp",
      alt: "Tim Inspirates berfoto bersama siswa di sekolah",
    },
    buttonHref: "/event/inspirates",
    buttonLabel: "Lihat Detail",
    detailSlug: "inspirates",
  },
  {
    slug: "alumni-gathering",
    title: "Alumni\nGathering",
    description:
      "Alumni Gathering merupakan salah satu kegiatan yang mengundang para alumni agar dapat berinteraksi langsung dengan HMFT-ITB serta prodi untuk mensosialisasikan perkembangan mahasiswa, HMFT-ITB, ITB Insight, dan menjadikan ajang seru-seruan dan reuni antar alumni.",
    day: "Segera",
    dateLabel: "Tanggal menyusul",
    date: null,
    location: "Menyusul",
    badgeColor: "#7b7b7b",
    photo: {
      src: "/events/event-photo.jpg",
      alt: "Dokumentasi kegiatan ITB Insight",
    },
    buttonHref: null,
    buttonLabel: "Coming Soon",
    status: "coming-soon",
  },
];

/*
 * Posisi blok teks dari Figma. Judul satu baris membuat seluruh blok turun
 * 36px agar tetap di tengah secara vertikal, persis seperti frame Figma
 * Play-Tech / Show-Tech / Inspirates. Judul dua baris = frame Insight
 * Festival / Insight on Stage.
 */
const TEXT_Y = {
  1: { title: 326, row: 430, desc: 502, button: 646 },
  2: { title: 291, row: 466, desc: 538, button: 682 },
} as const;

/** Teks di kiri saat foto di kanan, dan sebaliknya (x dari Figma). */
const TEXT_X = { right: 173, left: 879 } as const;
const PHOTO_X = { right: 900, left: 173 } as const;

/*
 * Lebar kotak judul. Baris terpanjang ("Technology") sekitar 600px pada
 * EXCRATCH 64px, jadi 700 aman tanpa pindah baris otomatis. Pindah baris
 * selalu lewat "\n" di judul supaya jumlah barisnya pasti.
 */
const TITLE_W = 700;

function compose(slot: EventSlot, copy: EventCopy): EventItem {
  const lines = copy.title.split("\n").length;
  if (lines !== 1 && lines !== 2) {
    throw new Error(`Judul event "${copy.slug}" harus 1 atau 2 baris.`);
  }
  const y = TEXT_Y[lines];
  const x = TEXT_X[slot.photoSide];
  const box = (by: number, w: number, h: number): Box => ({ x, y: by, w, h });

  return {
    ...slot,
    ...copy,
    badgeOpacity: 0.73,
    titleBox: box(y.title, TITLE_W, lines * 80),
    rowBox: box(y.row, 676, 48),
    descBox: box(y.desc, 676, 120),
    buttonBox: box(y.button, 256, 52),
    photoBox: { x: PHOTO_X[slot.photoSide], y: 272, w: 655, h: 480 },
  };
}

export async function getEvents(): Promise<EventItem[]> {
  if (EVENT_COPY.length > LAYOUT_SLOTS.length) {
    throw new Error("Event lebih banyak dari slot tata letak. Tambah slot di layoutSlots.ts.");
  }
  return EVENT_COPY.map((copy, i) => compose(LAYOUT_SLOTS[i], copy));
}
