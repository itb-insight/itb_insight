import "server-only";
import type { Competition } from "@/features/competition/types";

/**
 * LAPISAN DATA-FETCHING
 * --------------------------------------------------------------
 * Isi di bawah disalin PERSIS dari Figma (page Hi-Fi > Section 4,
 * frame "iPhone SAR / MO / BPC / OE Mobile") lewat Figma REST API.
 *
 * Kalau nanti pindah ke CMS/API, ganti isi fungsi di bawah jadi fetch()
 * dengan opsi next: { revalidate: 3600, tags: [...] }.
 * Komponennya tidak perlu diubah sama sekali.
 *
 * Catatan: biaya & prizepool di Figma masih placeholder "IDR 000.000",
 * jadi di sini nilainya 0 — ganti begitu angkanya final.
 */

const DATA: Competition[] = [
  {
    slug: "safety-and-rescue-robot-competition",
    title: "Safety and Rescue Robot Competition",
    description:
      "Lomba robot Search and Rescue (SAR) ITB Insight 2026 adalah ajang kompetisi nasional bagi mahasiswa/i di Indonesia yang bertujuan mengembangkan kreativitas dalam menjawab permasalahan dunia nyata yang membutuhkan solusi berbasis teknologi. Kompetisi ini dilaksanakan melalui tiga tahap, yaitu tahap pendaftaran, tahap implementasi, dan tahap final.",
    iconSrc: "/assets/icon-sar.png",
    titleFrom: "#ffe4ec",
    titleTo: "#ffaaaa",
    accentFrom: "#ffe4ec",
    accentTo: "#ffaaaa",
    heroIconY: 217,
    heroTitleY: 421,
    heroDescY: 505,
    timelineTitleY: 2272,
    timelineTextY: 2342,
    timelineDotX: 68,
    iconWidth: 146,
    iconHeight: 172,
    registrationDeadline: null,
    registrationFee: 0,
    prizePool: 0,
    syllabusUrl: "#",
    guidebookUrl: "#",
    contactUrl: "#",
    registerUrl: "#",
    timeline: [
      { id: "pendaftaran", title: "Pendaftaran", dateLabel: "14 Agustus - 6 September 2026", date: "2026-08-14" },
      { id: "pengumuman-penyisihan", title: "Pengumuman Penyisihan", dateLabel: "19 Oktober 2026", date: "2026-10-19" },
      { id: "technical-meeting", title: "Technical Meeting", dateLabel: "14 November 2026", date: "2026-11-14" },
      { id: "semifinal", title: "Semifinal", dateLabel: "27 November 2026", date: "2026-11-27" },
      { id: "final", title: "Final", dateLabel: "28 November 2026", date: "2026-11-28" },
      { id: "awarding", title: "Awarding", dateLabel: "28 November 2026", date: "2026-11-28" },
    ],
    seo: {
      metaTitle: "Safety and Rescue Robot Competition",
      metaDescription:
        "Kompetisi robot Search and Rescue nasional ITB Insight 2026 untuk mahasiswa se-Indonesia. Pendaftaran 14 Agustus - 6 September 2026.",
      ogImage: "/assets/og-sar.png",
      keywords: ["lomba robot", "search and rescue", "SAR robot", "ITB Insight 2026", "kompetisi mahasiswa"],
    },
  },
  {
    slug: "microdrone-obstacle-race",
    title: "Microdrone Obstacle Race",
    description:
      "Lomba Drone Obstacle adalah ajang kompetisi nasional bagi mahasiswa/i Indonesia yang bertujuan mengembangkan kreativitas dalam menjawab permasalahan dunia nyata yang membutuhkan solusi berbasis teknologi. Kompetisi ini dilaksanakan selama dua hari, hari pertama merupakan babak penyisihan, hari kedua merupakan babak eliminasi hingga terdapat juara 1, 2, dan 3.",
    iconSrc: "/assets/icon-mo.png",
    titleFrom: "#c08cff",
    titleTo: "#e9dbf9",
    accentFrom: "#c08cff",
    accentTo: "#e9dbf9",
    heroIconY: 221,
    heroTitleY: 437,
    heroDescY: 487,
    timelineTitleY: 2265,
    timelineTextY: 2335,
    timelineDotX: 68,
    iconWidth: 292,
    iconHeight: 184,
    registrationDeadline: null,
    registrationFee: 0,
    prizePool: 0,
    syllabusUrl: "#",
    guidebookUrl: "#",
    contactUrl: "#",
    registerUrl: "#",
    timeline: [
      { id: "pendaftaran", title: "Pendaftaran", dateLabel: "14 Agustus - 20 November 2026", date: "2026-08-14" },
      { id: "technical-meeting", title: "Technical Meeting", dateLabel: "21 November 2026", date: "2026-11-21" },
      { id: "penyisihan", title: "Penyisihan", dateLabel: "2026", date: "2026-11-22" },
      { id: "pengumuman-penyisihan", title: "Pengumuman Penyisihan", dateLabel: "2026", date: "2026-11-24" },
      { id: "semifinal", title: "Semifinal", dateLabel: "27 November 2026", date: "2026-11-27" },
      { id: "final", title: "Final", dateLabel: "28 November 2026", date: "2026-11-28" },
      { id: "awarding", title: "Awarding", dateLabel: "2026", date: "2026-11-28" },
    ],
    seo: {
      metaTitle: "Microdrone Obstacle Race",
      metaDescription:
        "Balap drone obstacle nasional ITB Insight 2026 untuk mahasiswa se-Indonesia. Dua hari: babak penyisihan dan eliminasi hingga juara 1, 2, dan 3.",
      ogImage: "/assets/og-mo.png",
      keywords: ["lomba drone", "drone race", "microdrone", "ITB Insight 2026", "obstacle race"],
    },
  },
  {
    slug: "business-plan-competition",
    title: "Business Plan Competition",
    description:
      "Business Plan Competition (BPC) ITB INSIGHT 2026 merupakan kompetisi nasional di bidang inovasi bisnis yang mengangkat tema pengaplikasian Artificial Intelligence (AI) yang ditujukan bagi mahasiswa (D3/D4/S1) dan siswa SMA/SMK/MA sederajat. Kompetisi ini dirancang sebagai wadah pengembangan generasi muda dalam menciptakan solusi bisnis yang inovatif, adaptif, dan berdaya saing melalui pemanfaatan teknologi AI, melalui tahapan BMC, proposal dan MVP, hingga final pitching",
    iconSrc: "/assets/icon-bpc.png",
    titleFrom: "#d0ffc7",
    titleTo: "#76df62",
    accentFrom: "#d0ffc7",
    accentTo: "#76df62",
    heroIconY: 214,
    heroTitleY: 401,
    heroDescY: 451,
    timelineTitleY: 2262,
    timelineTextY: 2332,
    timelineDotX: 52,
    iconWidth: 172,
    iconHeight: 155,
    registrationDeadline: null,
    registrationFee: 0,
    prizePool: 0,
    syllabusUrl: "#",
    guidebookUrl: "#",
    contactUrl: "#",
    registerUrl: "#",
    timeline: [
      { id: "registration", title: "Registration", dateLabel: "20 Agustus - 18 September 2026", date: "2026-08-20" },
      { id: "case-release", title: "Pre-Elim: Case Release", dateLabel: "25 September 2026", date: "2026-09-25" },
      { id: "bmc", title: "Pengumpulan Pre-Elim: BMC", dateLabel: "8 Oktober 2026", date: "2026-10-08" },
      { id: "semifinal", title: "Semifinal", dateLabel: "15 - 29 Oktober 2026", date: "2026-10-15" },
      { id: "final", title: "Final", dateLabel: "5 - 22 November 2026", date: "2026-11-05" },
      { id: "pitching", title: "Pitching", dateLabel: "26 November 2026", date: "2026-11-26" },
      { id: "awarding", title: "Awarding", dateLabel: "26 November 2026", date: "2026-11-26" },
    ],
    seo: {
      metaTitle: "Business Plan Competition",
      metaDescription:
        "Kompetisi inovasi bisnis nasional bertema Artificial Intelligence untuk mahasiswa dan siswa SMA/SMK/MA. Registrasi 20 Agustus - 18 September 2026.",
      ogImage: "/assets/og-bpc.png",
      keywords: ["business plan competition", "BPC", "lomba bisnis", "AI", "ITB Insight 2026"],
    },
  },
  {
    slug: "olimpiade-engineering",
    title: "Olimpiade Engineering",
    description:
      "Kompetisi berbasis olimpiade untuk siswa SMA/SMK/MA/sederajat di seluruh Indonesia dengan tujuan mengenal dunia engineering di perguruan tinggi.",
    iconSrc: "/assets/icon-oe.png",
    titleFrom: "#dee8fb",
    titleTo: "#acc7ff",
    accentFrom: "#acc7ff",
    accentTo: "#517eda",
    heroIconY: 307,
    heroTitleY: 509,
    heroDescY: 559,
    timelineTitleY: 2267,
    timelineTextY: 2337,
    timelineDotX: 98,
    iconWidth: 172,
    iconHeight: 170,
    registrationDeadline: null,
    registrationFee: 0,
    prizePool: 0,
    syllabusUrl: "#",
    guidebookUrl: "#",
    contactUrl: "#",
    registerUrl: "#",
    timeline: [
      { id: "registration", title: "Registration", dateLabel: "22 Agustus 2026", date: "2026-08-22" },
      { id: "try-out", title: "Try Out", dateLabel: "2026", date: "2026-09-01" },
      { id: "technical-meeting", title: "Technical Meeting", dateLabel: "2026", date: "2026-10-01" },
      { id: "pre-elim", title: "Pre-Elim", dateLabel: "2026", date: "2026-11-01" },
      { id: "semifinal", title: "Semifinal", dateLabel: "27 November 2026", date: "2026-11-27" },
      { id: "final", title: "Final", dateLabel: "28 November 2026", date: "2026-11-28" },
      { id: "awarding", title: "Awarding", dateLabel: "28 November 2026", date: "2026-11-28" },
    ],
    seo: {
      metaTitle: "Olimpiade Engineering",
      metaDescription:
        "Olimpiade engineering nasional untuk siswa SMA/SMK/MA sederajat se-Indonesia. Kenali dunia engineering di perguruan tinggi bersama ITB Insight 2026.",
      ogImage: "/assets/og-oe.png",
      keywords: ["olimpiade engineering", "lomba SMA", "olimpiade teknik", "ITB Insight 2026"],
    },
  },
];

export async function getCompetitionSlugs(): Promise<string[]> {
  return DATA.map((c) => c.slug);
}

export async function getCompetition(slug: string): Promise<Competition | null> {
  return DATA.find((c) => c.slug === slug) ?? null;
}

export async function getAllCompetitions(): Promise<Competition[]> {
  return DATA;
}
