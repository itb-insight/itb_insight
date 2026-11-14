import "server-only";
import type { Competition } from "@/features/competition/types";

/**
 * LAPISAN DATA-FETCHING
 * --------------------------------------------------------------
 * Tampilan (koordinat, warna, ikon) disalin dari Figma (page Hi-Fi >
 * Section 4, frame "iPhone SAR / MO / BPC / OE Mobile") lewat Figma REST API.
 *
 * Isi (deskripsi, biaya, hadiah, timeline, persyaratan) berasal dari
 * docs/references/competition/Form Informasi Competition ITB Insight.pdf,
 * yang diisi tiap divisi lomba. Data yang di form-nya sendiri bertentangan
 * ditandai MENUNGGU KONFIRMASI; nilai di sini adalah usulan sementara.
 *
 * Tautan yang di form masih "TBA"/kosong (silabus, guidebook, kontak)
 * bernilai null, dan tombolnya disembunyikan sampai tautannya ada.
 *
 * Kalau nanti pindah ke CMS/API, ganti isi fungsi di bawah jadi fetch()
 * dengan opsi next: { revalidate: 3600, tags: [...] }.
 * Komponennya tidak perlu diubah sama sekali.
 */

/**
 * SAR disembunyikan sejak commit bb63fdf (juga di /competition). Datanya
 * tetap dijaga sesuai form supaya siap ditampilkan: cukup masukkan SAR ke
 * DATA di bawah.
 */
const SAR: Competition = {
  slug: "safety-and-rescue-robot-competition",
  code: "SAR",
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
  registration: { opens: "2026-08-14T00:00:00+07:00", closes: "2026-09-06T23:59:59+07:00" },
  finalCountdown: { date: "2026-11-28T00:00:00+07:00", title: ["Countdown", "to final"] },
  fees: [{ amount: 100000, unit: "Per tim" }],
  prize: { amount: null, fallback: "Uang Tunai" },
  // Form: "guidebook insight challenge", tanpa tautan.
  syllabusUrl: null,
  guidebookUrl: null,
  contactUrl: null,
  registerUrl: null,
  timeline: [
    { id: "pendaftaran", title: "Pendaftaran", dateLabel: "14 Agustus – 6 September 2026", date: "2026-08-14" },
    { id: "laporan-video", title: "Pengumpulan Laporan & Video", dateLabel: "6 September – 10 Oktober 2026", date: "2026-09-06" },
    { id: "pengumuman-penyisihan", title: "Pengumuman Penyisihan", dateLabel: "19 Oktober 2026", date: "2026-10-19" },
    { id: "technical-meeting", title: "Technical Meeting", dateLabel: "14 November 2026", date: "2026-11-14" },
    { id: "semifinal", title: "Semifinal", dateLabel: "27 November 2026", date: "2026-11-27" },
    { id: "final", title: "Final & Awarding", dateLabel: "28 November 2026", date: "2026-11-28" },
  ],
  info: {
    facts: [
      { label: "Format", value: "Tim 3–5 orang dan 1 pembimbing" },
      // MENUNGGU KONFIRMASI: ketentuan tambahan di form menyebut S1 saja.
      { label: "Peserta", value: "Mahasiswa aktif S1, D3, dan D4 anggota UKM Robotika" },
      { label: "Cakupan", value: "Perguruan tinggi negeri dan swasta se-Indonesia" },
      { label: "Kuota", value: "50 tim" },
      { label: "Bahasa", value: "Indonesia" },
      { label: "Lokasi semifinal & final", value: "Gedung CRCS, ITB" },
    ],
    requirements: [
      "Mahasiswa aktif jenjang S1, D3, atau D4 dari perguruan tinggi negeri dan swasta di Indonesia.",
      "Anggota Unit Kegiatan Mahasiswa Robotika di universitas masing-masing.",
      "Setiap anggota tim wajib membuat akun individu di website resmi ITB INSIGHT 2026.",
      "Setiap orang hanya boleh terdaftar di satu tim, baik di lomba yang sama maupun lomba lain di ITB Insight 2026.",
    ],
    documents: [
      "Biodata ketua dan anggota (diisi saat membuat akun): nama, NIM, asal daerah, tanggal lahir, domisili, email, perguruan tinggi, fakultas, dan jurusan.",
      "Kartu tanda mahasiswa dalam format PDF.",
      "Data pembimbing: nama, NIDN, asal daerah, tanggal lahir, domisili, email, perguruan tinggi, fakultas, dan jurusan.",
      "Pakta integritas, dikumpulkan saat tahap implementasi.",
    ],
    stageFiles: [
      { stage: "Penyisihan", files: "Laporan Testing Prototipe", deadline: "10 Oktober 2026" },
      { stage: "Penyisihan", files: "Video Testing Prototipe", deadline: "10 Oktober 2026" },
    ],
  },
  desktop: {
    logoSrc: "/images/sar_logo.png",
    logoWidth: 256,
    heroMaxWidth: 1100,
    titleFrom: "#DEE8FB",
    titleTo: "#FFAAAA",
    timelineFrom: "#FFE4EC",
    timelineTo: "#FFAAAA",
  },
  seo: {
    metaTitle: "Safety and Rescue Robot Competition",
    metaDescription:
      "Kompetisi robot Search and Rescue nasional ITB Insight 2026 untuk tim mahasiswa anggota UKM Robotika. Semifinal 27 dan final 28 November 2026 di Gedung CRCS ITB.",
    ogImage: "/assets/og-sar.png",
    keywords: ["lomba robot", "search and rescue", "SAR robot", "ITB Insight 2026", "kompetisi mahasiswa"],
  },
};

const DATA: Competition[] = [
  {
    // Slug tetap "microdrone-obstacle-race" walau namanya berganti: baris
    // pendaftaran di database dicocokkan lewat slug (src/lib/competitions.ts).
    slug: "microdrone-obstacle-race",
    code: "MOR",
    // Dulu "Microdrone Obstacle Race" (nama di Form Informasi Competition).
    // Detail di bawah masih dari form Microdrone; cek ulang untuk Drone Soccer.
    title: "Drone Soccer Competition",
    // MENUNGGU KONFIRMASI: deskripsi asli di form menyebut "bagi mahasiswa/i
    // Indonesia", padahal syarat peserta di form yang sama adalah usia di atas
    // 10 tahun (remaja dan dewasa). Kalimat itu disesuaikan dengan syaratnya.
    description:
      "Drone Soccer Competition adalah ajang kompetisi nasional bagi remaja dan dewasa di seluruh Indonesia yang bertujuan mengembangkan kreativitas dalam menjawab permasalahan dunia nyata yang membutuhkan solusi berbasis teknologi. Kompetisi ini dilaksanakan selama dua hari: hari pertama babak penyisihan, hari kedua babak eliminasi hingga terdapat juara 1, 2, dan 3.",
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
    registration: { opens: "2026-08-14T00:00:00+07:00", closes: "2026-11-20T23:59:59+07:00" },
    finalCountdown: { date: "2026-11-28T00:00:00+07:00", title: ["Countdown", "to final"] },
    fees: [{ amount: 30000, unit: "Per orang" }],
    // Form: "Bilang aja nanti dapat uang tunai" (nominal belum diumumkan).
    // Sumber: https://www.instagram.com/p/DfhY5W-Egop/?img_index=7
    prize: { amount: 3500000, extras: ["Drone"] },
    syllabusUrl: null,
    guidebookUrl: "https://drive.google.com/drive/u/1/folders/1SKr9u65kIKXhF3G0n83lEq4FA8WKGK7G",
    // Dua narahubung, jadi Contact Us menggulir ke bagian Kontak di halaman.
    contactUrl: "#kontak",
    registerUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLScBs4oDRG4cpPnsNYs1pRUcNY6hGmdjhrHN93Z2XDf4qz166A/viewform",
    timeline: [
      { id: "pendaftaran", title: "Pendaftaran", dateLabel: "14 Agustus – 20 November 2026", date: "2026-08-14" },
      { id: "technical-meeting", title: "Technical Meeting", dateLabel: "21 November 2026", date: "2026-11-21" },
      { id: "semifinal", title: "Semifinal", dateLabel: "27 November 2026", date: "2026-11-27" },
      { id: "final", title: "Final", dateLabel: "28 November 2026", date: "2026-11-28" },
    ],
    info: {
      facts: [
        { label: "Format", value: "Individu" },
        { label: "Peserta", value: "Usia di atas 10 tahun, remaja dan dewasa" },
        { label: "Cakupan", value: "Seluruh Indonesia" },
        { label: "Kuota", value: "100 peserta" },
        { label: "Bahasa", value: "Indonesia" },
        { label: "Lokasi semifinal & final", value: "Aula Barat, ITB" },
      ],
      contacts: [
        { name: "Devan", line: "devanaqila", whatsapp: "081380181827" },
        { name: "Jericko", line: "xeonium", whatsapp: "085155449094" },
      ],
      topics: {
        title: "Spesifikasi drone",
        intro: "Drone yang boleh digunakan:",
        items: ["DJI Tello EDU", "DJI Tello (standar)"],
      },
      requirements: [
        "Berusia di atas 10 tahun.",
        "Berasal dari seluruh Indonesia.",
        "Mendaftar secara individu, satu orang satu pendaftaran.",
        "Menunjukkan KTP atau kartu pelajar sebagai bukti identitas.",
      ],
      documents: [
        "Biodata peserta: nama, asal daerah, tanggal lahir, domisili, email, dan nomor HP/WhatsApp.",
        "KTP atau kartu pelajar dalam format PDF.",
        "Surat pernyataan peserta.",
      ],
    },
    desktop: {
      logoSrc: "/images/mor.png",
      logoWidth: 350,
      heroMaxWidth: 1400,
      titleFrom: "#ACC7FF",
      titleTo: "#C08CFF",
      timelineFrom: "#C08CFF",
      timelineTo: "#E9DBF9",
    },
    seo: {
      metaTitle: "Drone Soccer Competition",
      metaDescription:
        "Drone Soccer Competition ITB Insight 2026: lomba drone untuk peserta berusia di atas 10 tahun se-Indonesia, hadiah Rp3.500.000 dan drone. Daftar sampai 20 November 2026, final 28 November di Aula Barat ITB.",
      ogImage: "/assets/og-mo.png",
      keywords: ["lomba drone", "drone soccer", "DJI Tello", "ITB Insight 2026", "kompetisi drone"],
    },
  },
  {
    slug: "business-plan-competition",
    code: "BPC",
    title: "Business Plan Competition",
    description:
      "Business Plan Competition (BPC) ITB INSIGHT 2026 merupakan kompetisi nasional di bidang inovasi bisnis yang mengangkat tema pengaplikasian Artificial Intelligence (AI) yang ditujukan bagi mahasiswa (D3/D4/S1) dan siswa SMA/SMK/MA sederajat. Kompetisi ini dirancang sebagai wadah pengembangan generasi muda dalam menciptakan solusi bisnis yang inovatif, adaptif, dan berdaya saing melalui pemanfaatan teknologi AI, melalui tahapan BMC, proposal dan MVP, hingga final pitching.",
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
    registration: { opens: "2026-08-20T00:00:00+07:00", closes: "2026-09-24T23:59:59+07:00" },
    finalCountdown: { date: "2026-11-26T00:00:00+07:00", title: ["Countdown", "to pitching"] },
    fees: [
      { label: "Early Bird", amount: 135000, unit: "Per tim", periodLabel: "20 – 31 Agustus 2026" },
      { label: "Normal", amount: 150000, unit: "Per tim", periodLabel: "1 – 18 September 2026" },
      { label: "Extended", amount: 200000, unit: "Per tim", periodLabel: "19 – 24 September 2026" },
    ],
    // Sumber: https://www.instagram.com/p/DdoQocPklEb/?img_index=6
    // (form menulis Rp15.800.000; postingan resmi Rp20.000.000)
    prize: { amount: 20000000 },
    syllabusUrl: null,
    guidebookUrl: null,
    contactUrl: "https://wa.me/6281343256927",
    registerUrl: null,
    // Maksimal 8 item: kanvas mobile punya ruang tetap sampai tombol di y=3126.
    timeline: [
      { id: "registration", title: "Registration", dateLabel: "20 Agustus – 24 September 2026", date: "2026-08-20" },
      { id: "case-release", title: "Pre-Elim: Case Release", dateLabel: "25 September 2026", date: "2026-09-25" },
      { id: "bmc", title: "Pengumpulan Pre-Elim: BMC", dateLabel: "8 Oktober 2026", date: "2026-10-08" },
      { id: "pengumuman-pre-elim", title: "Pengumuman Pre-Elim", dateLabel: "15 Oktober 2026", date: "2026-10-15" },
      { id: "semifinal", title: "Semifinal: Proposal", dateLabel: "15 – 29 Oktober 2026", date: "2026-10-15" },
      // Form: "Info awal 7 Oktober; perlu koreksi karena sebelum deadline proposal".
      { id: "pengumuman-semifinal", title: "Pengumuman Semifinal", dateLabel: "5 November 2026", date: "2026-11-05" },
      { id: "final", title: "Final: Pitch Deck & MVP", dateLabel: "5 – 22 November 2026", date: "2026-11-05" },
      { id: "pitching", title: "Pitching & Awarding", dateLabel: "26 November 2026", date: "2026-11-26" },
    ],
    info: {
      facts: [
        { label: "Format", value: "Tim 2–3 orang dari institusi yang sama" },
        { label: "Peserta", value: "Mahasiswa D3/D4/S1 dan siswa SMA/SMK/MA sederajat" },
        { label: "Cakupan", value: "Seluruh Indonesia" },
        { label: "Bahasa", value: "Indonesia" },
        { label: "Lokasi final", value: "Ruang Seminar III Labtek VI, Kampus ITB Ganesha" },
      ],
      topics: {
        title: "Tema",
        intro:
          "Grand Theme: “AI Beyond Frontiers: Architecting Sustainable and Human-Centered Solutions for the Future of Industry”, dengan lima subtema:",
        items: [
          "AI for Health and Individual Resilience",
          "AI for Green Energy and Circular Economy",
          "Human-AI Synergy in Smart Operations",
          "AI-Powered Inclusive Infrastructure and Logistics",
          "AI Software as a Service (SaaS) for Industry Acceleration",
        ],
      },
      requirements: [
        "Mahasiswa aktif D3, D4, atau S1 (perguruan tinggi negeri/swasta), atau siswa aktif SMA/SMK/MA sederajat, dengan KTM/kartu pelajar yang masih berlaku.",
        "Mendaftar sebagai tim berisi 2–3 orang dari institusi yang sama (boleh beda angkatan, prodi, departemen, atau fakultas).",
        "Satu orang hanya boleh terdaftar di satu tim.",
        "Nama tim bebas, asal tidak mengandung SARA, pornografi, atau topik sensitif.",
        "Satu karya per tim di setiap tahap, dan anggota tim tidak boleh diganti selama kompetisi.",
        "Karya orisinal: belum pernah dilombakan, dipublikasikan, atau memenangkan penghargaan.",
        "Lampirkan Surat Pernyataan Orisinalitas Karya (template panitia) di setiap tahap.",
      ],
      documents: [
        "Biodata ketua dan anggota, diisi di formulir pendaftaran.",
        "Nama perguruan tinggi atau sekolah.",
        "KTM/kartu pelajar yang masih berlaku, atau surat keterangan aktif bila tidak ada.",
        "Bukti pembayaran yang valid (transfer bank/QRIS). Biaya tidak dapat dikembalikan.",
        "Bukti media sosial tiap anggota: follow @itbinsight, posting twibbon BPC dan tag 3 teman, repost poster BPC di Instagram Story dengan tag @itbinsight, serta tag 3 teman atau lebih di kolom komentar postingan BPC. Akun Instagram harus publik; gabungkan berkas semua anggota dalam satu PDF.",
      ],
      stageFiles: [
        { stage: "Pendaftaran", files: "Bukti pembayaran dan bukti media sosial", deadline: "24 September 2026" },
        { stage: "Pre-Elim", files: "Business Model Canvas (BMC)", deadline: "8 Oktober 2026" },
        { stage: "Semifinal", files: "Proposal", deadline: "29 Oktober 2026" },
        { stage: "Final", files: "Pitch Deck & Minimum Viable Product (MVP)", deadline: "20 November 2026" },
        { stage: "Pitching", files: "Presentasi", deadline: "22 November 2026" },
      ],
    },
    desktop: {
      logoSrc: "/images/bpc.png",
      logoWidth: 350,
      heroMaxWidth: 1400,
      titleFrom: "#DEE8FB",
      titleTo: "#6CCB59",
      timelineFrom: "#DEE8FB",
      timelineTo: "#6CCB59",
      descriptionLines: [
        "Business Plan Competition (BPC) ITB INSIGHT 2026 merupakan kompetisi nasional di bidang inovasi bisnis yang mengangkat",
        "tema pengaplikasian Artificial Intelligence (AI) yang ditujukan bagi mahasiswa (D3/D4/S1) dan siswa SMA/SMK/MA sederajat.",
        "Kompetisi ini dirancang sebagai wadah pengembangan generasi muda dalam menciptakan solusi bisnis yang inovatif, adaptif, dan",
        "berdaya saing melalui pemanfaatan teknologi AI, melalui tahapan BMC, proposal dan MVP, hingga final pitching.",
      ],
    },
    seo: {
      metaTitle: "Business Plan Competition",
      metaDescription:
        "Business Plan Competition ITB Insight 2026: kompetisi rencana bisnis berbasis AI untuk mahasiswa D3/D4/S1 dan siswa SMA/SMK/MA. Total hadiah Rp20.000.000, final pitching 26 November 2026 di ITB.",
      ogImage: "/assets/og-bpc.png",
      keywords: ["business plan competition", "BPC", "lomba bisnis", "AI", "ITB Insight 2026"],
    },
  },
  {
    slug: "olimpiade-engineering",
    code: "OE",
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
    // MENUNGGU KONFIRMASI: pendaftaran dibuka 22 Agustus, tapi gelombang
    // Early Bird baru mulai 29 Agustus.
    registration: { opens: "2026-08-22T00:00:00+07:00", closes: "2026-10-20T23:59:00+07:00" },
    finalCountdown: { date: "2026-11-28T00:00:00+07:00", title: ["Countdown", "to final"] },
    // Batas antar gelombang di form saling tumpang tindih (20 September dan
    // 1 Oktober masing-masing muncul di dua gelombang). Ditulis apa adanya.
    fees: [
      { label: "Early Bird", amount: 120000, unit: "Per tim", periodLabel: "29 Agustus – 20 September 2026" },
      { label: "Normal", amount: 140000, unit: "Per tim", periodLabel: "20 September – 1 Oktober 2026" },
      { label: "Extended", amount: 160000, unit: "Per tim", periodLabel: "1 – 20 Oktober 2026" },
    ],
    // Sumber: https://www.instagram.com/p/DciJrY5ElAS/?img_index=4
    prize: { amount: 10000000, extras: ["Laptop"] },
    syllabusUrl: null,
    guidebookUrl: null,
    contactUrl: "https://wa.me/6281343256927",
    registerUrl: null,
    // Try Out, Technical Meeting, dan Pre-Elim masih kosong di form, jadi
    // belum ditampilkan.
    timeline: [
      { id: "registration", title: "Registration", dateLabel: "22 Agustus – 20 Oktober 2026", date: "2026-08-22" },
      { id: "semifinal", title: "Semifinal", dateLabel: "27 November 2026", date: "2026-11-27" },
      { id: "final", title: "Final & Awarding", dateLabel: "28 November 2026", date: "2026-11-28" },
    ],
    info: {
      facts: [
        { label: "Format", value: "Tim 3 siswa dan 1 guru pembimbing" },
        { label: "Peserta", value: "Siswa aktif SMA/SMK/MA sederajat, negeri dan swasta" },
        { label: "Cakupan", value: "Seluruh Indonesia" },
        { label: "Kuota", value: "Tidak terbatas" },
        { label: "Bahasa", value: "Indonesia" },
        { label: "Lokasi semifinal & final", value: "Kampus ITB Ganesha" },
      ],
      topics: {
        title: "Bidang lomba",
        intro: "Materi mengikuti silabus resmi dari panitia, meliputi:",
        items: [
          "Matematika",
          "Fisika",
          "Kimia",
          "Rekayasa Elektronika",
          "Rekayasa Material",
          "Rekayasa Bangunan",
          "Rekayasa Energi",
        ],
      },
      requirements: [
        "Siswa aktif SMA/SMK/MA sederajat, negeri atau swasta, dari seluruh Indonesia.",
        "Mendaftar sebagai tim berisi 3 siswa.",
        "Didampingi satu guru pembimbing yang merupakan guru aktif di sekolah yang sama.",
        "Mempelajari seluruh materi yang tercantum di silabus resmi.",
        "Aturan lengkap tertera di buku aturan dalam guidebook.",
      ],
      documents: [
        "Biodata tiap anggota: nama, sekolah asal, NISN, foto diri, foto kartu pelajar, email, dan Instagram.",
        "Kartu pelajar, atau surat keterangan siswa aktif bertanda tangan kepala sekolah bila tidak ada.",
        "Data guru pembimbing: nama dan NUPTK.",
        "Pakta integritas (tersedia di guidebook).",
      ],
    },
    desktop: {
      logoSrc: "/images/oe.png",
      logoWidth: 350,
      heroMaxWidth: 1400,
      titleFrom: "#DEE8FB",
      titleTo: "#ACC7FF",
      timelineFrom: "#DEE8FB",
      timelineTo: "#ACC7FF",
      descriptionLines: [
        "Kompetisi berbasis olimpiade untuk siswa SMA/SMK/MA/sederajat di seluruh Indonesia dengan tujuan mengenal dunia",
        "engineering di perguruan tinggi.",
      ],
    },
    seo: {
      metaTitle: "Olimpiade Engineering",
      metaDescription:
        "Olimpiade Engineering ITB Insight 2026: olimpiade beregu 3 siswa SMA/SMK/MA sederajat se-Indonesia. Hadiah Rp10.000.000 dan laptop. Semifinal 27 dan final 28 November 2026 di Kampus ITB Ganesha.",
      ogImage: "/assets/og-oe.png",
      keywords: ["olimpiade engineering", "lomba SMA", "olimpiade teknik", "ITB Insight 2026"],
    },
  },
];

/** Lomba yang datanya siap tapi belum ditampilkan. Lihat catatan di SAR. */
export const HIDDEN_COMPETITIONS: Competition[] = [SAR];

export async function getCompetitionSlugs(): Promise<string[]> {
  return DATA.map((c) => c.slug);
}

export async function getCompetition(slug: string): Promise<Competition | null> {
  return DATA.find((c) => c.slug === slug) ?? null;
}

export async function getAllCompetitions(): Promise<Competition[]> {
  return DATA;
}
