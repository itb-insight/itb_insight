import "server-only";
import type { EventDetail } from "@/features/events/types";

/**
 * Isi halaman detail /event/[slug].
 *
 * Sumber: lembar copywriting tiap divisi di docs/references/event/
 * (CPWR_*.pdf, versi 8-9 November 2026). Teks disalin dari lembar, dengan
 * perbaikan typo dan penyeragaman ("anda" -> "kamu", "FREE" -> "Gratis").
 * Lembar Tech-Xhibition ditulis dalam bahasa Inggris dan diterjemahkan.
 *
 * Bagian yang ditandai MENUNGGU KONFIRMASI berisi data yang bertentangan di
 * lembarnya sendiri. Nilai di sini adalah usulan sementara; ganti begitu
 * divisi terkait mengonfirmasi.
 *
 * Field "[isi di sini]" yang masih kosong di lembar (gamifikasi, check-in
 * Exhibition/PTST, teks pengingat) sengaja tidak ditampilkan.
 *
 * Foto: public/events/<slug>/, versi web (sisi terpanjang <= 2400px) dari
 * docs/references/event/<divisi>/images/.
 */

const img = (slug: string, name: string) => `/events/${slug}/${name}.webp`;

const DETAILS: EventDetail[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "tech-xhibition",
    name: "Tech-Xhibition",
    tagline: "Where Technology Comes Alive",
    summary:
      "Lebih dari sekadar melihat, saatnya berinteraksi dengan teknologi! Tech-Xhibition menampilkan produk dan prototipe inovatif lewat demonstrasi langsung dan pengalaman interaktif bersama para exhibitor.",
    aboutTitle: "Pameran yang bisa kamu coba",
    about: [
      "Tech-Xhibition adalah ruang eksplorasi teknologi yang mempertemukan perusahaan, institusi, komunitas, dan pengunjung lewat pengalaman pameran yang interaktif. Terinspirasi dari tema Beyond Frontiers: Technology for a Sustainable and Human-Centered Future, pameran ini menampilkan beragam produk, prototipe, dan solusi teknologi dari berbagai bidang.",
      "Pengunjung bisa menjelajahi teknologi yang sedang dikembangkan, menyaksikan demonstrasi produk, dan berinteraksi langsung dengan para exhibitor. Tech-Xhibition jadi kesempatan untuk memahami penerapan teknologi di dunia nyata, sekaligus bertukar pengetahuan antara inovator, pelaku industri, dan masyarakat.",
    ],
    accent: "#ff9e94",
    startDate: "2026-11-28T08:40:00+07:00",
    endDate: "2026-11-28T14:10:00+07:00",
    facts: {
      date: "Sabtu, 28 November 2026",
      time: "08.40 – 14.10 WIB",
      venue: "Area Parkir Labtek V, Kampus ITB Ganesha, Bandung",
      audience: "Mahasiswa, pelajar, masyarakat umum, alumni, dan seluruh pengunjung ITB INSIGHT 2026",
      ticket: "Gratis",
      registration: "Tidak perlu. Langsung datang ke area Tech-Xhibition.",
    },
    hero: {
      src: img("tech-xhibition", "highlight-1"),
      alt: "Pengunjung memadati jalan utama Kampus ITB Ganesha saat ITB Insight",
    },
    aboutImage: {
      src: img("tech-xhibition", "gallery-1"),
      alt: "Pengunjung mencoba demo di booth exhibitor",
    },
    ogImage: "/events/tech-xhibition/og.jpg",
    ctas: [
      { label: "Buka Peta", href: "/event-map" },
      { label: "Panduan Pengunjung", href: "#info" },
    ],
    highlightsTitle: "Yang bisa kamu lakukan",
    highlights: [
      { text: "Jelajahi berbagai inovasi dan teknologi terbaru dari exhibitor." },
      { text: "Lihat langsung produk, prototipe, dan solusi teknologi yang dipamerkan." },
      { text: "Coba pengalaman interaktif lewat demonstrasi teknologi secara langsung." },
      { text: "Kenali inovasi dari perusahaan, startup, komunitas, dan institusi pendidikan." },
      { text: "Temukan inspirasi teknologi untuk masa depan yang berkelanjutan dan berpusat pada manusia." },
    ],
    rundown: {
      title: "Rangkaian acara",
      groups: [
        {
          items: [
            { time: "08.40 – 08.45", title: "Open gate", note: "Pengunjung mulai memasuki area pameran dan mengunjungi booth exhibitor." },
            { time: "08.45 – 13.55", title: "Tech-Xhibition berlangsung", note: "Jelajahi booth, lihat inovasi, coba teknologi, dan ngobrol dengan exhibitor." },
            { time: "13.55 – 14.10", title: "Close gate", note: "Seluruh rangkaian Tech-Xhibition untuk pengunjung selesai." },
          ],
        },
      ],
    },
    bring: ["QR code pengunjung, kalau kamu mau masuk top leaderboard pengunjung dan dapat hadiahnya!"],
    rules: [
      "Jaga ketertiban dan kebersihan selama berada di area pameran.",
      "Dilarang menyentuh, mengoperasikan, atau memindahkan perangkat exhibitor tanpa izin.",
      "Dilarang merusak fasilitas, booth, maupun properti yang tersedia.",
      "Ikuti arahan panitia dan jangan menghalangi akses serta jalur evakuasi.",
      "Anak-anak wajib didampingi orang tua atau pendamping.",
    ],
    faq: [
      {
        q: "Apakah Tech-Xhibition terbuka untuk umum?",
        a: "Ya, Tech-Xhibition terbuka untuk semua kalangan, mulai dari mahasiswa, pelajar, akademisi, hingga masyarakat umum.",
      },
      {
        q: "Apakah perlu membeli tiket atau registrasi dulu?",
        a: "Tidak. Tech-Xhibition gratis dan bisa langsung dikunjungi tanpa registrasi.",
      },
      {
        q: "Apa saja yang bisa dilakukan di Tech-Xhibition?",
        a: "Kamu bisa melihat produk teknologi, mencoba demonstrasi secara langsung, dan berinteraksi dengan exhibitor untuk mengenal teknologi yang ditampilkan.",
      },
    ],
    gallery: [
      { src: img("tech-xhibition", "gallery-4"), alt: "Pengunjung berdiskusi di booth Badak LNG" },
      { src: img("tech-xhibition", "gallery-3"), alt: "Mobil listrik mahasiswa dipamerkan di bawah tenda" },
      { src: img("tech-xhibition", "gallery-2"), alt: "Pengunjung memainkan angklung di area pameran" },
      { src: img("tech-xhibition", "gallery-5"), alt: "Booth pameran dengan poster dan layar demo" },
      { src: img("tech-xhibition", "hero"), alt: "Gapura ITB Insight Festival 2017" },
    ],
    card: {
      when: "Sabtu, 28 Nov",
      where: "Labtek V, ITB",
      image: { src: img("tech-xhibition", "gallery-1"), alt: "" },
    },
    seoDescription:
      "Tech-Xhibition ITB Insight 2026: pameran teknologi interaktif dengan demo produk dan prototipe dari perusahaan, startup, komunitas, dan kampus. Sabtu, 28 November 2026 di Labtek V ITB. Gratis.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "playtech-showtech",
    name: "Playtech & Showtech",
    // MENUNGGU KONFIRMASI: lembar menulis "#Where Tech Comes to Play..." (dengan "#").
    tagline: "Where Tech Comes to Play and Steals the Show",
    summary:
      "Wahana eksplorasi sains dan teknologi lewat permainan, demonstrasi, dan instalasi interaktif. Bermain, bereksperimen, dan saksikan penerapan teknologi secara langsung.",
    aboutTitle: "Sains yang bisa dimainkan",
    about: [
      "Playtech & Showtech mengajak pengunjung menjelajahi dunia sains dan teknologi lewat pengalaman yang interaktif, menyenangkan, dan edukatif. Ada wahana yang bisa dimainkan langsung, juga instalasi yang menampilkan fenomena sains secara visual dan menarik.",
      "Di Playtech, kamu bisa mencoba permainan interaktif sendiri atau bareng teman, yang memadukan hiburan dengan prinsip sains dan teknologi. Di Showtech, ada demonstrasi dan instalasi teknologi dengan sentuhan visual dan artistik yang mengundang rasa ingin tahu. Sains dan teknologi ternyata bukan konsep yang rumit, tapi dekat dengan kehidupan sehari-hari.",
    ],
    accent: "#5fd3c4",
    startDate: "2026-11-28T09:00:00+07:00",
    // MENUNGGU KONFIRMASI: info cepat 09.00-15.00, rundown 09.00-17.00.
    endDate: "2026-11-28T17:00:00+07:00",
    facts: {
      date: "Sabtu, 28 November 2026",
      time: "09.00 – 17.00 WIB",
      // MENUNGGU KONFIRMASI: daftar wahana menulis "Lapangan CC Timur", bukan "Lapangan Cinta".
      venue: "Gallery Utama CC Timur & Lapangan Cinta, ITB",
      audience: "Siswa SD–SMA, mahasiswa, masyarakat umum, dan seluruh pengunjung ITB INSIGHT 2026",
      ticket: "Gratis",
      registration: "Tidak perlu",
    },
    hero: {
      src: img("playtech-showtech", "hero"),
      alt: "Pengunjung bersorak menonton robot gripper di Playtech",
      position: "50% 40%",
    },
    aboutImage: {
      src: img("playtech-showtech", "gallery-3"),
      alt: "Pengunjung bermain di kotak pasir augmented reality",
    },
    ogImage: "/events/playtech-showtech/og.jpg",
    ctas: [
      { label: "Lihat Wahana", href: "#playtech" },
      { label: "Buka Peta", href: "/event-map" },
    ],
    highlightsTitle: "Yang bisa kamu lakukan",
    highlights: [
      { text: "Mainkan berbagai wahana teknologi interaktif yang seru dan menantang!" },
      { text: "Temukan penerapan sains dan teknologi dalam kehidupan sehari-hari!" },
      { text: "Rasakan keseruan bereksplorasi teknologi bersama teman dan keluarga!" },
    ],
    attractions: {
      title: "Wahana",
      groups: [
        {
          id: "playtech",
          title: "Playtech",
          area: "Lapangan CC Timur",
          unit: "wahana",
          items: [
            { name: "Buzz Wire", description: "Lewati pipa berliku tanpa membunyikan bel!" },
            { name: "Reaction Time Game", description: "Adu kecepatan reaksimu melawan teman!" },
            { name: "Arduino Maze Game", description: "Loloskan bola dari labirin!" },
            { name: "Real Time Emotion Game", description: "Tirukan ekspresi yang diminta dan kumpulkan skor!" },
            { name: "Racing LED", description: "Balapan dengan teman, LED siapa yang lebih cepat!" },
            { name: "Robo Sumo", description: "Dorong RoboCar lawan keluar dari arena!" },
            { name: "Flappy Pitch", description: "Kendalikan suaramu untuk meloloskan flappy dari labirin!" },
            { name: "Memory Sequence", description: "Uji daya ingatmu di permainan ini!" },
            { name: "Wave & Go!", description: "Jalankan Robocar sampai tujuan pakai gestur tangan!" },
            { name: "Stars Swarm", description: "Hancurkan kapal musuh dan naik ke level berikutnya!" },
            { name: "67 Counter", description: "Jadi top leaderboard dengan 67 terbanyak!" },
            { name: "Mini Tetris", description: "Nostalgia permainan lama dengan bentuk berbeda!" },
            { name: "Laser Shooting Range", description: "Bidik dan tembak targetnya!" },
            { name: "Robo Gripper", description: "Pindahkan bola ke target dengan Robocar!" },
            { name: "Robo Soccer", description: "Cetak gol pakai Robocar!" },
            { name: "Non-Newtonian Fluid", description: "Bermain dan bereksplorasi dengan salah satu fluida unik dalam sains!" },
            { name: "Color Blaster", description: "Tembak LED dan taklukkan level berikutnya!" },
            { name: "Robo Shooter", description: "Tembak dan jatuhkan target pakai Robocar!" },
          ],
        },
        {
          id: "showtech",
          title: "Showtech",
          area: "Gallery CC Timur",
          unit: "instalasi",
          items: [
            { name: "Infinity Mirror", description: "Intip ke dalam cermin dan temukan lorong cahaya tanpa ujung!" },
            { name: "Piano Stairs", description: "Setiap langkahmu di tangga ini menghasilkan nada!" },
            { name: "Spoon Piano", description: "Sentuh sendoknya dan dengarkan mereka bernyanyi!" },
            { name: "Cloud Light", description: "Saksikan awan yang berkilat dan menyala saat disentuh!" },
            { name: "Mechanical Tulip", description: "Lihat bunga tulip robot mekar di depan matamu!" },
            { name: "Solar Tracker", description: "Saksikan panel surya yang selalu mengejar arah cahaya!" },
            { name: "Klungbot", description: "Dengarkan robot memainkan angklung dengan merdu!" },
            { name: "Chroma Tunnel", description: "Pilih warna di layar dan kreasikan terowongan cahayamu sendiri!" },
            { name: "Mirror Motion", description: "Bergerak dan lihat bayangan digitalmu menari di layar!" },
            { name: "Insight AI Assistant", description: "Tanyakan apa saja kepada asisten AI kami!" },
          ],
        },
      ],
    },
    rundown: {
      title: "Rangkaian acara",
      groups: [
        {
          items: [
            { time: "09.00 – 09.30", title: "Open gate", note: "Pengunjung mulai memasuki area Playtech & Showtech." },
            { time: "09.30 – 16.30", title: "Playtech & Showtech berlangsung", note: "Eksplorasi, bermain, dan nikmati wahana teknologi." },
            { time: "16.30 – 17.00", title: "Close gate", note: "Seluruh rangkaian Playtech & Showtech selesai." },
          ],
        },
      ],
    },
    bring: ["QR code pengunjung, kalau kamu mau masuk top leaderboard pengunjung dan dapat hadiahnya!"],
    rules: [
      "Dilarang membawa barang terlarang, minuman keras, hewan peliharaan, obat-obatan terlarang, dan senjata.",
      "Patuhi ketentuan yang berlaku di ITB Insight dan arahan panitia di tiap wahana.",
    ],
    faq: [
      {
        q: "Apa itu Playtech & Showtech?",
        a: "Mata acara ITB Insight 2026 yang menghadirkan berbagai permainan interaktif dan demonstrasi teknologi untuk memperkenalkan sains dan teknologi secara menyenangkan.",
      },
      {
        q: "Apa bedanya Playtech dan Showtech?",
        a: "Playtech berfokus pada permainan dan wahana interaktif yang bisa dicoba langsung. Showtech menghadirkan demonstrasi teknologi yang menarik untuk dilihat dan dieksplorasi.",
      },
      {
        q: "Apakah semua pengunjung bisa mencoba wahana?",
        a: "Tentu! Kamu bisa mencoba wahana interaktif yang tersedia dengan mengikuti arahan panitia dan ketentuan di masing-masing wahana.",
      },
      {
        q: "Apakah cocok untuk anak-anak?",
        a: "Ya! Playtech & Showtech dirancang untuk berbagai kalangan usia, dari anak-anak hingga orang dewasa, dengan pengalaman yang seru sekaligus edukatif.",
      },
      {
        q: "Apakah harus paham teknologi dulu?",
        a: "Tidak perlu! Semua wahana dan demonstrasi dirancang agar mudah dinikmati dan dipahami, termasuk oleh pengunjung yang belum familiar dengan sains dan teknologi.",
      },
    ],
    gallery: [
      { src: img("playtech-showtech", "gallery-4"), alt: "Pengunjung melihat instalasi Infinity Mirror" },
      { src: img("playtech-showtech", "gallery-1"), alt: "Anak-anak bermain bayangan warna di dinding cahaya" },
      { src: img("playtech-showtech", "gallery-5"), alt: "Pengunjung menghindari sinar laser di ruang gelap" },
      { src: img("playtech-showtech", "gallery-2"), alt: "Pengunjung mencoba remote control drone" },
      { src: img("playtech-showtech", "highlight-1"), alt: "Siswa berkumpul di depan banner Education of Technology" },
    ],
    card: {
      when: "Sabtu, 28 Nov",
      where: "CC Timur, ITB",
      image: { src: img("playtech-showtech", "hero"), alt: "" },
    },
    seoDescription:
      "Playtech & Showtech ITB Insight 2026: 18 wahana permainan sains dan 10 instalasi teknologi interaktif. Sabtu, 28 November 2026 di CC Timur ITB. Gratis, tanpa registrasi.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "technology-seminar",
    name: "Technology Seminar",
    tagline: "Beyond Technology, Towards Humanity",
    summary:
      "Forum diskusi interaktif yang mempertemukan akademisi, industri, dan generasi muda untuk mengeksplorasi perkembangan teknologi serta dampaknya terhadap kehidupan dan masa depan dunia kerja.",
    aboutTitle: "Teknologi untuk masa depan yang berpusat pada manusia",
    about: [
      "Mengusung semangat Beyond Frontiers: Technology for a Sustainable and Human-Centered Future, Technology Seminar ITB INSIGHT 2026 hadir sebagai ruang eksplorasi dan pertukaran gagasan mengenai perkembangan teknologi serta implikasinya terhadap kehidupan masyarakat. Seminar ini menghadirkan perspektif dari akademisi, industri, dan organisasi lewat sesi keynote, breakout discussion, dan diskusi interaktif.",
      "Di forum ini, peserta diajak mengeksplorasi berbagai isu dan pengalaman dari pembicara yang berpengalaman dan relevan. Lewat pemaparan materi dan sesi tanya jawab, peserta diharapkan memperoleh wawasan mengenai transformasi dunia kerja, perubahan kebutuhan kompetensi, serta kesiapan sumber daya manusia menghadapi era digital.",
    ],
    accent: "#b8a4ff",
    startDate: "2026-11-28T08:00:00+07:00",
    endDate: "2026-11-28T15:15:00+07:00",
    facts: {
      date: "Sabtu, 28 November 2026",
      // MENUNGGU KONFIRMASI: lembar menulis "12,.00-1515"; rundown sesi II mulai registrasi 11.50.
      time: "Sesi I 08.00 – 11.20 · Sesi II 12.00 – 15.15 WIB",
      venue: "Auditorium CC Timur, ITB, Bandung",
      audience: "Mahasiswa, akademisi, komunitas, dan perwakilan institusi yang lolos kurasi atau diundang",
      ticket: "Gratis",
      // MENUNGGU KONFIRMASI: lembar menyebut poster IG, kurasi/undangan, dan form bit.ly.
      registration: "Ya, lewat formulir resmi, lalu dikurasi panitia",
      quota: "100 peserta per sesi",
    },
    hero: {
      src: img("technology-seminar", "hero"),
      alt: "Peserta bertanya kepada pembicara di Insight Seminar",
    },
    aboutImage: {
      src: img("technology-seminar", "highlight-1"),
      alt: "Ratusan peserta mengikuti Insight Seminar",
    },
    ogImage: "/events/technology-seminar/og.jpg",
    ctas: [
      { label: "RSVP", href: "https://bit.ly/TechnologySeminarITBINSIGHT2026", external: true },
      { label: "Lihat Sesi", href: "#sesi" },
    ],
    highlightsTitle: "Yang menantimu",
    highlights: [
      { text: "Dengarkan perspektif industri dan akademisi mengenai perkembangan teknologi." },
      { text: "Eksplorasi dampak disrupsi teknologi terhadap kehidupan dan dunia kerja." },
      { text: "Ikuti diskusi interaktif bersama pembicara dari berbagai latar belakang." },
      { text: "Ajukan pertanyaan langsung dalam sesi tanya jawab bersama narasumber." },
      { text: "Perluas wawasan lewat pertukaran gagasan dan perspektif lintas disiplin." },
    ],
    seminar: {
      sessions: [
        { label: "Sesi I", time: "08.00 – 11.20", room: "Auditorium CC Timur", capacity: "100 kursi" },
        { label: "Sesi II", time: "12.00 – 15.15", room: "Auditorium CC Timur", capacity: "100 kursi" },
      ],
      whoFor:
        "Mahasiswa, akademisi, dan siapa pun yang tertarik pada perkembangan teknologi, transformasi digital, dan masa depan ketenagakerjaan Indonesia, terutama yang ingin memahami perubahan kebutuhan kompetensi dan bersiap menghadapi dinamika dunia kerja.",
      learn: [
        "Identifikasi tantangan dan peluang disrupsi digital terhadap ketenagakerjaan Indonesia.",
        "Pahami perubahan kebutuhan keterampilan dan kompetensi tenaga kerja.",
        "Pelajari strategi menyiapkan sumber daya manusia menghadapi transformasi digital.",
      ],
      register: [
        "Isi formulir pendaftaran lewat tautan resmi panitia.",
        "Panitia mengkurasi berdasarkan latar belakang, motivasi, dan relevansi minatmu dengan topik seminar.",
        "Tunggu hasil seleksi atau konfirmasi keikutsertaan lewat email.",
        "Peserta yang terkonfirmasi mengikuti seminar sesuai jadwal sesinya.",
      ],
      registerUrl: "https://bit.ly/TechnologySeminarITBINSIGHT2026",
    },
    bring: [
      "Bukti registrasi atau undangan resmi.",
      "Identitas diri untuk verifikasi peserta.",
      "Perangkat untuk mencatat materi dan mengikuti diskusi.",
      "Pertanyaan yang relevan dengan topik seminar.",
    ],
    rules: [
      "Tunjukkan bukti registrasi atau undangan saat datang.",
      "Hadir tepat waktu sesuai jadwal sesi.",
      "Gunakan pakaian yang rapi dan sopan.",
      "Jaga ketertiban dan kenyamanan selama pemaparan dan diskusi.",
      "Hormati narasumber dan peserta lain selama sesi tanya jawab.",
    ],
    checkIn: [
      "Datang ke meja registrasi di area Auditorium CC Timur.",
      "Tunjukkan undangan kepada petugas untuk diverifikasi.",
      "Setelah terverifikasi, masuk ke ruang seminar.",
    ],
    faq: [
      {
        q: "Apakah seminar ini terbuka untuk umum?",
        a: "Peserta tidak mendaftar langsung secara terbuka. Peserta dipilih lewat kurasi dan undangan panitia.",
      },
      {
        q: "Siapa saja pembicaranya?",
        a: "Technology Seminar menghadirkan pembicara dari berbagai latar belakang dan bidang keahlian. Nantikan Speaker Reveal di Instagram resmi ITB INSIGHT 2026, @itbinsight!",
      },
      {
        q: "Topik apa yang dibahas?",
        a: "Perkembangan teknologi, inovasi, disrupsi digital, serta dampaknya terhadap kehidupan dan masa depan dunia kerja.",
      },
      {
        q: "Bagaimana kalau ada pertanyaan lain?",
        a: "Hubungi panitia lewat Instagram resmi ITB INSIGHT 2026, @itbinsight.",
      },
    ],
    gallery: [
      { src: img("technology-seminar", "gallery-2"), alt: "Pembicara memaparkan materi di Insight Seminar Vol. 2" },
      { src: img("technology-seminar", "gallery-1"), alt: "Foto bersama peserta dan pembicara seminar" },
      { src: img("technology-seminar", "gallery-3"), alt: "Penyerahan plakat kepada pembicara" },
      { src: img("technology-seminar", "gallery-4"), alt: "Sambutan di podium seminar" },
      { src: img("technology-seminar", "gallery-5"), alt: "Foto bersama pembicara dan panitia" },
    ],
    card: {
      when: "Sabtu, 28 Nov",
      where: "Auditorium CC Timur",
      image: { src: img("technology-seminar", "hero"), alt: "" },
    },
    seoDescription:
      "Technology Seminar ITB Insight 2026: diskusi teknologi, disrupsi digital, dan masa depan dunia kerja bersama akademisi dan industri. Sabtu, 28 November 2026 di Auditorium CC Timur ITB.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "insight-on-stage",
    name: "Insight on Stage",
    tagline: "From Sunrise to Starlight, Ganesha Comes Alive",
    summary:
      "Panggung utama ITB INSIGHT 2026 yang menghadirkan penampilan band, bintang tamu spesial, serta projection mapping dan light show yang memukau. Terbuka untuk umum!",
    aboutTitle: "Satu hari penuh di panggung utama",
    about: [
      "Insight on Stage adalah panggung utama ITB INSIGHT 2026 yang menghadirkan beragam penampilan band, bintang tamu spesial, hingga pertunjukan projection mapping dan light show dalam satu hari penuh.",
      "Catat tanggalnya! Kami tunggu kehadiranmu di Kampus ITB Ganesha pada Sabtu, 28 November 2026. Gate dibuka pukul 07.30 WIB dan ditutup pukul 20.00 WIB.",
      "Acara ini terbuka untuk umum tanpa perlu registrasi. Jadi, ajak teman dan keluargamu untuk ikut merasakan kemeriahan Insight on Stage!",
    ],
    accent: "#ffc46b",
    startDate: "2026-11-28T07:30:00+07:00",
    endDate: "2026-11-28T20:00:00+07:00",
    facts: {
      date: "Sabtu, 28 November 2026",
      time: "07.30 – 20.00 WIB",
      venue: "Kampus ITB Ganesha, Bandung",
      audience: "Umum",
      ticket: "Gratis",
      registration: "Tidak perlu",
    },
    hero: {
      src: img("insight-on-stage", "hero"),
      alt: "Penonton menyaksikan band di panggung Insight on Stage pada malam hari",
      position: "50% 35%",
    },
    aboutImage: {
      src: img("insight-on-stage", "highlight-3"),
      alt: "Projection mapping ITB Insight di dinding gedung kampus",
    },
    ogImage: "/events/insight-on-stage/og.jpg",
    ctas: [
      { label: "Lihat Rangkaian Acara", href: "#rundown" },
      { label: "Buka Peta", href: "/event-map" },
    ],
    highlightsTitle: "Sorotan",
    highlights: [
      {
        title: "Live Band Performance",
        text: "Nikmati penampilan band yang siap memeriahkan panggung utama ITB INSIGHT 2026.",
      },
      {
        title: "Special Guest Star",
        text: "Saksikan penampilan spesial dari bintang tamu yang akan membuat harimu makin berkesan.",
      },
      {
        title: "Projection Mapping & Light Show",
        text: "Tutup harimu dengan pertunjukan visual dan permainan cahaya yang spektakuler.",
      },
    ],
    /*
     * Diringkas dari rundown Opening dan Closing di lembar IoS: hanya bagian
     * yang dialami pengunjung, tanpa butir protokoler satu per satu.
     */
    rundown: {
      title: "Rangkaian acara",
      groups: [
        {
          title: "Pagi · Opening",
          tone: "day",
          items: [
            { time: "07.30", title: "Gate dibuka, opening & sambutan" },
            { time: "08.13", title: "Infinity" },
            { time: "08.23", title: "Band HMFT" },
            { time: "08.45", title: "Berlanjut ke pameran dan wahana" },
          ],
        },
        {
          title: "Sore–Malam · Closing",
          tone: "night",
          items: [
            { time: "14.30", title: "Pembukaan acara sore" },
            { time: "14.49", title: "Guest Star", star: true },
            { time: "16.04", title: "Band HMFT, Apres ITB, Band Alumni" },
            { time: "16.59", title: "Ishoma" },
            { time: "18.14", title: "Awarding" },
            { time: "19.14", title: "Light Show", star: true },
            { time: "19.35", title: "Penutupan" },
          ],
        },
      ],
    },
    rules: [
      "Dilarang membawa senjata tajam, senjata api, dan benda berbahaya lainnya.",
      "Dilarang membawa atau menggunakan narkotika, obat-obatan terlarang, dan minuman beralkohol.",
      "Dilarang membawa petasan, kembang api, bahan peledak, dan benda mudah terbakar.",
      "Dilarang berkelahi, melakukan kekerasan, atau melecehkan pengunjung lain.",
      "Dilarang merusak fasilitas kampus, membuang sampah sembarangan, dan memasuki area terbatas tanpa izin.",
    ],
    gallery: [
      { src: img("insight-on-stage", "gallery-2"), alt: "Penonton memadati panggung dengan lampu sorot ungu" },
      { src: img("insight-on-stage", "gallery-1"), alt: "Pertunjukan laser membentuk logo ITB Insight" },
      { src: img("insight-on-stage", "gallery-6"), alt: "Penari dengan kostum lampu LED dan laser hijau" },
      { src: img("insight-on-stage", "gallery-5"), alt: "Light painting warna-warni di atas panggung" },
      { src: img("insight-on-stage", "highlight-1"), alt: "Gitaris band tampil di panggung" },
      { src: img("insight-on-stage", "gallery-3"), alt: "Instalasi cahaya ITB Insight di malam hari" },
    ],
    card: {
      when: "Sabtu, 28 Nov",
      where: "Kampus ITB Ganesha",
      image: { src: img("insight-on-stage", "hero"), alt: "" },
    },
    seoDescription:
      "Insight on Stage ITB Insight 2026: panggung utama dengan live band, bintang tamu, projection mapping, dan light show. Sabtu, 28 November 2026, Kampus ITB Ganesha, 07.30–20.00 WIB. Gratis.",
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "inspirates",
    name: "Inspirates",
    // MENUNGGU KONFIRMASI: kemungkinan maksudnya "Technology Around You".
    tagline: "Technology Around Is You",
    summary:
      "Program roadshow ITB Insight 2026 dari mahasiswa Teknik Fisika ITB ke sekolah. Kenali Teknik Fisika, temukan teknologi di sekitarmu, dan coba langsung alat demonstrasi karya mahasiswa.",
    aboutTitle: "Teknik Fisika datang ke sekolahmu",
    about: [
      "Inspirates mengenalkan Teknik Fisika dan ITB Insight 2026 langsung ke sekolah. Lewat kegiatan ini, siswa diajak melihat bagaimana fisika, matematika, dan rekayasa diterapkan dalam teknologi, mengenal berbagai proyek mahasiswa, dan mencoba langsung alat demonstrasi buatan mahasiswa Teknik Fisika ITB.",
      "Ada juga sesi sharing tentang perkuliahan, kehidupan mahasiswa, proyek teknologi, dan kegiatan di ITB Insight 2026. Temukan hal-hal menarik di balik teknologi yang kamu pakai sehari-hari!",
    ],
    accent: "#7fe0a0",
    // MENUNGGU KONFIRMASI: lembar menulis 2-20 November, jadwal sekolahnya 11-17 November.
    startDate: "2026-11-02",
    endDate: "2026-11-20",
    facts: {
      date: "2–20 November 2026",
      time: "Menyesuaikan jadwal tiap sekolah",
      venue: "SMA di Bandung dan sekitarnya",
      audience: "Siswa SMA/SMK/MA sederajat di sekolah yang dikunjungi",
      ticket: "Gratis",
      registration: "Tidak perlu. Cukup scan QR kehadiran di lokasi.",
    },
    hero: {
      src: img("inspirates", "hero"),
      alt: "Tim Inspirates berfoto bersama siswa di sekolah",
      position: "50% 30%",
    },
    aboutImage: {
      src: img("inspirates", "highlight-2"),
      alt: "Siswa mencoba alat demonstrasi bersama mahasiswa",
    },
    ogImage: "/events/inspirates/og.jpg",
    ctas: [
      { label: "Jadwal Sekolah", href: "#jadwal" },
      { label: "Lihat Alat", href: "#alat" },
    ],
    highlightsTitle: "Yang bisa kamu lakukan",
    highlights: [
      { text: "Kenali Teknik Fisika dan teknologi di sekitarmu." },
      { text: "Coba langsung alat teknologi karya mahasiswa Teknik Fisika ITB." },
      { text: "Main kuis seru berhadiah bersama teman sekelas." },
      { text: "Tanya langsung soal kuliah dan masuk ITB kepada mahasiswa." },
    ],
    schoolVisits: [
      { school: "SMAN 1 Dayeuhkolot", date: "2026-11-11", time: "07.00 – 10.00" },
      { school: "SMA Muhammadiyah 1 Cimahi", date: "2026-11-11", time: "13.00 – 15.00" },
      { school: "SMAN 1 Bandung", date: "2026-11-12", time: "08.00 – 11.00" },
      { school: "SMAN 1 Ngamprah", date: "2026-11-13", time: "07.30 – 11.00" },
      { school: "SMAN 4 Cimahi", date: "2026-11-16", time: "07.00 – 09.00" },
      { school: "SMAN 16 Bandung", date: "2026-11-17", time: "07.45 – 10.15" },
    ],
    rundown: {
      title: "Rangkaian kegiatan di sekolah",
      groups: [
        {
          items: [
            { title: "Pembukaan", note: "Perkenalan tim Inspirates." },
            { title: "Modul I: Mengenal Teknik Fisika", note: "Teknik Fisika itu belajar apa? Kuliahnya seperti apa? Lulusannya bisa jadi apa?" },
            { title: "Modul II: Mengenal ITB Insight 2026", note: "Apa itu ITB Insight dan apa saja yang bisa dilihat di main event." },
            { title: "Kuis interaktif", note: "Adu cepat menjawab pertanyaan bersama timmu." },
            { title: "Pengenalan dan demonstrasi alat", note: "Demonstrasi alat dan kenali setiap alat lewat brosur." },
            { title: "Tanya jawab & sharing", note: "Ngobrol bebas dengan mahasiswa tentang apa pun." },
            { title: "Foto bersama & penutupan", note: "Foto bareng sebagai penutup kegiatan." },
          ],
        },
      ],
    },
    attractions: {
      title: "Alat yang dibawa",
      groups: [
        {
          id: "alat",
          title: "Alat demonstrasi",
          unit: "alat",
          items: [
            { name: "Solar Tracker", description: "Saksikan panel surya yang selalu mengejar arah cahaya!" },
            { name: "Insight AI Assistant", description: "Tanyakan apa saja kepada asisten AI kami!" },
            { name: "Robo Gripper", description: "Pindahkan bola ke target dengan Robocar!" },
            { name: "Robo Soccer", description: "Cetak gol pakai Robocar!" },
            { name: "Real Time Emotion Game", description: "Tirukan ekspresi yang diminta dan kumpulkan skor!" },
          ],
        },
      ],
    },
    checkIn: [
      "Scan QR kehadiran.",
      "Isi nama.",
      "Tekan Kirim. Selesai, kamu sudah tercatat hadir.",
    ],
    faq: [
      {
        q: "Apa itu Inspirates?",
        a: "Program kunjungan edukasi sains dan teknologi dari mahasiswa Teknik Fisika ITB ke sekolah, berisi demo alat, mini eksperimen, kuis, dan sesi tanya jawab.",
      },
      {
        q: "Di mana bisa tahu lebih lanjut tentang ITB Insight?",
        a: "Lihat Instagram @itbinsight atau situs itbinsight.com untuk info terbaru main event 28 November 2026.",
      },
    ],
    gallery: [
      { src: img("inspirates", "gallery-5"), alt: "Ratusan siswa mengikuti Inspirates di aula sekolah" },
      { src: img("inspirates", "highlight-4"), alt: "Siswa mengangkat tangan menjawab kuis" },
      { src: img("inspirates", "gallery-3"), alt: "Siswa merakit rangkaian elektronik bersama mahasiswa" },
      { src: img("inspirates", "highlight-5"), alt: "Siswa mencoba kacamata virtual reality" },
      { src: img("inspirates", "gallery-1"), alt: "Mahasiswa menunjukkan hologram kepada siswa" },
      { src: img("inspirates", "reminder-square"), alt: "Foto bersama seluruh siswa di halaman sekolah" },
    ],
    card: {
      when: "2–20 Nov",
      where: "SMA di Bandung",
      image: { src: img("inspirates", "hero"), alt: "" },
    },
    seoDescription:
      "Inspirates ITB Insight 2026: roadshow mahasiswa Teknik Fisika ITB ke SMA di Bandung dan sekitarnya. Demo alat, kuis, dan sharing kuliah. November 2026.",
  },
];

export async function getEventDetail(slug: string): Promise<EventDetail | null> {
  return DETAILS.find((d) => d.slug === slug) ?? null;
}

export async function getEventDetailSlugs(): Promise<string[]> {
  return DETAILS.map((d) => d.slug);
}

export async function getAllEventDetails(): Promise<EventDetail[]> {
  return DETAILS;
}
