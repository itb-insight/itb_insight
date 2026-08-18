# **`FINAL V1.0`** **`Unitary Product Requirements Document (PRD)`**

# **`Website ITB Insight 2026`**

| `Status` | `Final v1.0 — Adopted`  |
| ----: | :---- |
| `Pemilik Dokumen` | `Tim WebDev ITB Insight 2026` |
| `Disusun oleh` | `Fathir Arbi Fadillah - Head of WebDev Division & 🦀 Claude Opus 5` |
| `Tanggal` | `28 July 2026` |
| `Tanggal adopsi` | `2026-08-19` |
| `Distribusi` | `Public repository — approved for publication` |


## Table of contents

- [Meta Dokumen](#0-meta-dokumen)
- [Concepting](#bab-i-concepting)
- [Functional requirements](#bab-ii-functional-requirements)
- [Technical details](#bab-iii-technical-details)
- [Visual design and assets](#bab-iv-visual-design--assets)
- [Decisions](#10-register-keputusan-perlu-diputuskan)
- [Dependencies, risks, and traceability](#11-dependensi-risiko--catatan)


## **`0. Meta Dokumen`**

### **`0.1 Dokumen Sumber yang Dilebur`**

| `Kode` | `Dokumen Sumber` | `Bidang Pemohon` | `PIC` | `Tanggal` |
| :---- | :---- | :---- | :---- | :---- |
| `SRC-A` | `PRD Sponsorship` | `Sponsorship` | `Affan Haidar` | `5 Apr 2026` |
| `SRC-B` | `PRD Creative Branding` | `Creative Branding` | `Tya` | `3 Apr 2026` |
| `SRC-C` | `PRD Event` | `Event` | `Alya & Syadid` | `26 Mar 2026` |
| `SRC-D` | `PRD Competition` | `Competition` | `Baginda & Erdi` | `4 Apr 2026` |
| `SRC-E` | `PRD Marketing` | `Marketing` | `Toge` | `15 Mar 2026` |
| `SRC-F` | `Strategic Request — Visi Digital & Narasi Utama` | `Ring 0 / Ring 1 (Leadership)` | `Leadership` | `3 Apr 2026` |
| `SRC-G` | `Arahan Untuk Tim 3D Design` | `WebDev → 3D Design` | `Fathir` | `1 July 2026` |

### **`0.2 Cara Membaca Dokumen Ini`**

1. `Dokumen ini menggantikan ketujuh dokumen di atas sebagai acuan tunggal implementasi. Dokumen asli tetap disimpan sebagai arsip niat bidang.`
2. `Setiap requirement asli sudah dipetakan ke satu requirement terpadu. Requirement yang tumpang tindih dilebur, bukan didaftar ulang. Peta lengkap nya ada di 13 Traceability Matrix.`
3. `Prioritas MoSCoW dari bidang dinormalisasi ulang di tingkat produk. Jika prioritas berubah dari dokumen asli, alasannya dicatat di kolom Normalized From.`
4. `Hal yang belum bisa diputuskan oleh WebDev sendiri dikumpulkan di 10 Register Keputusan.`

### **`0.3 Prinsip Pemutus (Tie-Breakers)`**

`Ketika dua bidang saling bertentangan, urutan prioritas berikut yang dipakai:`

1. **`Keamanan data peserta`** `mengalahkan fitur apa pun. (Arahan Leadership, SRC-F 4.)`
2. **`Akses informasi publik`** `mengalahkan kebutuhan data capture. Website adalah kanal informasi lebih dulu, mesin pengumpul data kemudian.`
3. **`Satu sumber kebenaran data (single source of truth)`** `mengalahkan kenyamanan channel masing-masing bidang.`
4. **`Performa & aksesibilitas`** `membatasi ambisi visual, bukan sebaliknya. Target di 6.5 adalah batas keras.`
5. `Jika dua bidang meminta hal yang mirip, dibangun satu modul dengan konfigurasi, bukan dua fitur kembar.`


# **`BAB I`** **`CONCEPTING`**

## **`1. Introduction`**

### **`1.1 Executive Summary`**

`Website ITB Insight 2026 adalah kanal digital tunggal untuk seluruh rangkaian acara: pre-event (Inspirates, Alumni Gathering), kompetisi, dan main event. Ia melayani lima kepentingan sekaligus yang selama ini tersebar di dokumen terpisah:`

* **`Informasi`**`: satu tempat terpusat menggantikan penyebaran info di banyak channel (SRC-C).`
* **`Konversi:`** `pendaftaran lomba, pre-registrasi kehadiran, RSVP undangan, dan inquiry partnership (SRC-D, SRC-E, SRC-A).`
* **`Operasi hari-H:`** `Check-in gate, tracking booth, feedback, semuanya berbasis QR (SRC-C, SRC-E).`
* **`Kredibilitas komersial`**`: Angka, dokumentasi, dan penempatan mitra sebagai bukti skala acara (SRC-A, SRC-E).`
* **`Branding`**`: Pengalaman visual yang membuat orang bicara dan membagikan (SRC-B, SRC-F, SRC-G).`

### **`1.2 Core Message & Tone of Voice`**

**`Core Message:`**

*"Beyond Frontiers: Technology for a Sustainable and*
*Human-Centered Future”*

`Teknologi untuk masa depan yang berkelanjutan dan berpusat pada manusia. ITB Insight sebagai ruang kolaborasi lintas disiplin, tempat masyarakat menjadi subjek yang berdaya lewat sains dan inovasi.`

**`Tone of Voice:`**

1. `Futuristik dan "canggih", tapi terbaca oleh siswa SMA sampai profesional industri.`
2. `Inklusif — tidak dibuat kompleks.`
3. `Energetik — bukan korporat.`
4. `Menampilkan elemen keilmuan Teknik Fisika / fisika secara umum.`

### **`1.3 Visitor’s Journey`**

`Semua alur di 5 harus bisa dipetakan ke lima tahap ini (SRC-F):`

**`Attraction → Exploration → Interaction → Insight → Action`**

| `Tahap` | `Modul Pendukung Utama` |
| :---- | :---- |
| `Attraction` | `LND (landing, countdown, impact counter, narasi scroll)` |
| `Exploration` | `EVT, CMP, MAP, GAL` |
| `Interaction` | `QRS, FBK, MAP` |
| `Insight` | `ACC (dashboard peserta), ADM (dashboard panitia)` |
| `Action` | `ACC (registrasi), CMP (pendaftaran lomba), PRT (inquiry)` |

### **`1.4 Masalah yang Diselesaikan (Konsolidasi)`**

| `#` | `Masalah` | `SourceID` | `Modul Penjawab` |
| :---- | :---- | :---- | :---- |
| `P-01` | `Informasi acara tersebar di banyak channel` | `SRC-C` | `EVT, INF` |
| `P-02` | `Pencatatan pengunjung hari-H tidak konsisten, rawan double count` | `SRC-C, SRC-E` | `QRS, ADM` |
| `P-03` | `Pengunjung malas mengisi form kehadiran & feedback yang panjang` | `SRC-E` | `ACC, QRS, FBK` |
| `P-04` | `Tidak ada angka yang menunjukkan skala acara → menurunkan trust` | `SRC-E, SRC-A` | `LND-02, GAL` |
| `P-05` | `Calon mitra sulit menjangkau narahubung resmi tanpa perantara` | `SRC-A` | `PRT-05` |
| `P-06` | `Peserta lomba sulit melihat jadwal real-time & beda antar mata lomba` | `SRC-D` | `CMP-01, CMP-02` |
| `P-07` | `Peserta lomba sulit menghubungi contact person` | `SRC-D` | `INF-02` |
| `P-08` | `Trade-off ekstrem estetika vs readability & aksesibilitas` | `SRC-B` | `7.5` |
| `P-09` | `Website terlihat generik, tidak punya "flair"` | `SRC-B, SRC-F` | `LND-03, 7` |
| `P-10` | `Tidak ada feedback terstruktur dari peserta Inspirates` | `SRC-C` | `FBK-04` |
| `P-11` | `Dokumentasi kegiatan belum terdigitalisasi` | `SRC-C, SRC-B` | `GAL` |
| `P-12` | `Risiko kebocoran data peserta` | `SRC-F` | `6.4` |

### **`1.5 Wow Factor (Target Impresi)`**

> "Website-nya beneran all out. Peta acaranya interaktif, animasinya kayak beneran physics simulation, bukan cuma website formalitas."

`Tiga pilar wow factor yang disepakati:`

1. `Peta acara interaktif dengan navigasi intuitif,`
2. `Countdown dinamis yang menyatu dengan key visual,`
3. `Transisi scroll-based bernarasi. Detail teknis di 7.2–7.3.`

---

## **`2. Persona & Aktor`**

`Berikut daftar pesona & aktor dari pengguna website ITB Insight yang didaftarkan pada enam dokumen PRD sebelumnya. Digunakan untuk perancangan Role-Based Access Control (RBAC) di 6.4.`

| `ID` | `Aktor` | `Kebutuhan Inti` | `Level Akses` |
| :---- | :---- | :---- | :---- |
| `A-01` | `Pengunjung Umum (Guest)` | `Info acara, jadwal, lokasi, atmosfer visual, angka skala acara` | `Publik, tanpa login` |
| `A-02` | `Pengunjung Terdaftar (Peserta Umum)` | `QR (untuk D-day registration & point-logging), feedback, gamifikasi, personal dashboard, pendaftaran lomba / event.` | `Login` |
| `A-03` | `Peserta Lomba` | `A-02 + submit daftar lomba/event, team dashboard.` | `Login` |
| `A-04` | `Peserta Inspirates (Role) (Siswa SMP/SMA)` | `Info kegiatan, materi edukasi, isi feedback` | `Isi feedback, sisanya public` |
| `A-05` | `Tamu Undangan (Stakeholder, Alumni, Perwakilan Institusi)` | `RSVP via link eksklusif, e-ticket QR` | `Link bertoken? UNDECIDED` |
| `A-06` | `Sponsor / Mitra Industri` | `Validasi kredibilitas, penempatan logo, press kit, jalur inquiry` | `Publik + form` |
| `A-07` | `Media Partner` | `Penempatan logo, pengajuan kolaborasi` | `Publik + form terverifikasi` |
| `A-08` | `Exhibitor / Booth Owner` | `Tampil di direktori booth, punya QR booth, lihat jumlah kunjungan sendiri` | `Login (scoped)` |
| `A-09` | `Panitia Lapangan (Gate & Booth Staff)` | `Scan QR, validasi real-time, pencarian manual` | `Login (scoped)` |
| `A-10` | `Panitia Bidang` | `Dashboard data bidangnya, input rekap, ekspor data` | `Login (scoped per bidang)` |
| `A-11` | `Admin / WebDev` | `Konfigurasi penuh, CMS, audit log` | `Superuser` |

---

## **`3. Peta Modul & Arsitektur Informasi`**

### **`3.1 Dua Belas Modul Produk`**

| `Kode` | `Modul` | `Bidang Pemangku Utama` |
| :---- | :---- | :---- |
| `ACC` | `Identity, Account & Dashboard Peserta` | `Marketing, Competition, Leadership` |
| `LND` | `Landing & Narrative` | `Marketing, Creative Branding, Leadership` |
| `EVT` | `Event Information & Program` | `Event, Leadership` |
| `CMP` | `Competition` | `Competition` |
| `MAP` | `Interactive Campus Map` | `Sponsorship, Event, Creative Branding, Leadership` |
| `QRS` | `On-site QR, Check-in & Tracking` | `Event, Marketing` |
| `FBK` | `Feedback` | `Marketing, Event` |
| `PRT` | `Partnership & Sponsorship` | `Sponsorship, Marketing` |
| `PRE` | `Pre-Event (Inspirates, Alumni, Volunteer)` | `Event` |
| `GAL` | `Media & Gallery` | `Creative Branding, Sponsorship` |
| `ADM` | `Admin Dashboard & Analytics` | `Event, Competition, Marketing` |
| `INF` | `Informational & Support` | `Competition, Leadership` |


### **`3.2 Sitemap`**

`/                      LND — landing, countdown, impact counter, narasi scroll`
`├── #about             EVT-06 — visi misi, HMFT-ITB & Teknik Fisika, sambutan Kaprodi`
`├── #track-record`
`├── #gallery                      GAL — dokumentasi & aftermovie <- editable`
`├── #timeline`
`├── #partnership                     PRT-01, PRT-02, PRT-03, PRT-04`
`├── #faq                             INF-01`
`├── #contact                         INF-02`
`├── /events                          EVT-01 — hub seluruh rangkaian acara`
`│   ├── /events/tech-xhibition       EVT-02`
`│   ├── /events/play-tech            EVT-02`
`│   ├── /events/show-tech            EVT-02`
`│   ├── /events/technology-seminar   EVT-02, EVT-03 (session pages)`
`│   ├── /events/insight-on-stage     EVT-02, EVT-03`
`│   ├── /events/alumni-gathering    EVT-10`
`│   └── /events/inspirates          PRE-01, PRE-03, PRE-05`
`├── /competitions                    CMP-01 — hub 4 mata lomba, prize pool total`
`│   ├── /competitions/[slug]    CMP-02 — detail, timeline, guidebook, prize pool, CP`
`│			 ├── #announcements <- separate component, editable`
`│   ├── /competitions/[slug]/register CMP-04, CMP-05, CMP-10`
`│   └── /competitions/[slug]/[team-id]    CMP-06, team-dashboard`
`├── /map                            MAP — peta interaktif berlapis, redirect to EVT-05`
`├── /merch`
`├── /booths                          EVT-05 — direktori & filter booth`
`├── /volunteer                       PRE-04`
`├── /side-quests                     OPTIONAL <- editable`
`│   ├── /[id]                        OPTIONAL`
`├── /rsvp/[token]                    EVT-09 — halaman undangan eksklusif`
`├── /partnership-form                PRT-05`
`├── /feedback                        FBK-02, FBK-03, FBK-04`
`├── /me             ACC-04 — dashboard peserta <- header, also showing user’s points`
`│   ├── #scan                        QRS-06, QRS-08 — landing hasil scan QR`
`│   ├── #tickets                     QRS-01`
`│   ├── #competitions                CMP-04, links to /competitions/[slug]/[team-id]`
`│   └── #progress                    QRS-10`
`└── /admin                           ADM — analytics`
    `├── /admin/gate                  QRS-02, QRS-03 <- only for gate staff`
    `├── /admin/booth                 QRS-04, ACC-08 <- only for booth staff`
    `├── /admin/inspirates            PRE-02 <- stakeholders`
    `├── /admin/competition           CMP-06, CMP-11 <- stakeholders`
    `├── /admin/partners              PRT-08 <- stakeholders`
    `└── /admin/analytics             ADM-01, ADM-02, FBK-05 <- stakeholders`

# **`BAB II`** **`FUNCTIONAL REQUIREMENTS`**

## **`4. Feature Register`**

**`Legenda prioritas:`**
`M = Must-have`
`S = Should-have`
`C = Could-have`
`W = Won't-have`

### **`4.1 ACC — Identity, Account & Dashboard Peserta`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `ACC-01` | `Akun tunggal untuk seluruh website: sign-up/login email + password, dan Sign in with Google` | `M` | `CPP-01, SRC-D 5, SRC-F` | `SRC-E menaruh Google login sebagai could-have; dinaikkan ke must karena SRC-D menjadikannya jalur sign-in utama. Satu sistem akun untuk semua bidang, tidak ada akun terpisah per bidang.` |
| `ACC-02` | `Profil pengguna tersimpan sekali dan dipakai ulang (auto-prefill): Nama, Email, No. HP` | `M` | `CPP-01, SRC-D 7` | `Melebur permintaan "user tidak perlu mengisi data berulang" (SRC-D) dengan biodata sign-up (SRC-E).` |
| `ACC-03` | `Tombol Pre-Registrasi (konfirmasi minat hadir) sekali klik bagi user yang sudah login` | `M` | `CPP-01` |  |
| `ACC-04` | `Dashboard Peserta: status pendaftaran lomba, e-ticket/QR, timeline personal, pengumuman, riwayat kunjungan booth` | `M` | `SRC-F, SRC-D 5, EV-18` | `Leadership menyebut "dashboard peserta" sebagai fitur wajib; SRC-D menyebut "dashboard pusat untuk memantau timeline". Dilebur menjadi satu halaman.` |
| `ACC-05` | `Role-Based Access Control sesuai daftar aktor 2` | `M` | `SRC-F 4` |  |
| `ACC-06` | `Layanan email transaksional terpusat: verifikasi akun, bukti registrasi lomba, e-ticket QR, notifikasi pengumuman` | `M` | `SH-02, EV-01, SP-02` | `Tiga bidang meminta email terpisah. Dilebur menjadi satu service dengan template berbeda.` |
| `ACC-07` | `Seluruh halaman informasi dapat diakses tanpa login; autentikasi hanya diminta pada titik aksi (daftar lomba, tandai hadir, RSVP, dashboard)` | `M` | `Prinsip 0.3, SRC-B, SRC-F` | `Menggantikan pernyataan SRC-D bahwa pengunjung wajib sign in sebelum mengunjungi web. Ditetapkan lewat D-01.` |
| `ACC-08` | `Akun Exhibitor: melihat statistik kunjungan booth miliknya sendiri` | `S` | `SRC-C 3` |  |
| `ACC-09` | `Lupa password / reset password aman` | `M` | `Turunan SRC-F 4` | `Tidak disebut eksplisit di dokumen mana pun; wajib secara teknis.` |

### **`4.2 LND — Landing & Narrative`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `LND-01` | `Countdown D-Day main event di landing page: hari (display terbesar), jam, menit, detik. State khusus H-7 s.d. H-1 (animasi/warna penanda kedekatan) dan H-0 (selebratif)` | `M` | `CPP-05, SRC-B 5, SRC-F 3, SRC-G` | `SRC-E menandai could-have; SRC-B dan SRC-F menjadikannya elemen sambutan utama → dinaikkan ke must. Berbeda dari CMP-03 (countdown deadline registrasi lomba) — dua timer berbeda, satu komponen yang sama.` |
| `LND-02` | `Impact Counter: jumlah pengunjung, exhibitor, kolaborator (angka besar, keterangan kecil), + total prize pool` | `M` | `CPP-04, SRC-D 1, SRC-G` | `Melebur "live counter pengunjung + prize pool" (SRC-D) dan "angka pengunjung/exhibitor/kolaborator" (SRC-E). Penempatan: lihat catatan di bawah tabel.` |
| `LND-03` | `Narasi scroll-based: fly-through kampus + narasi teknologi lintas disiplin (node neural network menyala satu per satu → transisi ke showcase siluet drone / robot SAR)` | `S` | `SRC-F 2, SRC-G, SRC-B` | `Diturunkan ke should karena bergantung pada aset 3D yang belum selesai (11 R-02) dan dibatasi anggaran performa 6.5. Fallback wajib disiapkan.` |
| `LND-04` | `Overview mata acara di halaman utama (referensi: petrolida.com)` | `M` | `SRC-C Extra Notes, SRC-F` |  |
| `LND-05` | `Key visual utama yang merepresentasikan identitas & tema besar acara, selaras GDV` | `M` | `SRC-B 5, SRC-F` | `Terblokir oleh finalisasi GDV — 11 R-01.` |
| `LND-06` | `Easter egg saat aksi unik tertentu dilakukan (animasi, perubahan warna, motion tambahan)` | `C` | `CB-01` |  |
| `LND-07` | `Deretan logo & tautan seluruh media sosial ITB Insight` | `S` | `CPP-06, SRC-D 1` |  |
| `LND-08` | `Navigasi utama yang intuitif dengan akses cepat ke Program, Competition, Map, Partnership` | `M` | `SRC-B 5, SRC-G (navbar)` |  |

### **`4.3 EVT — Event Information & Program`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `EVT-01` | `Halaman hub Program: exhibition, play-tech, show-tech, tech seminar, insight on stage, alumni gathering, Inspirates` | `M` | `EV-04, SRC-F` |  |
| `EVT-02` | `Halaman detail per program (deskripsi, waktu, lokasi, CTA)` | `M` | `EV-04, SRC-F` |  |
| `EVT-03` | `Session page untuk seminar / stage event: rundown, deskripsi, narasumber, jadwal` | `S` | `EV-11` |  |
| `EVT-04` | `Bookmark / pengingat sesi` | `C` | `EV-11` | `Dipisah dari EV-11 dan diturunkan: butuh notifikasi/kalender, bobot teknis jauh lebih besar dari halaman sesinya.` |
| `EVT-05` | `Direktori booth/wahana dengan pencarian & filter kategori (AI, energy, robotics, interactive games, dll.)` | `S` | `EV-09` | `Terhubung ke MAP-02 (data booth yang sama).` |
| `EVT-06` | `Halaman About: visi-misi ITB Insight, penjelasan HMFT-ITB & Teknik Fisika sebagai penyelenggara, sambutan Kaprodi` | `M` | `SRC-F 1` |  |
| `EVT-07` | `Timeline acara terpadu (pre-event → lomba → main event), interaktif` | `M` | `SRC-B 5, SRC-C, SRC-F` | `Timeline acara; timeline per mata lomba ada di CMP-02.` |
| `EVT-08` | `Integrasi tautan pendaftaran eksternal (GForm) dengan tombol/section terarah dan pelacakan klik keluar` | `M` | `EV-05` | `Ruang lingkup dipersempit oleh D-02. GForm hanya untuk alur bertaruh rendah (volunteer PRE-04, feedback Inspirates FBK-04) dan sebagai jalur cadangan bila pendaftaran in-website bermasalah. Bukan sumber data QR gate.` |
| `EVT-09` | `Halaman RSVP undangan bertoken: sambutan personal, form (nama, jabatan, asal institusi, email, status kehadiran: hadir / tidak hadir / diwakilkan), field tambahan otomatis untuk nama pengganti jika "diwakilkan", pesan sukses, email balasan berisi e-ticket QR + info lokasi` | `M` | `SP-02, SRC-F` | `Pembuatan QR-nya memakai QRS-01, bukan sistem terpisah.` |
| `EVT-10` | `Halaman Alumni Gathering: info, rundown, tautan RSVP` | `M` | `EV-07` |  |

### **`4.4 CMP — Competition`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `CMP-01` | `Hub Competition: 4 mata lomba dengan logo, penjelasan singkat, jenjang peserta, total prize pool keseluruhan, akses cepat` | `M` | `MH-01, MH-03, SRC-D 1` |  |
| `CMP-02` | `Halaman detail per mata lomba: deskripsi lengkap, persyaratan, timeline lomba (batch, tanggal), prize pool lomba, unduhan guidebook & silabus, contact person` | `M` | `MH-03, MH-05, MH-07, MH-06` | `Empat requirement asli dilebur karena keempatnya mendeskripsikan isi halaman yang sama.` |
| `CMP-03` | `Countdown deadline registrasi + tampilan registration fee per mata lomba` | `S` | `SH-04` | `Memakai komponen yang sama dengan LND-01 dengan target waktu berbeda.` |
| `CMP-04` | `Form pendaftaran tim: biodata ketua auto-prefill dari akun (ACC-02), data anggota, asal instansi` | `M` | `MH-01, SRC-D 7` |  |
| `CMP-05` | `Unggah berkas pendaftaran: KTM/kartu identitas, bukti follow Instagram, bukti share broadcast. Khusus lomba robot: unggah sketsa robot` | `M` | `MH-10, SRC-D 7` | `Bukti transfer dihapus dari daftar unggahan — status pembayaran kini datang dari webhook Midtrans (D-03), bukan dari verifikasi manual foto. Penanganan keamanan berkas identitas: 6.4.` |
| `CMP-06` | `Pengelompokan peserta otomatis sesuai mata lomba yang diikuti (basis data + tampilan admin)` | `M` | `MH-01` |  |
| `CMP-07` | `Email bukti/verifikasi penyelesaian registrasi` | `S` | `SH-02` | `Dieksekusi lewat ACC-06.` |
| `CMP-08` | `Halaman pengumuman: hasil seleksi (lolos / tidak lolos), panduan tahap semifinal & final, ditempatkan di bagian bawah halaman di atas footer sponsor` | `M` | `MH-09, SRC-D 5` | `MH-09 tidak diberi prioritas di dokumen asli; ditetapkan must karena alur pengguna SRC-D berakhir di sini.` |
| `CMP-09` | `Section CTA Registration + section "Contact Us" di bawahnya` | `S` | `MH-06` | `Contact Us memakai komponen INF-02.` |
| `CMP-10` | `Pembayaran biaya registrasi via Midtrans: pemilihan metode, halaman pembayaran, kembali ke website dengan status terbaca` | `M` | `SRC-D 5, D-03` | `Menggantikan alur unggah bukti transfer + verifikasi manual pada dokumen asli.` |
| `CMP-11` | `Ekspor data peserta ke Excel/CSV` | `M` | `SRC-D 3` | `Dieksekusi lewat ADM-04.` |
| `CMP-12` | `Status pembayaran pada pendaftaran: pending → paid / expired / failed / refunded, terlihat di dashboard peserta (ACC-04) dan panel panitia` | `M` | `Turunan D-03` | `Pendaftaran tanpa status paid tidak masuk hitungan peserta sah.` |
| `CMP-13` | `Webhook notifikasi Midtrans dengan verifikasi signature; status pembayaran hanya ditentukan dari webhook, tidak pernah dari redirect browser` | `M` | `Turunan D-03` | `Redirect klien dapat dipalsukan; ini adalah kontrol keamanan, bukan detail implementasi.` |
| `CMP-14` | `Nominal tagihan dihitung server-side dari konfigurasi mata lomba; klien tidak pernah mengirimkan nominal` | `M` | `Turunan D-03` | `Mencegah manipulasi harga.` |
| `CMP-15` | `Rekonsiliasi & laporan pembayaran untuk bendahara: order ID, tim, mata lomba, nominal, metode, status, waktu settlement` | `M` | `Turunan D-03` | `Diekspor lewat ADM-04.` |
| `CMP-16` | `Penanganan pembayaran kedaluwarsa/gagal: peserta dapat mengulang pembayaran tanpa mengisi ulang form pendaftaran` | `S` | `Turunan D-03` | `Tanpa ini, setiap VA yang kedaluwarsa menjadi tiket support manual.` |

### **`4.5 MAP — Interactive Campus Map`**

> **`Konsolidasi terbesar dalam dokumen ini.`** `Empat bidang meminta peta interaktif dengan tujuan berbeda. Dibangun satu peta dengan sistem layer yang bisa dinyalakan/dimatikan, bukan empat peta.`

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `MAP-01` | `Peta interaktif dasar Kampus Ganesha: zoom, pan, navigasi intuitif, mobile-first` | `M` | `SPON-01, EV-10, PD-01, SRC-F` |  |
| `MAP-02` | `Layer Booth & Zona Wahana — pin per booth, tautan ke detail booth, sinkron dengan filter EVT-05` | `S` | `EV-10, EV-09` |  |
| `MAP-03` | `Layer Sponsor Hotspot — pin booth eksklusif sponsor; klik memunculkan kartu profil perusahaan (deskripsi singkat + tombol "Visit Site")` | `M` | `SPON-01` |  |
| `MAP-04` | `Layer Megaprop & Photo Spot` | `C` | `PD-01` |  |
| `MAP-05` | `Layer Mobilisasi & Fasilitas — alur mobilisasi, gate, area parkir, fasilitas umum` | `S` | `SRC-F 1` |  |
| `MAP-06` | `Overlay heatmap pengunjung real-time` | `C` | `EV-21` | `Bergantung pada volume data QRS-04.` |

> **`Kepemilikan konten peta.`** `Satu peta dengan empat pemangku kepentingan memerlukan satu pemilik data. Lihat Keputusan D-06.`

### **`4.6 QRS — On-site QR, Check-in & Tracking`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `QRS-01` | `Generator QR otomatis + pengiriman ke email peserta saat registrasi/pre-regis/RSVP selesai` | `M` | `EV-01, SP-02` | `Dilebur: SRC-C meminta QR dari data GForm, SRC-E meminta e-ticket QR untuk tamu undangan. Satu generator, satu format token, tiga pemicu.` |
| `QRS-02` | `Scanner check-in gate untuk panitia: validasi real-time, menampilkan Nama + Status Registration` | `M` | `EV-01` |  |
| `QRS-03` | `Pencarian manual di gate sebagai fallback bila QR bermasalah` | `M` | `EV-03` |  |
| `QRS-04` | `QR unik per booth/wahana; pemindaian mencatat kunjungan per titik, giving points` | `M` | `EV-02` |  |
| `QRS-05` | `Dependensi gate → booth: scan booth hanya aktif untuk user yang sudah check-in di gate` | `S` | `EV-08` |  |
| `QRS-06` | `Tandai hadir mandiri (self check-in) via scan QR venue, tanpa mengisi form` | `M` | `CPP-02` | `Dilebur dengan QRS-02: keduanya menghasilkan event check-in yang sama. Perbedaannya hanya siapa yang memegang pemindai.` |
| `QRS-07` | `Perlindungan double-count: satu identitas hanya menghasilkan satu check-in valid` | `M` | `EV-01, EV-17` |  |
| `QRS-08` | `Pembaca QR tertanam di website (kamera browser), tanpa aplikasi terpisah` | `M` | `SRC-E 8` |  |
| `QRS-09` | `Gamifikasi: poin berdasarkan jumlah booth dikunjungi` | `C` | `EV-16` |  |
| `QRS-10` | `Progress tracker & leaderboard (mis. 15/25 booth)` | `C` | `EV-18` |  |
| `QRS-11` | `Klaim hadiah setelah mencapai ambang poin, dengan penjagaan double-claim` | `C` | `EV-17` |  |

### **`4.7 FBK — Feedback`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `FBK-01` | `Mesin feedback tunggal dengan form yang dapat dikonfigurasi per konteks, tanpa meminta ulang biodata` | `M` | `CPP-03` | `Satu engine melayani tiga konteks di bawah.` |
| `FBK-02` | `Feedback keseluruhan ITB Insight: muncul otomatis setelah tandai hadir; scan ulang QR langsung mengarah ke form feedback` | `M` | `CPP-03A` |  |
| `FBK-03` | `Feedback per booth via QR booth` | `C` | `CPP-03B` |  |
| `FBK-04` | `Feedback Inspirates: rating bintang + komentar tertanam, atau redirect GForm` | `S` | `EV-13` | `GForm diperbolehkan di sini — termasuk alur bertaruh rendah menurut D-02.` |
| `FBK-05` | `Visualisasi feedback di dashboard panitia: rata-rata rating, jumlah feedback, peringkat booth` | `C` | `EV-23` |  |

### **`4.8 PRT — Partnership & Sponsorship`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `PRT-01` | `Halaman Partnership: profil program kerjasama (Play-Tech / Show-Tech), penjelasan tier` | `M` | `SRC-A 5, SRC-F` |  |
| `PRT-02` | `Tiered Partnership Wall: logo mitra dikelompokkan Diamond / Gold / Silver / Bronze; responsif, jernih, efek visual seragam (soft shadow atau grayscale→color)` | `M` | `SPON-02` | `Di-embed di homepage (area footer) dan halaman Partnership — satu komponen, dua penempatan.` |
| `PRT-03` | `Media Partner Wall — jajaran logo media partner besar` | `S` | `SP-01` | `Komponen yang sama dengan PRT-02 dengan konfigurasi tier berbeda.` |
| `PRT-04` | `Spotlight sponsor besar: halaman/section khusus berisi profil dan deskripsi kontribusi` | `S` | `SRC-F 1` |  |
| `PRT-05` | `Form Inquiry Partnership terpadu dengan pemilih Jenis Kerjasama (Sponsorship / Media Partner / Kolaborasi Lain). Field wajib: Nama Instansi, Jabatan/Contact Person, Bidang Industri, Skala Kerjasama, Email, deskripsi pengajuan (long text). Submission ter-rute otomatis ke database internal + email bidang terkait` | `M` | `SPON-03, SP-03` | `Dua bidang meminta form yang hampir identik (SRC-A untuk sponsor, SRC-E untuk media partner). Dilebur menjadi satu form dengan routing. Menghemat satu alur build penuh.` |
| `PRT-06` | `Verifikasi email domain perusahaan sebelum pengajuan diterima` | `C` | `SP-03` | `SRC-E menjadikannya syarat; ditandai could karena verifikasi domain menambah friksi pada P-05 (mitra sulit menjangkau). Alternatif: verifikasi manual oleh panitia.` |
| `PRT-07` | `Pelacakan klik logo sponsor untuk bahan laporan pertanggungjawaban ke mitra` | `C` | `SPON-04` |  |
| `PRT-08` | `CMS logo & tier mitra — panitia dapat memperbarui sendiri seiring masuknya kerjasama baru` | `S` | `SRC-A 8` | `Diangkat dari "asumsi" di dokumen asli menjadi requirement eksplisit, karena tanpa ini asumsinya tidak terpenuhi.` |

### **`4.9 PRE — Pre-Event`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `PRE-01` | `Halaman Inspirates: tujuan kegiatan, overview program, sekolah/daerah yang terlibat, highlight kontribusi ke main event` | `M` | `EV-07, SRC-C 6` |  |
| `PRE-02` | `Panel input rekap Inspirates untuk panitia: jumlah peserta per sekolah / per kegiatan, masuk ke dashboard` | `M` | `EV-06` |  |
| `PRE-03` | `Ringkasan aktivitas Inspirates: deskripsi kegiatan per sekolah, daftar anggota yang melakukan diseminasi` | `S` | `EV-15` |  |
| `PRE-04` | `Halaman Volunteer: info open volunteer, deskripsi role, tautan GForm` | `S` | `EV-14` |  |
| `PRE-05` | `Highlight konten digital Inspirates: infografis, teaser, materi edukasi yang dapat diakses ulang setelah kegiatan` | `C` | `EV-19` |  |

### **`4.10 GAL — Media & Gallery`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `GAL-01` | `Galeri dokumentasi ITB Insight sebelumnya, terorganisir per tahun/kegiatan` | `M` | `DCC-01` |  |
| `GAL-02` | `Embed aftermovie` | `S` | `DCC-01` | `Dipisah dari GAL-01: bergantung pada ketersediaan aset video.` |
| `GAL-03` | `Penempatan foto beresolusi tinggi kesuksesan ITB Insight 2019 pada halaman Partnership sebagai bukti skala pengunjung` | `M` | `SRC-A 6` | `Aset yang sama dengan GAL-01, konteks penempatan berbeda.` |
| `GAL-04` | `Berbagi otomatis ke media sosial dari dalam website` | `C` | `EV-22` |  |

### **`4.11 ADM — Admin Dashboard & Analytics`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `ADM-01` | `Database terpusat + dashboard panitia: data pengunjung, scan booth, rekap partisipasi` | `M` | `EV-03` |  |
| `ADM-02` | `Analitik acara: total visitor, booth paling ramai, konversi gate→booth, partisipasi per zona` | `S` | `EV-12` |  |
| `ADM-03` | `Alat pencarian & koreksi data manual` | `M` | `EV-03` |  |
| `ADM-04` | `Ekspor data ke Excel/CSV (peserta lomba, pengunjung, feedback, RSVP)` | `M` | `SRC-D 3` |  |
| `ADM-05` | `Integrasi web analytics platform (PostHog) untuk total web visit sebagai leverage sponsor` | `S` | `SRC-E Extra Notes (WebDev)` |  |
| `ADM-06` | `Audit log untuk seluruh akses data sensitif` | `M` | `SRC-F 4` |  |
| `ADM-07` | `Rekomendasi booth otomatis berbasis preferensi user` | `C` | `EV-20` |  |

### **`4.12 INF — Informational & Support`**

| `ID` | `Requirement` | `Prio` | `SourceID` | `Normalized From` |
| :---- | :---- | :---- | :---- | :---- |
| `INF-01` | `FAQ berkategori: umum, kompetisi (cara daftar, kapan diselenggarakan), sponsorship` | `M` | `MH-08, SRC-F` |  |
| `INF-02` | `Contact / Contact Us: narahubung umum, per bidang, dan per mata lomba; tautan WhatsApp` | `M` | `MH-06, MH-08, SRC-D 2, SRC-F` | `Melebur "contact us" SRC-D dan "FAQ & Contact" SRC-F.` |
| `INF-03` | `Pusat unduhan dokumen: guidebook, rulebook, silabus — konsisten dengan GDV` | `M` | `SRC-B 5, MH-05` |  |
| `INF-04` | `Pencarian global di website` | `C` | `SRC-G (ikon search pada navbar)` | `Berasal dari wireframe, bukan teks requirement — perlu konfirmasi.` |
| `INF-05` | `Halaman kebijakan privasi & consent pengumpulan data` | `M` | `Turunan SRC-F 4` | `Tidak diminta bidang mana pun; wajib karena volume data pribadi yang dikumpulkan.` |
| `INF-06` | `Halaman sukses/konfirmasi dengan animasi loading sederhana dan pesan "See You in [countdown]"` | `S` | `SRC-B 5` | `Berlaku untuk semua submission form di website.` |

### **`4.13 Won't-Have (Siklus Ini)`**

`Ditetapkan keluar cakupan agar tidak muncul kembali sebagai permintaan sisipan:`

| `Item` | `Alasan` |
| :---- | :---- |
| `Aplikasi mobile native` | `Website responsif sudah memenuhi kebutuhan hari-H (SRC-A 8).` |
| `Dwibahasa penuh ID/EN` | `Tidak diminta bidang mana pun; biaya konten tinggi. Naikkan jika target pengunjung internasional berubah.` |
| `Sistem registrasi kompleks untuk Inspirates` | `SRC-C 8 secara eksplisit menyatakan pencatatan manual sudah cukup.` |
| `Live streaming di website` | `Tidak ada bidang yang memintanya.` |

## **`5. Alur Pengguna Terpadu`**

`Lima dokumen mendeskripsikan alur yang saling beririsan. Berikut versi tunggal per aktor.`

### **`J-1 · Pengunjung Umum (A-01 → A-02)`**

1. `Membuka landing page → disambut key visual + countdown D-Day (LND-01, LND-05).`
2. `Scroll → narasi visual + Impact Counter (LND-02, LND-03).`
3. `Menjelajah Program / Competition / Map tanpa login (ACC-07).`
4. `Mendaftar akun & mengisi biodata sekali (ACC-01, ACC-02).`
5. `Menekan tombol Pre-Registrasi → pesan sukses "Kami tunggu di ITB Insight!" + e-ticket QR terkirim ke email (ACC-03, QRS-01, INF-06).`

### **`J-2 · Pengunjung Hari-H`**

1. `Tiba di gate → QR di-scan panitia atau scan QR venue mandiri (QRS-02 / QRS-06).`
2. `Sistem memvalidasi real-time, menampilkan Nama + Status; double-count dicegah (QRS-07).`
3. `Halaman konfirmasi mengarahkan ke feedback (FBK-02) dan/atau eksplorasi booth.`
4. `Mengunjungi booth → scan QR booth → kunjungan tercatat (QRS-04, QRS-05).`
5. `Melihat progress/poin bila gamifikasi aktif (QRS-09, QRS-10).`
6. `Scan ulang QR utama → langsung diarahkan ke form feedback (FBK-02).`

### **`J-3 · Peserta Lomba (A-03)`**

1. `Membuka /competition → melihat 4 mata lomba + penjelasan singkat + total prize pool (CMP-01).`
2. `Menekan logo lomba → halaman detail: persyaratan, timeline, prize pool, guidebook & silabus, contact person (CMP-02).`
3. `Menekan Daftar → bila belum login, diarahkan ke sign-in lalu kembali ke titik semula (ACC-01, ACC-07).`
4. `Form pendaftaran terisi sebagian otomatis dari profil; melengkapi data tim & anggota (CMP-04).`
5. `Mengunggah berkas: identitas, bukti follow IG, bukti share BC, sketsa robot bila relevan (CMP-05). Bukti transfer tidak diunggah; pembayaran diproses Midtrans dan statusnya datang dari webhook (D-03, CMP-10…CMP-16).`
6. `Submit → animasi loading → halaman pembayaran Midtrans → kembali ke website dengan status yang dibaca dari webhook, bukan redirect browser (CMP-10, CMP-13, INF-06).`
7. `Memantau status pendaftaran, pembayaran, dan timeline di dashboard peserta (ACC-04, CMP-12).`
8. `Saat waktunya, melihat pengumuman hasil & panduan tahap lanjut (CMP-08).`

### **`J-4 · Tamu Undangan (A-05)`**

1. `Menerima tautan bertoken via WhatsApp/email bersama surat undangan resmi.`
2. `Membuka /rsvp/[token] → halaman sambutan eksklusif (EVT-09).`
3. `Mengisi konfirmasi: nama, jabatan, asal institusi, email, status kehadiran. Memilih "diwakilkan" → field nama pengganti muncul otomatis.`
4. `Submit → pesan terima kasih → email balasan berisi e-ticket QR + info lokasi (QRS-01, ACC-06).`
5. `Hari-H: scan di meja registrasi khusus, dibantu LO (QRS-02).`

### **`J-5 · Calon Sponsor / Media Partner (A-06, A-07)`**

1. `Mengakses landing page → menu Partnership (PRT-01).`
2. `Membaca profil program (Play-Tech / Show-Tech), tier, dan dokumentasi 2019 sebagai bukti skala (PRT-01, GAL-03).`
3. `Melihat potensi lokasi booth via peta interaktif (MAP-01, MAP-03).`
4. `Mengisi Form Inquiry Partnership dengan memilih jenis kerjasama (PRT-05).`
5. `Submission ter-rute ke bidang terkait; pemohon menerima konfirmasi (ACC-06).`

### **`J-6 · Panitia Lapangan (A-09)`**

1. `Login ke /admin/gate atau /admin/booth (ACC-05).`
2. `Memindai QR pengunjung; melihat validasi real-time (QRS-02).`
3. `Bila QR bermasalah → pencarian manual berdasarkan nama/email (QRS-03).`

### **`J-7 · Panitia Bidang & Admin (A-10, A-11)`**

1. `Login ke /admin → melihat dashboard sesuai cakupan bidangnya (ACC-05, ADM-01).`
2. `Memantau total visitor, scan booth, partisipasi per zona (ADM-02).`
3. `Input rekap manual Inspirates per sekolah (PRE-02).`
4. `Mengelola logo & tier mitra (PRT-08).`
5. `Mengekspor data atau melihat ringkasan performa (ADM-04).`

### **`J-8 · Peserta & Tim Inspirates (A-04)`**

1. `Membuka halaman Inspirates → info kegiatan, sekolah terlibat, tujuan program (PRE-01).`
2. `Bila perlu, menekan tautan GForm untuk RSVP/volunteer (EVT-08, PRE-04).`
3. `Saat kegiatan berlangsung, panitia mencatat jumlah peserta per sekolah (PRE-02).`
4. `Setelah kegiatan, peserta mengisi feedback — tertanam atau via GForm (FBK-04).`
5. `Mengakses ulang materi/infografis lewat halaman yang sama (PRE-05).`

---

# **`BAB III`** **`TECHNICAL DETAILS`**

## **`6. Technical Requirements`**

### **`6.1 Tech Stack & Architecture`**

| `Lapisan` | `Ketetapan` | `Status` |
| :---- | :---- | :---- |
| `Rendering halaman publik` | `SSR/SSG wajib untuk seluruh halaman informasi — prasyarat target SEO 6.6 dan performa 6.5` | `Ditetapkan` |
| `Motion & 3D` | `Three.js + GSAP ScrollTrigger + Lenis untuk narasi scroll` | `Target requirement; current runtime has Three.js but GSAP/Lenis are not installed` |
| `Backend & database` | `Perlu konfirmasi — lihat Keputusan D-04` | `Terbuka` |
| `Autentikasi` | `Email/password + Google OAuth, sesi ber-expiry, hashing password modern` | `Ditetapkan` |
| `Penyimpanan berkas` | `Object storage terpisah dari database, akses via signed URL berumur pendek` | `Ditetapkan` |
| `Edge / proteksi` | `Cloudflare (WAF, rate limiting, CDN aset statis)` | `Ditetapkan` |
| `Pembayaran` | `Midtrans (Snap/hosted page + webhook notifikasi) — data kartu tidak pernah menyentuh server ITB Insight` | `Ditetapkan (D-03)` |
| `Analytics` | `PostHog (ADM-05) + Google Search Console` | `Ditetapkan` |

### **`6.2 Core Data Entities`**

`Model data tunggal yang melayani seluruh bidang — bukan tabel terpisah per bidang.`

| `Entitas` | `Isi Pokok` | `Modul Pemakai` |
| :---- | :---- | :---- |
| `User` | `Kredensial, role, status verifikasi` | `ACC, semua` |
| `Profile` | `Nama, email, no. HP, instansi, kategori pengguna` | `ACC, CMP, FBK` |
| `Ticket` | `Token QR, tipe (pre-regis / RSVP / peserta lomba), status` | `QRS, EVT-09` |
| `CheckIn` | `Referensi tiket, waktu, gate, petugas` | `QRS, ADM` |
| `Booth` | `Nama, kategori, exhibitor, koordinat peta, QR` | `EVT-05, MAP, QRS` |
| `ScanEvent` | `User, booth, waktu — idempoten per pasangan` | `QRS, ADM` |
| `Team` | `Nama tim, ketua, anggota, mata lomba` | `CMP` |
| `CompetitionEntry` | `Tim, mata lomba, status pembayaran, status seleksi` | `CMP, ADM` |
| `Payment` | `Order ID, entry, nominal (server-side), metode, status, payload webhook, waktu settlement` | `CMP-10…CMP-16, ADM` |
| `Upload` | `Berkas terenkripsi, pemilik, klasifikasi sensitivitas` | `CMP-05` |
| `FeedbackResponse` | `Konteks (event / booth / inspirates), rating, komentar` | `FBK` |
| `Partner` | `Nama, logo, tier, tautan, koordinat hotspot` | `PRT, MAP-03` |
| `PartnershipInquiry` | `Jenis kerjasama, instansi, CP, deskripsi, status tindak lanjut` | `PRT-05` |
| `RSVPInvite` | `Token, penerima, status kehadiran, nama pengganti` | `EVT-09` |
| `InspiratesRecord` | `Sekolah, tanggal, jumlah peserta, anggota diseminasi` | `PRE-02` |
| `Program / Session` | `Judul, deskripsi, jadwal, lokasi, narasumber` | `EVT` |

**`Kunci penghubung antar sistem:`** `email (lowercase, ternormalisasi) adalah kunci join antara data website dan data GForm cadangan. Karena D-02 menetapkan akun website sebagai jalur utama, GForm hanya perlu direkonsiliasi bila jalur cadangan benar-benar dipakai — namun kunci join tetap wajib ada sejak awal, karena rekonsiliasi darurat tidak bisa dirancang saat keadaan darurat sudah terjadi.`

### **`6.3 External Integrations`**

| `Integrasi` | `Kebutuhan` | `Modul` |
| :---- | :---- | :---- |
| `Google OAuth` | `Sign in with Google` | `ACC-01` |
| `Google Forms` | `Jalur cadangan + alur bertaruh rendah (volunteer, feedback Inspirates). Prosedur fallback: bila registrasi in-website down, GForm diaktifkan, hasilnya diimpor manual dengan email sebagai kunci sebelum QR digenerasi` | `EVT-08, FBK-04, PRE-04` |
| `Google Sheets / Drive` | `Ekspor & berkas guidebook` | `ADM-04, INF-03` |
| `Layanan email transaksional` | `Verifikasi, e-ticket, notifikasi` | `ACC-06` |
| `WhatsApp deep link` | `Contact person per lomba & per bidang` | `INF-02` |
| `Midtrans` | `Pembayaran biaya registrasi lomba + webhook status` | `CMP-10, CMP-13` |
| `PostHog` | `Web analytics` | `ADM-05` |
| `Peta` | `Basis peta kampus — aset internal (bukan Google Maps API), lihat 7.2` | `MAP-01` |

### **`6.4 Security & Privacy`**

`Prioritas tertinggi Leadership: "Pimpinan paling anti dengan berita 'Data Peserta ITB Insight Bocor'."`

| `Kode` | `Kontrol` | `SourceID` |
| :---- | :---- | :---- |
| `SEC-01` | `Enkripsi data peserta saat transit (TLS) dan saat diam (at rest)` | `SRC-F` |
| `SEC-02` | `Hashing password dengan algoritma modern; rate limiting pada endpoint login & reset` | `SRC-F` |
| `SEC-03` | `Data pribadi (email, no. HP, dokumen identitas) hanya dapat diakses panitia berwenang sesuai RBAC` | `SRC-F` |
| `SEC-04` | `Audit log untuk setiap akses & ekspor data sensitif` | `SRC-F, ADM-06` |
| `SEC-05` | `Role-based access control: admin, panitia bidang, panitia lapangan, exhibitor, peserta, pengunjung` | `SRC-F` |
| `SEC-06` | `Berkas identitas (KTM/kartu identitas) disimpan di bucket privat, hanya via signed URL berumur pendek, tidak pernah di-serve publik` | `Turunan CMP-05` |
| `SEC-07` | `Kebijakan retensi: dokumen identitas dihapus maksimal 60 hari setelah acara selesai` | `Turunan SRC-F` |
| `SEC-08` | `Proteksi CSRF, XSS, dan IDOR pada seluruh endpoint bertoken (khususnya /rsvp/[token] dan berkas unggahan)` | `Praktik WebDev` |
| `SEC-09` | `WAF & bot protection di edge sebelum pembukaan registrasi` | `Praktik WebDev` |
| `SEC-10` | `Consent eksplisit + tautan kebijakan privasi pada setiap form pengumpulan data` | `INF-05` |
| `SEC-11` | `Verifikasi signature pada setiap webhook Midtrans; endpoint webhook idempoten terhadap notifikasi ganda` | `Turunan D-03` |
| `SEC-12` | `Kredensial Midtrans (server key) hanya di environment variable sisi server; tidak pernah ada di bundle klien` | `Turunan D-03` |
| `SEC-13` | `Tidak ada data kartu/rekening yang disimpan di sistem ITB Insight — seluruh input pembayaran terjadi di halaman Midtrans` | `Turunan D-03` |

> **`Peringatan cakupan.`** `CMP-05 mengumpulkan foto kartu identitas. Ini kelas data paling sensitif di seluruh proyek dan satu-satunya yang, bila bocor, langsung memenuhi skenario yang paling dikhawatirkan Leadership. Bukti transfer tidak diunggah; status pembayaran datang dari webhook Midtrans (D-03). SEC-06 dan SEC-07 bersifat wajib, bukan opsional.`

### **`6.5 Reliability & Performance`**

| `Kode` | `Target` | `SourceID` |
| :---- | :---- | :---- |
| `PERF-01` | `Loading time < 3 detik pada koneksi 3G` | `SRC-F 5` |
| `PERF-02` | `Skor Google Lighthouse > 80` | `SRC-F 5` |
| `PERF-03` | `Uptime 99,9% selama periode registrasi lomba dan H-7 s.d. H+1` | `SRC-F 4` |
| `PERF-04` | `Rencana scaling untuk lonjakan trafik saat pembukaan registrasi & hari-H` | `SRC-F 4` |
| `PERF-05` | `Monitoring uptime + alert otomatis bila server down` | `SRC-F 4` |
| `PERF-06` | `Backup database berkala, minimum harian` | `SRC-F 4` |
| `PERF-07` | `Anggaran berat halaman: hero + narasi scroll maksimum 2,5 MB setelah kompresi pada viewport mobile` | `Turunan PERF-01` |
| `PERF-08` | `Seluruh aset animasi memiliki fallback statis dan menghormati prefers-reduced-motion` | `Turunan SRC-B 2` |

> **`Konflik yang perlu disadari.`** `SRC-G menetapkan implementasi narasi kampus sebagai GIF untuk mengurangi beban. GIF adalah format terberat untuk kasus ini — sebuah sekuens fly-through dalam GIF dapat berukuran 8–20× lebih besar dari video atau sprite yang setara, dan akan melanggar PERF-01, PERF-02, serta PERF-07 sekaligus. Rekomendasi teknis: pertahankan pipeline 3D dan deliverable-nya, tapi ganti format keluaran ke WebM/AV1 atau sprite sequence. Lihat Keputusan D-05.`

### **`6.6 SEO & Discoverability`**

| `Kode` | `Requirement` | `SourceID` |
| :---- | :---- | :---- |
| `SEO-01` | `Target masuk 3 besar Google untuk kata kunci seperti "festival teknologi mahasiswa 2026" dan "lomba robot nasional 2026"` | `SRC-F 5` |
| `SEO-02` | `Seluruh halaman publik ter-render server-side & crawlable — konsekuensi langsung dari ACC-07` | `Turunan SEO-01` |
| `SEO-03` | `Structured data Event untuk main event, kompetisi, dan sesi seminar` | `Turunan SEO-01` |
| `SEO-04` | `Sitemap, meta description, dan Open Graph image per halaman` | `Turunan SEO-01` |
| `SEO-05` | `Pemantauan via Google Search Console: impressions, CTR, average position` | `SRC-F 5` |

> **`Terselesaikan lewat D-01.`** `Browsing publik ditetapkan, sehingga SEO-01 dapat dikejar. Konsekuensinya mengikat: tidak boleh ada halaman informasi yang di kemudian hari dipindahkan ke belakang login tanpa meninjau ulang target SEO-01.`

### **`6.7 Technical Assumptions`**

| `#` | `Asumsi` | `SourceID` | `Risiko bila salah` |
| :---- | :---- | :---- | :---- |
| `T-01` | `Website akan sering diakses dari perangkat mobile di lokasi acara → mobile-first, bukan mobile-friendly` | `SRC-A 8` | `Peta & scanner tidak terpakai di lapangan` |
| `T-02` | `Sistem QR gate dan booth harus saling terhubung agar data tidak dobel` | `SRC-C 8` | `Angka pengunjung tidak dapat dipertanggungjawabkan` |
| `T-03` | `Inspirates tidak memerlukan sistem registrasi kompleks; pencatatan manual lalu direkap` | `SRC-C 8` | `—` |
| `T-04` | `Data logo mitra akan diperbarui berkala seiring masuknya kerjasama baru` | `SRC-A 8` | `Ditutup oleh PRT-08` |
| `T-05` | `Koneksi internet di venue cukup stabil untuk scanning real-time` | `Tidak dinyatakan` | `Gate macet saat hari-H — perlu mode offline queue` |
| `T-06` | `Jumlah booth, kategori, dan koordinatnya tersedia sebelum peta dibangun` | `Tidak dinyatakan` | `MAP & EVT-05 tertunda` |

---

# **`BAB IV`** **`VISUAL DESIGN & ASSETS`**

## **`7. Kebutuhan Desain, Motion & Aset`**

### **`7.1 Design System`**

| `Aspek` | `Ketetapan` | `SourceID` |
| :---- | :---- | :---- |
| `Warna & tipografi` | `Mengikuti GDV Creative Branding; minor tweak diperbolehkan bila diperlukan` | `SRC-B 6` |
| `Tema dasar` | `Dark-mode dengan elemen futuristik` | `SRC-D 6` |
| `Karakter visual` | `Modern, bersih, profesional pada area partnership; energetik dan naratif pada area publik` | `SRC-A 6, SRC-F` |
| `Responsivitas` | `Layout tetap konsisten dan rapi di seluruh ukuran layar` | `SRC-B 6` |
| `Micro-interaction` | `Efek emphasis (glow, grow, pergerakan halus) pada kartu lomba, tombol pendaftaran, galeri dokumentasi` | `SRC-B 6` |
| `Ikonografi` | `Tidak ada ikon ambigu; setiap ikon aksi disertai label teks` | `SRC-B 5` |

> **`Ketergantungan blocking.`** `SRC-G menyatakan GDV belum final sehingga tim 3D diminta membebaskan warna dulu, sementara SRC-B mensyaratkan seluruh visual selaras GDV. Selama GDV belum final, semua aset 3D dan komponen UI berwarna berstatus sementara. Lihat 11 R-01.`

### **`7.2 Scroll Narration Scene Mapping`**

`Kamera bergerak dari view gedung kembar (Plawid) hingga kolam InTel, dipicu oleh scroll dimulai dari view countdown (SRC-G).`

| `#` | `Section Website` | `Scene Kampus` | `Referensi Visual` | `Modul` |
| :---- | :---- | :---- | :---- | :---- |
| `S-1` | `Login / Sign-up` | `Gerbang masuk ITB — kesan "baru masuk"` | `[Insert Image 1], [Insert Image 2]` | `ACC-01` |
| `S-2` | `Hero + Countdown` | `Boulevard gedung kembar (Plawid), Monumen Kubus (In Harmonia Progressio)` | `[Insert Image 3], [Insert Image 4]` | `LND-01` |
| `S-3` | `About / Insight` | `Fasad Labtek dengan laser show "ITB Insight" pada dinding jendela atas; posisi kamera agak tinggi` | `[Insert Image 5], [Insert Image 6], [Insert Image 7]` | `EVT-06` |
| `S-4` | `Impact Counter` | `Kolam & air mancur InTel; POV menghadap kolam` | `[Insert Image 8], [Insert Image 9]` | `LND-02` |
| `S-5` | `Gallery` | `Tanpa background kampus (blank)` | `[Insert Image 10]` | `GAL-01` |
| `S-6` | `Media Partners + Footer` | `Tanpa background kampus (blank)` | `[Insert Image 11]` | `PRT-02, PRT-03` |

**`Arahan tambahan untuk tim 3D (SRC-G):`**

- `Gaya low-poly, berwarna. Bentuk 3D atau semi-3D menyesuaikan shot yang diperlukan.`
- `Referensi POV disarankan diambil dari rekaman perjalanan langsung ke ITB; bila tidak memungkinkan, gunakan Google Maps Street View.`
- `Scene "sisaan" yang tidak terpakai dapat dijadikan background halaman lain.`
- `Model drone dijeda; prioritas pada model ITB.`
- `Penyesuaian dan ide tambahan dipersilakan — koordinasikan dengan Fathir.`
- **`Referensi motion:`** `themonolithproject.net (contoh utama), jreyes-mc-portfolio.com.`

### **`7.3 Ekspektasi Motion & Wow Factor`**

| `Kode` | `Requirement` | `Prio` | `SourceID` |
| :---- | :---- | :---- | :---- |
| `VIS-01` | `Transisi scroll-based bernarasi: neural network node menyala satu per satu → showcase siluet drone terbang, robot SAR bergerak` | `S` | `SRC-F 2, 3` |
| `VIS-02` | `Countdown dinamis yang terintegrasi dengan elemen visual utama, bukan komponen terpisah` | `M` | `SRC-F 3, LND-01` |
| `VIS-03` | `Peta acara interaktif dengan navigasi intuitif sebagai pilar wow factor` | `M` | `SRC-F 3, MAP-01` |
| `VIS-04` | `Animasi physics-based yang akurat sebagai ciri khas Teknik Fisika (simulasi partikel interaktif, mekanika fluida)` | `C` | `SRC-F 2` |
| `VIS-05` | `Visual bertema keberlanjutan lingkungan & teknologi hijau` | `S` | `SRC-F 2` |
| `VIS-06` | `Animasi loading sederhana pada setiap submit form` | `S` | `SRC-B 5` |

> **`Catatan realisme untuk VIS-04.`** `Leadership mengharapkan kesan "kayak beneran physics simulation", sementara SRC-G merencanakan sekuens pre-rendered. Keduanya bisa hidup berdampingan bila simulasi partikel/fluida yang benar-benar interaktif dibatasi pada satu elemen kecil (mis. hero atau easter egg LND-06), bukan pada seluruh narasi scroll. Menjadikannya interaktif secara menyeluruh akan melanggar PERF-01 dan PERF-07.`

### **`7.4 Accessibility Gate`**

`Diturunkan langsung dari masalah yang dinyatakan Creative Branding (SRC-B 2). Ini adalah batas, bukan saran.`

| `Kode` | `Pagar` |
| :---- | :---- |
| `ACS-01` | `Rasio kontras teks memenuhi WCAG AA minimum, termasuk teks di atas background 3D/gambar` |
| `ACS-02` | `Tidak ada satu halaman pun yang dipadati teks penuh; panjang blok teks dibatasi dan dipecah secara visual` |
| `ACS-03` | `Setiap ikon aksi disertai label; tidak ada navigasi yang hanya bergantung pada ikon` |
| `ACS-04` | `Seluruh animasi dapat dinonaktifkan lewat prefers-reduced-motion (PERF-08)` |
| `ACS-05` | `Jumlah elemen dekoratif per viewport dibatasi untuk menghindari visual overload & fatigue` |
| `ACS-06` | `Konten inti tetap dapat diakses bila JavaScript animasi gagal dimuat` |
| `ACS-07` | `Bahasa konten dapat dipahami rentang siswa SMA hingga profesional industri (SRC-F)` |

### **`7.5 Register Aset & Kepemilikan`**

`Setiap baris adalah blocker bagi modul di kolom terakhir.`

| `Aset` | `Pemilik` | `Status` | `Memblokir` |
| :---- | :---- | :---- | :---- |
| `GDV final (warna, tipografi, key visual)` | `Creative Branding` | `Belum final` | `LND-05, seluruh 7.1` |
| `Model 3D & sekuens kampus` | `Tim 3D Design (via Fathir)` | `Target 14 Agustus` | `LND-03, S-1…S-6` |
| `Basis peta Kampus Ganesha + koordinat booth` | `Belum ditetapkan (lihat D-06)` | `Belum ada` | `MAP-01…MAP-05` |
| `Logo mitra resolusi tinggi` | `Sponsorship` | `Bertahap` | `PRT-02` |
| `Logo media partner` | `Marketing / SP` | `Bertahap` | `PRT-03` |
| `Dokumentasi & aftermovie ITB Insight sebelumnya` | `Creative Branding / DCC` | `Belum diserahkan` | `GAL-01, GAL-02, GAL-03` |
| `Guidebook & silabus 4 mata lomba` | `Competition` | `Belum diserahkan` | `CMP-02, INF-03` |
| `Daftar booth + kategori + exhibitor` | `Event` | `Belum diserahkan` | `EVT-05, MAP-02, QRS-04` |
| `Rundown, narasumber, jadwal sesi` | `Event` | `Belum diserahkan` | `EVT-03` |
| `Copywriting seluruh halaman` | `Marketing` | `Menunggu finalisasi` | `Seluruh halaman` |
| `Isi form feedback` | `Marketing` | `Akan menyusul` | `FBK-01` |
| `Daftar sekolah & anggota diseminasi Inspirates` | `Event` | `Berjalan` | `PRE-03` |
| `Sambutan Kaprodi + foto` | `Leadership` | `Belum diserahkan` | `EVT-06` |
| `Nominal prize pool per lomba & total` | `Competition` | `Belum diserahkan` | `CMP-01, LND-02` |
| `Tanggal pasti main event & deadline registrasi` | `Event / Competition` | `Belum diserahkan` | `LND-01, CMP-03` |
| `Akun merchant Midtrans terverifikasi + kredensial produksi` | `Bendahara / Ring 0-1` | `Belum ada — lihat D-09` | `CMP-10…CMP-16` |

---

## **`8. Register Gambar`**

`Seluruh gambar dari dokumen sumber dikumpulkan di sini. Isi kolom placeholder saat dokumen dipindahkan ke format final.`

| `ID` | `Placeholder` | `Deskripsi Gambar` | `Dokumen Sumber` | `Dirujuk di Section` |
| :---- | :---- | :---- | :---- | :---- |
| `IMG-01` | `[Insert Image 1]` | `Wireframe halaman Log in & Sign up (varian terang dan gelap)` | `SRC-G` | `7.2 S-1` |
| `IMG-02` | `[Insert Image 2]` | `Foto referensi gerbang masuk ITB — kesan "baru masuk"` | `SRC-G` | `7.2 S-1` |
| `IMG-03` | `[Insert Image 3]` | `Wireframe hero countdown "INSIGHT ITB" dengan tombol Register` | `SRC-G` | `7.2 S-2, 4.2 LND-01` |
| `IMG-04` | `[Insert Image 4]` | `Foto referensi boulevard gedung kembar (Plawid)` | `SRC-G` | `7.2 S-2` |
| `IMG-05` | `[Insert Image 5]` | `Wireframe section About "INSIGHTITB" dengan visual jaringan neural` | `SRC-G` | `7.2 S-3, 4.3 EVT-06` |
| `IMG-06` | `[Insert Image 6]` | `Foto referensi fasad Labtek, posisi kamera agak tinggi` | `SRC-G` | `7.2 S-3` |
| `IMG-07` | `[Insert Image 7]` | `Foto laser show "ITB INSIGHT 2019" pada dinding gedung` | `SRC-G` | `7.2 S-3, 4.10 GAL-03` |
| `IMG-08` | `[Insert Image 8]` | `Wireframe Impact Counter (670 collaborators / 670 exhibitors / 67.000 visitors)` | `SRC-G` | `7.2 S-4, 4.2 LND-02` |
| `IMG-09` | `[Insert Image 9]` | `Foto referensi kolam & air mancur InTel` | `SRC-G` | `7.2 S-4` |
| `IMG-10` | `[Insert Image 10]` | `Wireframe section Gallery` | `SRC-G` | `7.2 S-5, 4.10 GAL-01` |
| `IMG-11` | `[Insert Image 11]` | `Wireframe section Media Partners + footer` | `SRC-G` | `7.2 S-6, 4.8 PRT-03` |
| `IMG-12` | `[Insert Image 12]` | `Mockup kartu 4 mata lomba + sketsa tangan struktur halaman competition` | `SRC-D (MH-01)` | `4.4 CMP-01` |
| `IMG-13` | `[Insert Image 13]` | `Mockup countdown "REGISTER BEFORE" (hari/jam/menit/detik)` | `SRC-D (SH-04)` | `4.4 CMP-03` |
| `IMG-14` | `[Insert Image 14]` | `Sketsa kolom guidebook & silabus + registration countdown + registration fee` | `SRC-D (MH-05)` | `4.4 CMP-02, CMP-03` |
| `IMG-15` | `[Insert Image 15]` | `Mockup banner CTA "PROVE YOURSELF AND BE THE BEST" dengan tombol Contact Us & Register Now` | `SRC-D (MH-06)` | `4.4 CMP-09` |
| `IMG-16` | `[Insert Image 16]` | `Sketsa total prize pool + timeline batch pendaftaran` | `SRC-D (MH-07)` | `4.4 CMP-02` |
| `IMG-17` | `[Insert Image 17]` | `Sketsa section FAQ + Contact Us` | `SRC-D (MH-08)` | `4.12 INF-01, INF-02` |
| `IMG-18` | `[Insert Image 18]` | `Catatan sketsa alur pengumuman hasil (lolos / tidak lolos, panduan semifinal & final)` | `SRC-D (MH-09)` | `4.4 CMP-08` |
| `IMG-19` | `[Insert Image 19]` | `Referensi "CES 2026 by the Numbers" (ces.tech) — format tampilan angka` | `SRC-E (CPP-04)` | `4.2 LND-02` |
| `IMG-20` | `[Insert Image 20]` | `Referensi countdown Teknofest (teknofest.org)` | `SRC-E (CPP-05)` | `4.2 LND-01` |

**`Referensi tautan (bukan gambar):`** `themonolithproject.net dan jreyes-mc-portfolio.com (motion, SRC-G) · petrolida.com (overview acara, SRC-C) · technocorner.id (struktur web kompetisi, SRC-D) · ces.tech (SRC-E) · teknofest.org (SRC-E).`

## **`9. Data & Metrik Keberhasilan`**

### **`9.1 Data yang Dikumpulkan (Terpadu)`**

| `Kelompok` | `Field` | `Sumber` | `Sensitivitas` |
| :---- | :---- | :---- | :---- |
| `Akun & pre-regis` | `Nama, email, no. HP, instansi, minat kehadiran` | `CPP-01` | `Sedang` |
| `Kehadiran` | `Status check-in gate, waktu, riwayat scan booth per titik` | `EV-01, EV-02, CPP-02` | `Sedang` |
| `Peserta lomba` | `Nama tim, nama & email & no. HP ketua, asal instansi, nama anggota` | `SRC-D 7` | `Sedang` |
| `Berkas lomba` | `Foto KTM/kartu identitas, bukti follow IG, bukti share BC, sketsa robot` | `SRC-D 7, MH-10` | `Tinggi` |
| `Pembayaran` | `Order ID, nominal, metode, status, waktu settlement (tanpa data kartu/rekening)` | `D-03` | `Sedang` |
| `Feedback` | `Feedback keseluruhan, feedback per booth, rating & komentar Inspirates` | `CPP-03, EV-13` | `Rendah` |
| `Inspirates` | `Jumlah peserta per sekolah, daftar anggota diseminasi` | `EV-06, EV-15` | `Rendah` |
| `RSVP` | `Nama, jabatan, asal institusi, email, status kehadiran, nama pengganti` | `SP-02` | `Sedang` |
| `Partnership` | `Instansi/media, email, contact person, bidang industri, skala & deskripsi kolaborasi` | `SPON-03, SP-03` | `Sedang` |
| `Perilaku` | `Klik logo sponsor, traffic halaman, klik volunteer` | `SPON-04, ADM-05` | `Rendah` |

### **`9.2 Metrik Keberhasilan`**

**`Tingkat Produk (Leadership — SRC-F 5)`**

| `Dimensi` | `Target` | `Cara Ukur` |
| :---- | :---- | :---- |
| `Branding` | `Website menjadi referensi standar kualitas acara dan cukup berkesan untuk dibagikan` | `Jumlah share/embed link di X, Instagram, WhatsApp` |
| `Engagement` | `Rata-rata time on page > 3 menit; bounce rate < 40%` | `PostHog` |
| `Conversion` | `> 90% peserta berhasil registrasi tanpa bantuan manual` | `Error rate submission + tiket support terkait registrasi` |
| `Reach` | `Top 3 hasil pencarian Google untuk keyword relevan` | `Google Search Console` |
| `Performance` | `Loading < 3 detik pada 3G; Lighthouse > 80` | `Audit Lighthouse berkala` |

**`Tingkat Bidang`**

| `Metrik` | `Pemilik` | `SourceID` |
| :---- | :---- | :---- |
| `Jumlah pendaftar pre-regis` | `Marketing` | `CPP-01` |
| `Total pengunjung check-in di gate` | `Event, Marketing` | `EV, CPP-02` |
| `Total scan booth per zona & booth paling ramai` | `Event` | `EV-12` |
| `Konversi gate → booth` | `Event` | `EV-12` |
| `Jumlah pengunjung yang menyelesaikan target booth` | `Event` | `SRC-C 7` |
| `Jumlah pendaftar per mata lomba` | `Competition` | `SRC-D 7` |
| `Kunjungan harian halaman competition` | `Competition` | `SRC-D 7` |
| `Nilai feedback keseluruhan & per booth, peringkat likeability booth` | `Marketing` | `CPP-03` |
| `Jumlah sekolah & peserta Inspirates; jumlah input rekap berhasil` | `Event` | `SRC-C 7` |
| `Jumlah RSVP alumni & kehadiran terkonfirmasi via undangan` | `Event, Marketing` | `EV, SP-02` |
| `Jumlah klik volunteer` | `Event` | `SRC-C 7` |
| `Jumlah perusahaan yang mengisi form inquiry (conversion rate)` | `Sponsorship` | `SRC-A 7` |
| `Total klik logo sponsor (interaction rate)` | `Sponsorship` | `SRC-A 7` |
| `Total web visits sebagai leverage sponsor` | `Sponsorship, WebDev` | `SRC-E Extra Notes` |

---

## **`10. Register Keputusan (Perlu Diputuskan)`**

`Delapan hal berikut tidak bisa diselesaikan hanya dengan melebur dokumen — ada bidang yang meminta hal yang saling bertentangan. Rekomendasi WebDev dicantumkan, tapi keputusan ada di pemilik yang tertera.`

| `ID` | `Keputusan` | `Ketetapan / Rekomendasi WebDev` | `Pemilik` | `Status` |
| :---- | :---- | :---- | :---- | :---- |
| `D-01` | `Apakah pengunjung wajib sign in sebelum melihat website? (SRC-D ↔ SRC-B/SRC-E/SRC-F)` | `Browsing publik penuh; autentikasi hanya di titik aksi. Estimasi kehadiran tetap didapat dari pre-regis (ACC-03), bukan dari dinding login.` | `Ring 0/1 + Competition + Marketing` | `✅ Ditetapkan 28 Jul 2026` |
| `D-02` | `Sumber kebenaran data pendaftaran: akun website atau GForm? (SRC-C ↔ SRC-D/SRC-E/SRC-F)` | `Akun website sebagai jalur utama; GForm sebagai cadangan. GForm tetap dipakai untuk alur bertaruh rendah (volunteer, feedback Inspirates) dan sebagai contingency bila registrasi in-website bermasalah. QR gate digenerasi dari database website, bukan dari GForm. Prosedur impor darurat dengan email sebagai kunci join disiapkan di muka.` | `Event + WebDev` | `✅ Ditetapkan 28 Jul 2026` |
| `D-03` | `Mekanisme pembayaran biaya registrasi lomba (SRC-D ↔ SRC-B)` | `Payment gateway Midtrans. Unggah bukti transfer manual dihapus; status pembayaran otomatis dari webhook. Menghilangkan beban verifikasi manual panitia Competition dan menghapus satu kelas berkas sensitif dari sistem.` | `Competition + Bendahara` | `✅ Ditetapkan 28 Jul 2026` |
| `D-04` | `Stack backend & database` | `Perlu ditetapkan sebelum 6.2 dieksekusi. Kriteria bertambah setelah D-03: dukungan RBAC, audit log, object storage privat, kemampuan scaling saat pembukaan registrasi, dan endpoint webhook yang andal serta idempoten.` | `WebDev` | `🔲 Terbuka` |
| `D-05` | `Format keluaran narasi kampus (SRC-G: GIF ↔ PERF-01/02/07)` | `Ganti GIF ke WebM/AV1 atau sprite sequence. Pipeline dan deliverable tim 3D tidak berubah; hanya format ekspor akhir. Perlu diputuskan sebelum 14 Agustus agar tim 3D mengekspor sekali saja.` | `WebDev + Tim 3D` | `🔲 Terbuka — mendesak` |
| `D-06` | `Siapa pemilik konten peta interaktif? (empat pemangku, satu peta)` | `Tunjuk satu pemilik data peta (rekomendasi: Event, karena memegang denah booth & zonasi); bidang lain menyetorkan pin ke pemilik tersebut. Tanpa ini MAP-01 tidak dapat dimulai.` | `Ring 0/1` | `🔲 Terbuka` |
| `D-07` | `Verifikasi domain email perusahaan pada inquiry partnership (SP-03 ↔ SRC-A P-05)` | `Terima semua submission, verifikasi manual oleh panitia. Verifikasi otomatis menambah friksi pada masalah yang justru ingin diselesaikan.` | `Sponsorship + Marketing` | `🔲 Terbuka` |
| `D-08` | `Tanggal pasti main event & deadline registrasi` | `Tidak tercantum di dokumen mana pun. Diperlukan segera — LND-01 dan CMP-03 adalah must-have yang tidak bisa dibangun tanpa tanggal target.` | `Event + Competition` | `🔲 Terbuka — memblokir` |
| `D-09` | `Siapa pemegang akun merchant Midtrans, dan atas nama entitas legal apa?` | `Baru muncul akibat D-03. Onboarding merchant butuh dokumen organisasi dan waktu verifikasi di luar kendali WebDev — mulai paralel dengan development (R-08).` | `Bendahara + Ring 0/1` | `🆕 Terbuka` |
| `D-10` | `Biaya transaksi (MDR) ditanggung peserta atau panitia?` | `Baru muncul akibat D-03. Harus diputuskan sebelum nominal biaya lomba diumumkan, karena mengubah angka yang dipublikasikan di CMP-03.` | `Bendahara + Competition` | `🆕 Terbuka` |
| `D-11` | `Kebijakan refund & pembatalan pendaftaran lomba` | `Baru muncul akibat D-03. Gateway membuat refund menjadi operasi nyata yang perlu aturan tertulis; bukti transfer manual dulu menyembunyikan kebutuhan ini. Perlu dicantumkan di INF-01/INF-05 sebelum registrasi dibuka.` | `Competition + Bendahara` | `🆕 Terbuka` |

---

## **`11. Dependensi, Risiko & Catatan`**

| `ID` | `Risiko / Dependensi` | `Dampak` | `Mitigasi` |
| :---- | :---- | :---- | :---- |
| `R-01` | `GDV belum final, sementara SRC-B mensyaratkan seluruh visual selaras GDV dan SRC-G sudah meminta tim 3D membebaskan warna` | `Aset 3D dan komponen UI berpotensi dikerjakan dua kali` | `Kunci struktur (layout, komposisi, timing motion) lebih dulu; tunda warna ke lapisan yang bisa diganti belakangan (token warna, bukan warna hardcoded pada tekstur)` |
| `R-02` | `Tenggat aset 3D 14 Agustus; belum ada tanggal untuk aset bidang lain di 7.5` | `Modul dengan aset menganggur tidak bisa diselesaikan meski kodenya siap` | `Tetapkan tenggat penyerahan aset per bidang, bukan hanya untuk tim 3D` |
| `R-03` | `Volume must-have sangat besar untuk satu tim webdev mahasiswa` | `Risiko tidak selesai pada semua modul sekaligus` | `Perlu urutan rilis bertahap — lihat catatan di bawah` |
| `R-04` | `Berkas identitas adalah data paling sensitif dan langsung memicu skenario yang paling ditakuti Leadership` | `Reputasi organisasi` | `SEC-06, SEC-07 non-negosiabel; audit sebelum registrasi dibuka` |
| `R-05` | `Konektivitas venue saat hari-H (T-05)` | `Antrean gate macet` | `Mode offline queue pada scanner + sinkronisasi saat koneksi kembali` |
| `R-06` | `Empat bidang menyetorkan pin ke satu peta tanpa pemilik data` | `MAP tidak dapat dimulai` | `D-06` |
| `R-07` | `Lonjakan trafik saat pembukaan registrasi` | `Downtime pada momen paling penting` | `PERF-03, PERF-04; load test sebelum pembukaan` |
| `R-08` | `Onboarding merchant Midtrans membutuhkan dokumen legal organisasi dan waktu verifikasi yang tidak dikontrol WebDev` | `Registrasi lomba tidak bisa dibuka meski kodenya siap` | `Mulai proses verifikasi merchant paralel dengan development, bukan setelahnya; pakai sandbox untuk build (D-09)` |
| `R-09` | `Webhook gagal terkirim atau terlambat` | `Peserta sudah membayar tapi status tetap pending` | `Endpoint idempoten (SEC-11) + job rekonsiliasi berkala terhadap API status Midtrans + jalur koreksi manual di panel panitia` |
| `R-10` | `Biaya transaksi (MDR) mengurangi pemasukan registrasi bila belum diperhitungkan dalam nominal biaya lomba` | `Selisih anggaran` | `Tetapkan D-10 sebelum nominal biaya lomba diumumkan` |

**`Catatan urutan rilis.`** `Register di 4 memuat lebih dari 40 item must-have. Dokumen ini sengaja tidak menetapkan fase rilis karena tanggal acara belum diketahui (D-08). Begitu tanggal tersedia, rekomendasi pembagian: Rilis 1 — landing, informasi, competition, partnership (kebutuhan pra-acara); Rilis 2 — akun, pendaftaran lomba, RSVP; Rilis 3 — QR, tracking, feedback, dashboard (kebutuhan hari-H); Rilis 4 — gamifikasi, heatmap, rekomendasi AI (seluruh could-have).`

**`Catatan penulisan pada dokumen sumber.`** `SPON-04 (SRC-A) tertulis "sebagai bahan laporan kontrasepsi"; diinterpretasikan sebagai laporan pertanggungjawaban ke mitra dan ditulis demikian pada PRT-07. Mohon konfirmasi bila maksudnya berbeda.`

---

## **`12. Arahan Terbuka dari Leadership`**

- `Terkait partnership untuk sponsor, perlu konfirmasi ulang ke Pasha / Bidang Fundraising apakah ada kebutuhan khusus dari mereka yang belum tercakup di modul PRT (SRC-F 6).`
- `Tim Sponsorship diminta memastikan apakah ada sponsor besar atau institusi tertentu yang harus mendapat spotlight khusus di luar mekanisme tier PRT-02/PRT-04.`

---

## **`13. Traceability Matrix`**

`Setiap requirement dari ketujuh dokumen sumber dipetakan tepat satu kali. Baris yang menunjuk ke ID terpadu yang sama menandakan requirement tersebut memang tumpang tindih dan sudah dilebur.`

### **`13.1 Sponsorship (SRC-A)`**

| `ID Asal` | `Requirement Asal` | `→ ID Terpadu` | `Catatan` |
| :---- | :---- | :---- | :---- |
| `SPON-01` | `Interactive Partner Hotspots` | `MAP-01, MAP-03` | `Dilebur ke peta tunggal` |
| `SPON-02` | `Tiered Partnership Wall` | `PRT-02` |  |
| `SPON-03` | `Integrated Partnership Inquiry Form` | `PRT-05` | `Dilebur dengan SP-03` |
| `SPON-04` | `Statistik klik logo` | `PRT-07` |  |
| `6 (aset)` | `Foto ITB Insight 2019 sebagai bukti skala` | `GAL-03` |  |
| `8 (asumsi)` | `Logo mitra diperbarui berkala` | `PRT-08` | `Dinaikkan dari asumsi ke requirement` |

### **`13.2 Creative Branding (SRC-B)`**

| `ID Asal` | `Requirement Asal` | `→ ID Terpadu` | `Catatan` |
| :---- | :---- | :---- | :---- |
| `DCC-01` | `Galeri dokumentasi dan/atau aftermovie` | `GAL-01, GAL-02` | `Dipisah menurut ketersediaan aset` |
| `CB-01` | `Easter egg` | `LND-06` |  |
| `PD-01` | `Map pin megaprop / photo spot` | `MAP-04` | `Dilebur ke peta tunggal` |
| `5 (journey)` | `Countdown real-time di landing` | `LND-01` | `Dilebur dengan CPP-05` |
| `5 (journey)` | `Menu utama & timeline interaktif` | `LND-08, EVT-07` |  |
| `5 (journey)` | `Unduh guidebook konsisten GDV` | `INF-03` | `Dilebur dengan MH-05` |
| `5 (journey)` | `Animasi loading + halaman sukses ber-countdown` | `INF-06, VIS-06` |  |
| `6` | `Micro-interaction, warna & tipografi, responsivitas` | `7.1` |  |
| `2 (masalah)` | `Trade-off estetika vs aksesibilitas` | `7.4 (ACS-01…07)` | `Diangkat menjadi pagar teknis` |

### **`13.3 Event (SRC-C)`**

| `ID Asal` | `→ ID Terpadu` |  | `ID Asal` | `→ ID Terpadu` |
| :---- | :---- | :---- | :---- | :---- |
| `EV-01` | `QRS-01, QRS-02, QRS-07` |  | `EV-13` | `FBK-04` |
| `EV-02` | `QRS-04` |  | `EV-14` | `PRE-04` |
| `EV-03` | `ADM-01, ADM-03, QRS-03` |  | `EV-15` | `PRE-03` |
| `EV-04` | `EVT-01, EVT-02` |  | `EV-16` | `QRS-09` |
| `EV-05` | `EVT-08` |  | `EV-17` | `QRS-11` |
| `EV-06` | `PRE-02` |  | `EV-18` | `QRS-10` |
| `EV-07` | `PRE-01, EVT-10` |  | `EV-19` | `PRE-05` |
| `EV-08` | `QRS-05` |  | `EV-20` | `ADM-07` |
| `EV-09` | `EVT-05` |  | `EV-21` | `MAP-06` |
| `EV-10` | `MAP-01, MAP-02` |  | `EV-22` | `GAL-04` |
| `EV-11` | `EVT-03, EVT-04` |  | `EV-23` | `FBK-05` |
| `EV-12` | `ADM-02` |  | `3 (exhibitor)` | `ACC-08` |

### **`13.4 Competition (SRC-D)`**

| `ID Asal` | `Requirement Asal` | `→ ID Terpadu` | `Catatan` |
| :---- | :---- | :---- | :---- |
| `MH-01` | `Pengelompokan peserta per mata lomba` | `CMP-01, CMP-04, CMP-06` |  |
| `SH-02` | `Email notif bukti registrasi` | `CMP-07 via ACC-06` | `Dilebur dengan EV-01 & SP-02` |
| `MH-03` | `Penjelasan tiap mata lomba & persyaratan` | `CMP-02` |  |
| `SH-04` | `Countdown registrasi + registration fee + prize pool + timeline` | `CMP-03, CMP-02, LND-02` |  |
| `MH-05` | `Guidebook & silabus per lomba` | `CMP-02, INF-03` |  |
| `MH-06` | `Section Registration + Contact Us` | `CMP-09, INF-02` |  |
| `MH-07` | `Timeline & prize pool per mata lomba` | `CMP-02` |  |
| `MH-08` | `Section FAQ` | `INF-01` | `Dilebur dengan FAQ SRC-F` |
| `MH-09` | `Section info compe / pengumuman finalis` | `CMP-08` |  |
| `MH-10` | `Upload sketsa robot` | `CMP-05` |  |
| `1` | `Wajib sign in sebelum mengunjungi web` | `ACC-07` | `Digantikan — lihat D-01` |
| `1` | `Live counter pengunjung & prize pool` | `LND-02` | `Dilebur dengan CPP-04` |
| `1` | `Sosmed & media partner di bagian bawah` | `LND-07, PRT-03` |  |
| `3` | `Ekspor data peserta Excel/CSV` | `CMP-11 via ADM-04` |  |
| `5` | `Sign in Google` | `ACC-01` | `Dilebur dengan CPP-01` |
| `5` | `Pembayaran` | `CMP-10, CMP-12…CMP-16` | `Midtrans, ditetapkan lewat D-03` |
| `7` | `Data & berkas yang dikumpulkan` | `CMP-05, 9.1` | `Item "bukti transfer" digantikan status Midtrans (D-03)` |

### **`13.5 Marketing (SRC-E)`**

| `ID Asal` | `Requirement Asal` | `→ ID Terpadu` | `Catatan` |
| :---- | :---- | :---- | :---- |
| `CPP-01` | `Sign-up/login + biodata + tombol pre-regis` | `ACC-01, ACC-02, ACC-03` |  |
| `CPP-02` | `Presensi scan QR / tandai hadir` | `QRS-06, QRS-08` | `Dilebur dengan EV-01` |
| `CPP-03` | `Feedback in-website (keseluruhan + per booth)` | `FBK-01, FBK-02, FBK-03` |  |
| `CPP-04` | `Angka pengunjung, exhibitor, kolaborator` | `LND-02` |  |
| `CPP-05` | `Countdown D-Day` | `LND-01` | `Prioritas dinaikkan` |
| `CPP-06` | `List & tautan sosial media` | `LND-07` |  |
| `SP-01` | `List media partner` | `PRT-03` |  |
| `SP-02` | `RSVP undangan in-website + e-ticket QR` | `EVT-09, QRS-01` |  |
| `SP-03` | `Pendaftaran partnership media eksternal` | `PRT-05, PRT-06` | `Dilebur dengan SPON-03` |
| `Extra (WebDev)` | `PostHog untuk total web visits` | `ADM-05` |  |
| `8` | `Google account + QR reader embedded` | `ACC-01, QRS-08` |  |

### **`13.6 Leadership (SRC-F)`**

| `Requirement Asal` | `→ ID Terpadu` |
| :---- | :---- |
| `Landing page / homepage` | `LND-01…LND-08` |
| `Tentang / About (visi misi, HMFT-ITB, sambutan Kaprodi)` | `EVT-06` |
| `Program acara (pre-event, lomba, main event)` | `EVT-01, EVT-02, EVT-07` |
| `Registrasi lomba & dashboard peserta` | `CMP-04, ACC-04` |
| `Peta acara interaktif (mobilisasi, parkir, wahana)` | `MAP-01, MAP-05` |
| `Pendaftaran (RSVP) ke acara` | `EVT-09, ACC-03` |
| `Sponsor & Partner (tier, halaman khusus, spotlight)` | `PRT-01, PRT-02, PRT-04` |
| `FAQ & Contact` | `INF-01, INF-02` |
| `Interdisciplinary Technology (narasi scroll)` | `LND-03, VIS-01` |
| `Human-centered innovation (journey & minim human error)` | `1.3, ACC-02, 7.4` |
| `Future Sustainability (visual)` | `VIS-05` |
| `Inovasi Terdepan (animasi physics-based)` | `VIS-04` |
| `Countdown dinamis terintegrasi key visual` | `LND-01, VIS-02` |
| `Standar keamanan (enkripsi, auth, RBAC, audit log)` | `SEC-01…SEC-05, ADM-06` |
| `Reliability (scaling, monitoring, backup, uptime)` | `PERF-03…PERF-06` |
| `Dampak strategis (branding, engagement, conversion, reach, performance)` | `9.2` |
| `Arahan sponsor besar → konfirmasi Fundraising` | `12` |

### **`13.7 3D Design Brief (SRC-G)`**

| `Requirement Asal` | `→ ID Terpadu` |
| :---- | :---- |
| `Low-poly, berwarna, 3D/semi-3D ITB` | `7.2` |
| `Camera path Plawid → kolam InTel dipicu scroll` | `LND-03, 7.2 S-2…S-4` |
| `Implementasi sebagai GIF untuk mengurangi load` | `6.5, Keputusan D-05` |
| `Pemetaan scene per section website` | `7.2 S-1…S-6` |
| `Referensi motion (themonolithproject, jreyes-mc)` | `7.2` |
| `Scene sisaan sebagai background halaman lain` | `7.2` |
| `Model drone dijeda, prioritas model ITB` | `7.2` |
| `Ikon search pada navbar wireframe` | `INF-04` |
| `Tenggat 14 Agustus: seluruh model & GIF siap` | `7.5, R-02` |

---

*`Akhir dokumen. Perubahan pada dokumen ini harus melalui Tim WebDev agar traceability 13 tetap utuh.`*
