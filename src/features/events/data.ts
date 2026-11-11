import "server-only";
import type { EventItem } from "@/features/events/types";

/**
 * Data halaman Events (desktop).
 *
 * Seluruh isi dan koordinat di bawah DIHASILKAN dari file Figma
 * "UI-UX Website ITB INSIGHT (Copy)" page Hi-Fi, frame "Event Info"
 * (1728 x 1024), lewat Figma REST API — bukan disalin tangan.
 *
 * Semua angka koordinat dalam piksel desain (frame 1728 lebar).
 * Komponen mengubahnya ke satuan cqw, jadi tampilannya ikut menyusut
 * atau membesar secara proporsional mengikuti lebar layar.
 *
 * layers = urutan lapisan PERSIS seperti di Figma (bawah ke atas).
 * Urutan ini penting: contohnya di Insight Festival, blob hijau berada
 * di ATAS foto sehingga pojok kiri bawah foto ikut tersamar.
 *
 * Pindah ke Supabase/CMS nanti: cukup ganti isi getEvents() dengan
 * fetch, komponennya tidak perlu diubah.
 */

const EVENTS: EventItem[] = [
  {
    "slug": "insight-festival",
    "blendWithPrevious": false,
    "title": "Insight Festival",
    "description": "Secara struktur, Insight Festival mengintegrasikan empat komponen utama, yaitu Technology Showcase, Final Day Competition, Technology Seminar, dan Insight on Stage, yang masing-masing merepresentasikan dimensi berbeda dari sains dan teknologi: eksplorasi, partisipasi, pendalaman, dan pengalaman imersif.",
    "day": "Sabtu",
    "dateLabel": "28 November, 2026",
    "date": "2026-11-28",
    "location": "Sabuga, ITB",
    "registerUrl": "#",
    "buttonLabel": "Registrasi",
    "badgeColor": "#7245f5",
    "badgeOpacity": 0.73,
    "bgTop": "#091b3f",
    "bgBottom": "#294d97",
    "titleBox": {
      "x": 173,
      "y": 291,
      "w": 529,
      "h": 151
    },
    "rowBox": {
      "x": 173,
      "y": 466,
      "w": 403.3,
      "h": 48
    },
    "descBox": {
      "x": 173,
      "y": 538,
      "w": 676,
      "h": 120
    },
    "buttonBox": {
      "x": 173,
      "y": 682,
      "w": 256,
      "h": 52
    },
    "photoBox": {
      "x": 900,
      "y": 272,
      "w": 655,
      "h": 480
    },
    "layers": [
      {
        "kind": "decor",
        "src": "/events/decor/decor-01.svg",
        "cx": 1398.5,
        "cy": 512,
        "w": 1143,
        "h": 1121
      },
      {
        "kind": "photo"
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-02.svg",
        "cx": 374.6,
        "cy": 272,
        "w": 1234,
        "h": 708
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-03.svg",
        "cx": 864,
        "cy": 961.4,
        "w": 1211,
        "h": 1060
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-04.svg",
        "cx": 585.8,
        "cy": 1190.9,
        "w": 435,
        "h": 435
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-05.svg",
        "cx": 111.6,
        "cy": 1424.6,
        "w": 894,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-06.svg",
        "cx": -124.4,
        "cy": 1190.9,
        "w": 427,
        "h": 427
      },
      {
        "kind": "content"
      }
    ]
  },
  {
    "slug": "exhibition-manager",
    "blendWithPrevious": false,
    "title": "EXHIBITION\nMANAGER",
    "description": "Tech-xhibition merupakan sebuah exhibition yang menggabungkan karya-karya civitas ITB (HMPS, UKM, dosen, badan lain di ITB) dan teknologi inovatif di industri untuk disebarluaskan dan dikenalkan kepada masyarakat luas dengan metode yang interaktif dan aplikatif.",
    "day": "Sabtu",
    "dateLabel": "28 November, 2026",
    "date": "2026-11-28",
    "location": "Sabuga, ITB",
    "registerUrl": "#",
    "buttonLabel": "Registrasi",
    "badgeColor": "#c05150",
    "badgeOpacity": 0.73,
    "bgTop": "#294d97",
    "bgBottom": "#091b3f",
    "titleBox": {
      "x": 879,
      "y": 286,
      "w": 610,
      "h": 160
    },
    "rowBox": {
      "x": 879,
      "y": 470,
      "w": 403.3,
      "h": 48
    },
    "descBox": {
      "x": 879,
      "y": 542,
      "w": 676,
      "h": 120
    },
    "buttonBox": {
      "x": 879,
      "y": 686,
      "w": 256,
      "h": 52
    },
    "photoBox": {
      "x": 173,
      "y": 272,
      "w": 655,
      "h": 480
    },
    "layers": [
      {
        "kind": "decor",
        "src": "/events/decor/decor-07.svg",
        "cx": 229.5,
        "cy": 512,
        "w": 1143,
        "h": 1121
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-08.svg",
        "cx": 1042.7,
        "cy": 1190.7,
        "w": 435,
        "h": 435
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-09.svg",
        "cx": 1516.9,
        "cy": 1424.3,
        "w": 894,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-10.svg",
        "cx": 1752.9,
        "cy": 1190.7,
        "w": 427,
        "h": 427
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-11.svg",
        "cx": 926.4,
        "cy": -50.1,
        "w": 193,
        "h": 193
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-12.svg",
        "cx": 1516.4,
        "cy": -400.6,
        "w": 427,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-13.svg",
        "cx": 1044.4,
        "cy": -166.9,
        "w": 427,
        "h": 427
      },
      {
        "kind": "photo"
      },
      {
        "kind": "content"
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-14.svg",
        "cx": 863.5,
        "cy": -28.1,
        "w": 1211,
        "h": 1060
      }
    ]
  },
  {
    "slug": "play-tech",
    "blendWithPrevious": true,
    "title": "Play-Tech",
    "description": "Deskripsi: Membangun permainan dan peraga interaktif untuk pengunjung festival. Aksentuasi aspek keilmuan yang dipelajari di TF agar dapat menyampaikan sebagian ilmu tersebut ke masyarakat luas. 2 wahana besar, 6 wahana utama, 12 wahana pendamping, 20 wahana pengisi. Non-newtonian fluid pool, VR booth, robo-soccer arena, dsb.",
    "day": "Sabtu",
    "dateLabel": "28 November, 2026",
    "date": "2026-11-28",
    "location": "Sabuga, ITB",
    "registerUrl": "#",
    "buttonLabel": "Registrasi",
    "badgeColor": "#7b7b7b",
    "badgeOpacity": 0.73,
    "bgTop": "#091b3f",
    "bgBottom": "#294d97",
    "titleBox": {
      "x": 173,
      "y": 326,
      "w": 521,
      "h": 80
    },
    "rowBox": {
      "x": 173,
      "y": 430,
      "w": 403.3,
      "h": 48
    },
    "descBox": {
      "x": 173,
      "y": 502,
      "w": 676,
      "h": 120
    },
    "buttonBox": {
      "x": 173,
      "y": 646,
      "w": 256,
      "h": 52
    },
    "photoBox": {
      "x": 900,
      "y": 272,
      "w": 655,
      "h": 480
    },
    "layers": [
      {
        "kind": "decor",
        "src": "/events/decor/decor-15.svg",
        "cx": 1398.5,
        "cy": 512,
        "w": 1143,
        "h": 1121
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-16.svg",
        "cx": 990.2,
        "cy": 474,
        "w": 1056,
        "h": 1346
      },
      {
        "kind": "photo"
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-17.svg",
        "cx": 585.8,
        "cy": 1190.9,
        "w": 435,
        "h": 435
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-18.svg",
        "cx": 111.6,
        "cy": 1424.6,
        "w": 894,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-19.svg",
        "cx": -124.4,
        "cy": 1190.9,
        "w": 427,
        "h": 427
      },
      {
        "kind": "content"
      }
    ]
  },
  {
    "slug": "show-tech",
    "blendWithPrevious": true,
    "title": "Show-Tech",
    "description": "Menambahkan kecantikan festival. Instalasi teknologi audio-visual untuk mengenalkan saintek & membangun suasana festival yang punya tema narasi. 32 instalasi buatan mahasiswa TF dengan konten edukasi di setiap instalasinya. Immersive world, sound-responsive led floor, LED 16, cloud light, kaleidoscope portal, hologram, dll.",
    "day": "Sabtu",
    "dateLabel": "28 November, 2026",
    "date": "2026-11-28",
    "location": "Sabuga, ITB",
    "registerUrl": "#",
    "buttonLabel": "Registrasi",
    "badgeColor": "#073c46",
    "badgeOpacity": 0.73,
    "bgTop": "#294d97",
    "bgBottom": "#091b3f",
    "titleBox": {
      "x": 879,
      "y": 326,
      "w": 592,
      "h": 80
    },
    "rowBox": {
      "x": 879,
      "y": 430,
      "w": 403.3,
      "h": 48
    },
    "descBox": {
      "x": 879,
      "y": 502,
      "w": 676,
      "h": 120
    },
    "buttonBox": {
      "x": 879,
      "y": 646,
      "w": 256,
      "h": 52
    },
    "photoBox": {
      "x": 173,
      "y": 272,
      "w": 655,
      "h": 480
    },
    "layers": [
      {
        "kind": "decor",
        "src": "/events/decor/decor-20.svg",
        "cx": 229.5,
        "cy": 512,
        "w": 1143,
        "h": 1121
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-21.svg",
        "cx": 1042.7,
        "cy": 1190.7,
        "w": 435,
        "h": 435
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-22.svg",
        "cx": 261,
        "cy": 194.2,
        "w": 1707,
        "h": 1700
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-23.svg",
        "cx": 1422.3,
        "cy": 608.2,
        "w": 992,
        "h": 1152
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-24.svg",
        "cx": 1516.9,
        "cy": 1424.3,
        "w": 894,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-25.svg",
        "cx": 1752.9,
        "cy": 1190.7,
        "w": 427,
        "h": 427
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-26.svg",
        "cx": 926.4,
        "cy": -50.1,
        "w": 193,
        "h": 193
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-27.svg",
        "cx": 1516.4,
        "cy": -400.6,
        "w": 427,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-28.svg",
        "cx": 1044.4,
        "cy": -166.9,
        "w": 427,
        "h": 427
      },
      {
        "kind": "photo"
      },
      {
        "kind": "content"
      }
    ]
  },
  {
    "slug": "insight-on-stage",
    "blendWithPrevious": true,
    "title": "Insight on Stage",
    "description": "Insight on Stage adalah pertunjukan teknologi-artistik dengan mengadakan pertunjukan yang berbasis teknologi, misalkan: Laser + Projection Mapping, Light hologram performance / Light Dance, Drone Light Show, dan Guest Star Band Performance.",
    "day": "Sabtu",
    "dateLabel": "28 November, 2026",
    "date": "2026-11-28",
    "location": "Sabuga, ITB",
    "registerUrl": "#",
    "buttonLabel": "Registrasi",
    "badgeColor": "#073c46",
    "badgeOpacity": 0.73,
    "bgTop": "#091b3f",
    "bgBottom": "#294d97",
    "titleBox": {
      "x": 173,
      "y": 291,
      "w": 529,
      "h": 151
    },
    "rowBox": {
      "x": 173,
      "y": 466,
      "w": 403.3,
      "h": 48
    },
    "descBox": {
      "x": 173,
      "y": 538,
      "w": 676,
      "h": 120
    },
    "buttonBox": {
      "x": 173,
      "y": 682,
      "w": 256,
      "h": 52
    },
    "photoBox": {
      "x": 900,
      "y": 272,
      "w": 655,
      "h": 480
    },
    "layers": [
      {
        "kind": "decor",
        "src": "/events/decor/decor-29.svg",
        "cx": 1398.5,
        "cy": 512,
        "w": 1143,
        "h": 1121
      },
      {
        "kind": "photo"
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-30.svg",
        "cx": 652.6,
        "cy": 373.9,
        "w": 1707,
        "h": 1700
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-31.svg",
        "cx": 585.8,
        "cy": 1190.9,
        "w": 435,
        "h": 435
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-32.svg",
        "cx": 111.6,
        "cy": 1424.6,
        "w": 894,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-33.svg",
        "cx": -124.4,
        "cy": 1190.9,
        "w": 427,
        "h": 427
      },
      {
        "kind": "content"
      }
    ]
  },
  {
    "slug": "inspirates",
    "blendWithPrevious": false,
    "title": "Inspirates",
    "description": "Inspirates merupakan kegiatan diseminasi ke sekolah (SD, SMP, SMA, SMK) untuk memberikan motivasi dan inspirasi terkait sains, teknologi, dan TF serta ajang promosi ITB Insight. Kegiatan ini juga berkolaborasi dengan FKMTF maupun BKSTF agar dapat tersilh ke seluruh Indonesia.",
    "day": "Sabtu",
    "dateLabel": "28 November, 2026",
    "date": "2026-11-28",
    "location": "Sabuga, ITB",
    "registerUrl": "#",
    "buttonLabel": "Registrasi",
    "badgeColor": "#073c46",
    "badgeOpacity": 0.73,
    "bgTop": "#294d97",
    "bgBottom": "#091b3f",
    "titleBox": {
      "x": 879,
      "y": 326,
      "w": 599,
      "h": 80
    },
    "rowBox": {
      "x": 879,
      "y": 430,
      "w": 403.3,
      "h": 48
    },
    "descBox": {
      "x": 879,
      "y": 502,
      "w": 676,
      "h": 120
    },
    "buttonBox": {
      "x": 879,
      "y": 646,
      "w": 256,
      "h": 52
    },
    "photoBox": {
      "x": 173,
      "y": 272,
      "w": 655,
      "h": 480
    },
    "layers": [
      {
        "kind": "decor",
        "src": "/events/decor/decor-34.svg",
        "cx": 229.5,
        "cy": 512,
        "w": 1143,
        "h": 1121
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-35.svg",
        "cx": 484.8,
        "cy": 557,
        "w": 1619,
        "h": 1359
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-36.svg",
        "cx": 1042.7,
        "cy": 1190.7,
        "w": 435,
        "h": 435
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-37.svg",
        "cx": 1516.9,
        "cy": 1424.3,
        "w": 894,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-38.svg",
        "cx": 1752.9,
        "cy": 1190.7,
        "w": 427,
        "h": 427
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-39.svg",
        "cx": 926.4,
        "cy": -50.1,
        "w": 193,
        "h": 193
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-40.svg",
        "cx": 1516.4,
        "cy": -400.6,
        "w": 427,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-41.svg",
        "cx": 1044.4,
        "cy": -166.9,
        "w": 427,
        "h": 427
      },
      {
        "kind": "photo"
      },
      {
        "kind": "content"
      }
    ]
  },
  {
    "slug": "alumni-gathering",
    "blendWithPrevious": true,
    "title": "Alumni Gathering",
    "description": "Alumni Gathering merupakan salah satu kegiatan yang mengundang para alumni agar dapat berinteraksi langsung dengan HMFT-ITB serta prodi untuk mensosialisasikan perkembangan mahasiswa, HMFT-ITB, ITB Insight, dan menjadikan ajang seru-seruan dan reuni antar alumni.",
    "day": "Sabtu",
    "dateLabel": "28 November, 2026",
    "date": "2026-11-28",
    "location": "Sabuga, ITB",
    "registerUrl": "#",
    "buttonLabel": "Registrasi",
    "badgeColor": "#073c46",
    "badgeOpacity": 0.73,
    "bgTop": "#091b3f",
    "bgBottom": "#294d97",
    "titleBox": {
      "x": 173,
      "y": 286,
      "w": 572,
      "h": 160
    },
    "rowBox": {
      "x": 173,
      "y": 470,
      "w": 403.3,
      "h": 48
    },
    "descBox": {
      "x": 173,
      "y": 542,
      "w": 676,
      "h": 120
    },
    "buttonBox": {
      "x": 173,
      "y": 686,
      "w": 256,
      "h": 52
    },
    "photoBox": {
      "x": 900,
      "y": 272,
      "w": 655,
      "h": 480
    },
    "layers": [
      {
        "kind": "decor",
        "src": "/events/decor/decor-42.svg",
        "cx": 1398.5,
        "cy": 512,
        "w": 1143,
        "h": 1121
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-43.svg",
        "cx": 1101.8,
        "cy": 518,
        "w": 2258,
        "h": 3081
      },
      {
        "kind": "photo"
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-44.svg",
        "cx": 585.8,
        "cy": 1190.9,
        "w": 435,
        "h": 435
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-45.svg",
        "cx": 111.6,
        "cy": 1424.6,
        "w": 894,
        "h": 894
      },
      {
        "kind": "decor",
        "src": "/events/decor/decor-46.svg",
        "cx": -124.4,
        "cy": 1190.9,
        "w": 427,
        "h": 427
      },
      {
        "kind": "content"
      }
    ]
  }
];

export async function getEvents(): Promise<EventItem[]> {
  return EVENTS;
}
