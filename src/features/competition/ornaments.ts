/**
 * Posisi ornamen latar — diambil langsung dari Figma REST API,
 * bukan hasil menakar dari screenshot.
 *
 * NEURON_PLACEMENTS
 *   Di Figma ini SATU gambar yang sama (imageRef 01b7df9f...) yang
 *   ditempatkan berulang dengan ukuran, rotasi, dan opacity berbeda.
 *   Jadi hanya butuh SATU file: public/deco/neuron.png (PNG transparan).
 *
 * x/y adalah sudut kiri-atas SEBELUM dirotasi, relatif terhadap sudut
 * kiri-atas frame 393x3284. w/h adalah ukuran asli (bukan bounding box
 * setelah rotasi). r adalah sudut untuk CSS rotate(), dalam derajat.
 *
 * Tujuh neuron kecil di sekitar y=1982-2090 (enam di y=2048, satu di
 * x=285) dulu menghiasi enam kotak digit prizepool di Figma. Kotak itu
 * sudah diganti satu kartu hadiah (PrizePool.tsx), jadi neuron-neuron itu
 * dibuang: kalau tidak, tampil sebagai salinan berulang di belakang kartu.
 */

export interface Placement {
  x: number;
  y: number;
  w: number;
  h: number;
  /** opacity */
  o: number;
  /** derajat, untuk CSS rotate() */
  r: number;
}

export const NEURON_PLACEMENTS: Record<string, Placement[]> = {
  "safety-and-rescue-robot-competition": [
    { x: 136, y: 428, w: 349.9, h: 498, o: 0.5, r: -119.57 },
    { x: -144.3, y: 1286.1, w: 348.6, h: 496.1, o: 0.5, r: -34.95 },
    { x: 411.9, y: 1336.2, w: 210, h: 298.9, o: 0.5, r: -145.05 },
    { x: -94, y: 1757.8, w: 166.9, h: 237.6, o: 0.5, r: 90.44 },
    { x: 323.9, y: 1761.9, w: 160.4, h: 228.4, o: 0.5, r: 89.56 },
    { x: 318.8, y: 2958.6, w: 187.3, h: 266.6, o: 0.5, r: -151.14 },
    { x: -54.7, y: 3010.6, w: 171.9, h: 244.6, o: 0.5, r: -78.3 },
  ],
  "microdrone-obstacle-race": [
    { x: 136, y: 428, w: 349.9, h: 498, o: 0.5, r: -119.57 },
    { x: -144.3, y: 1286.1, w: 348.6, h: 496.1, o: 0.5, r: -34.95 },
    { x: 411.9, y: 1336.2, w: 210, h: 298.9, o: 0.5, r: -145.05 },
    { x: -94, y: 1757.8, w: 166.9, h: 237.6, o: 0.5, r: 90.44 },
    { x: 323.9, y: 1761.9, w: 160.4, h: 228.4, o: 0.5, r: 89.56 },
    { x: 318.8, y: 2958.6, w: 187.3, h: 266.6, o: 0.5, r: -151.14 },
    { x: -54.7, y: 3010.6, w: 171.9, h: 244.6, o: 0.5, r: -78.3 },
  ],
  "business-plan-competition": [
    { x: 136, y: 428, w: 349.9, h: 498, o: 0.5, r: -119.57 },
    { x: -144.3, y: 1286.1, w: 348.6, h: 496.1, o: 0.5, r: -34.95 },
    { x: 411.9, y: 1336.2, w: 210, h: 298.9, o: 0.5, r: -145.05 },
    { x: -94, y: 1757.8, w: 166.9, h: 237.6, o: 0.5, r: 90.44 },
    { x: 323.9, y: 1761.9, w: 160.4, h: 228.4, o: 0.5, r: 89.56 },
    { x: 318.8, y: 2958.6, w: 187.3, h: 266.6, o: 0.5, r: -151.14 },
    { x: -54.7, y: 3010.6, w: 171.9, h: 244.6, o: 0.5, r: -78.3 },
  ],
  "olimpiade-engineering": [
    { x: 136, y: 428, w: 349.9, h: 498, o: 0.5, r: -119.57 },
    { x: -144.3, y: 1286.1, w: 348.6, h: 496.1, o: 0.5, r: -34.95 },
    { x: 411.9, y: 1336.2, w: 210, h: 298.9, o: 0.5, r: -145.05 },
    { x: -94, y: 1757.8, w: 166.9, h: 237.6, o: 0.5, r: 90.44 },
    { x: 323.9, y: 1761.9, w: 160.4, h: 228.4, o: 0.5, r: 89.56 },
    { x: 318.8, y: 2958.6, w: 187.3, h: 266.6, o: 0.5, r: -151.14 },
    { x: -54.7, y: 3010.6, w: 171.9, h: 244.6, o: 0.5, r: -78.3 },
  ],
};

