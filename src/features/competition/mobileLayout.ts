import type { Competition } from "@/features/competition/types";

/**
 * Tata letak vertikal kanvas mobile (lebar 393).
 *
 * Di Figma, tiap blok (hero, countdown, biaya, prizepool, timeline, tombol)
 * punya koordinat Y TETAP dengan jarak antar blok yang lebar (350-570px)
 * karena diisi ornamen. Setelah isinya nyata (jumlah item timeline berbeda
 * tiap lomba, hadiah bisa punya baris tambahan), jarak itu terlalu renggang.
 *
 * Maka Y tiap blok sekarang DIHITUNG: blok ditumpuk dengan jarak tetap di
 * bawah (GAP), dan tinggi kanvas mengikuti. Ukuran blok sendiri tetap persis
 * Figma (lihat konstanta DESIGN).
 *
 * Latar (gradient, neuron, blob) ikut digeser lewat warp(): fungsi linear
 * bertahap yang memetakan Y desain Figma -> Y baru, supaya ornamen tetap
 * berada di dekat blok yang tadinya ada di depannya dan tidak terpotong di
 * bawah kanvas yang kini lebih pendek.
 */

/** Tinggi kanvas di Figma (frame 393 x 3284). */
export const DESIGN_HEIGHT = 3284;

/** Koordinat dan ukuran di Figma. */
const DESIGN = {
  heroEndWithButtons: 677, // tombol Silabus/Guidebook y=645, tinggi 32
  heroEndNoButtons: 645,
  countdownTitle: 1034,
  countdownCardOffset: 96, // kartu di y=1130
  countdownHeight: 240, // judul sampai dasar kartu (1034 -> 1274)
  fee: 1756,
  feeHeight: 156,
  prizeTitle: 1998,
  prizeBoxOffset: 41, // kotak di y=2039
  prizeBoxHeight: 61,
  prizeBottom: 2100,
  timelineTitle: 2265,
  timelineTextOffset: 70, // judul -> teks item pertama
  contact: 3126,
  contactHeight: 32,
} as const;

const TIMELINE_STEP = 88;
const TIMELINE_ITEM_HEIGHT = 48; // nama 24 + tanggal 24
/** Kartu hadiah dengan baris tambahan ("+ laptop") lebih tinggi dari kotak desain. */
const PRIZE_BOX_HEIGHT_WITH_EXTRAS = 72;

/** Jarak antar blok (px). Di Figma jaraknya 357 / 482 / 86 / 165 / 136+. */
const GAP = {
  heroToCountdown: 72,
  countdownToFee: 64,
  feeToPrize: 86,
  prizeToTimeline: 110,
  timelineToContact: 72,
  /** di bawah tombol, sebelum bagian Detail Lomba */
  bottom: 40,
} as const;

export interface MobileLayout {
  countdownTitleY: number;
  countdownCardY: number;
  feeY: number;
  prizeTitleY: number;
  prizeBoxY: number;
  timelineTitleY: number;
  timelineTextY: number;
  contactY: number;
  /** Tinggi kanvas baru */
  height: number;
  /** Tinggi baru / tinggi Figma, untuk menskalakan lapisan gradient */
  scale: number;
  /** Peta Y desain Figma -> Y baru, untuk ornamen latar */
  warp: (designY: number) => number;
}

export function mobileLayout(c: Competition): MobileLayout {
  const hasButtons = c.syllabusUrl !== null || c.guidebookUrl !== null;
  const heroEnd = hasButtons ? DESIGN.heroEndWithButtons : DESIGN.heroEndNoButtons;

  const countdownTitleY = heroEnd + GAP.heroToCountdown;
  const countdownCardY = countdownTitleY + DESIGN.countdownCardOffset;
  const countdownBottom = countdownTitleY + DESIGN.countdownHeight;

  const feeY = countdownBottom + GAP.countdownToFee;
  const feeBottom = feeY + DESIGN.feeHeight;

  const prizeTitleY = feeBottom + GAP.feeToPrize;
  const prizeBoxY = prizeTitleY + DESIGN.prizeBoxOffset;
  const prizeBoxHeight = c.prize.extras?.length
    ? PRIZE_BOX_HEIGHT_WITH_EXTRAS
    : DESIGN.prizeBoxHeight;
  const prizeBottom = prizeBoxY + prizeBoxHeight;

  const timelineTitleY = prizeBottom + GAP.prizeToTimeline;
  const timelineTextY = timelineTitleY + DESIGN.timelineTextOffset;
  const timelineBottom =
    timelineTextY + Math.max(0, c.timeline.length - 1) * TIMELINE_STEP + TIMELINE_ITEM_HEIGHT;

  const contactY = timelineBottom + GAP.timelineToContact;
  const height = contactY + DESIGN.contactHeight + GAP.bottom;

  // Pasangan [Y Figma, Y baru], naik di kedua sumbu. Di antara dua pasangan
  // petanya linear; di luar pasangan pertama/terakhir kemiringannya 1.
  const anchors: [number, number][] = [
    [0, 0],
    [heroEnd, heroEnd],
    [DESIGN.countdownTitle, countdownTitleY],
    [DESIGN.countdownTitle + DESIGN.countdownHeight, countdownBottom],
    [DESIGN.fee, feeY],
    [DESIGN.fee + DESIGN.feeHeight, feeBottom],
    [DESIGN.prizeTitle, prizeTitleY],
    [DESIGN.prizeBottom, prizeBottom],
    [DESIGN.timelineTitle, timelineTitleY],
    [DESIGN.contact, contactY],
    [DESIGN_HEIGHT, height],
  ];

  const warp = (y: number): number => {
    const last = anchors[anchors.length - 1];
    if (y <= 0) return y;
    if (y >= last[0]) return last[1] + (y - last[0]);
    for (let i = 1; i < anchors.length; i++) {
      const [x1, y1] = anchors[i];
      if (y <= x1) {
        const [x0, y0] = anchors[i - 1];
        return x1 === x0 ? y1 : y0 + ((y - x0) / (x1 - x0)) * (y1 - y0);
      }
    }
    return y;
  };

  return {
    countdownTitleY,
    countdownCardY,
    feeY,
    prizeTitleY,
    prizeBoxY,
    timelineTitleY,
    timelineTextY,
    contactY,
    height,
    scale: height / DESIGN_HEIGHT,
    warp,
  };
}
