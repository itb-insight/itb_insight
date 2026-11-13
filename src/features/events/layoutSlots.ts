import type { EventSlot } from "@/features/events/types";

/**
 * Slot tata letak halaman /event, hasil export Figma "Event Info" (frame
 * 1728 x 1024) lewat Figma REST API. Lihat juga EventSection.tsx.
 *
 * Slot = semua yang VISUAL dan terikat pada posisi: ornamen (layers, dengan
 * urutan lapisan persis Figma), sisi foto, gradient latar, dan sambungan
 * dengan section sebelumnya (blendWithPrevious). Isi teks/foto/tombol ada di
 * data.ts dan dipasangkan ke slot berdasarkan urutan.
 *
 * Kenapa dipisah: urutan slot menjaga selang-seling foto kanan/kiri dan
 * sambungan antar-section yang sudah diukur. Event bisa ditambah atau
 * diurutkan ulang di data.ts tanpa merusak keduanya.
 *
 * Slot 1-7 = tujuh frame asli Figma (figmaFrame = nama frame asalnya).
 * Slot 8 = salinan slot 4 (foto kiri, blend dengan section sebelumnya),
 * ditambahkan saat Technology Seminar masuk ke halaman ini. Slot 7 diakhiri
 * #294d97 dan slot 8 diawali #294d97, sama seperti pasangan slot 3 -> 4.
 */
export const LAYOUT_SLOTS: EventSlot[] = [
  {
    "figmaFrame": "insight-festival",
    "blendWithPrevious": false,
    "bgTop": "#091b3f",
    "bgBottom": "#294d97",
    "photoSide": "right",
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
    "figmaFrame": "exhibition-manager",
    "blendWithPrevious": false,
    "bgTop": "#294d97",
    "bgBottom": "#091b3f",
    "photoSide": "left",
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
    "figmaFrame": "play-tech",
    "blendWithPrevious": true,
    "bgTop": "#091b3f",
    "bgBottom": "#294d97",
    "photoSide": "right",
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
    "figmaFrame": "show-tech",
    "blendWithPrevious": true,
    "bgTop": "#294d97",
    "bgBottom": "#091b3f",
    "photoSide": "left",
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
    "figmaFrame": "insight-on-stage",
    "blendWithPrevious": true,
    "bgTop": "#091b3f",
    "bgBottom": "#294d97",
    "photoSide": "right",
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
    "figmaFrame": "inspirates",
    "blendWithPrevious": false,
    "bgTop": "#294d97",
    "bgBottom": "#091b3f",
    "photoSide": "left",
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
    "figmaFrame": "alumni-gathering",
    "blendWithPrevious": true,
    "bgTop": "#091b3f",
    "bgBottom": "#294d97",
    "photoSide": "right",
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
  },
  {
    "figmaFrame": "show-tech (salinan untuk slot 8)",
    "blendWithPrevious": true,
    "bgTop": "#294d97",
    "bgBottom": "#091b3f",
    "photoSide": "left",
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
  }
];
