import 'server-only'

import sharp from 'sharp'

/*
  Re-encodes an Insight Arcade proof before it is stored (bucket arcade-proofs).
  The browser already shrinks the photo (ProofUploadForm), but that step can be skipped or fail,
  so the server makes the stored file small and safe on its own:
  - longest side at most 1600 px (phone screenshots stay readable for reviewers),
  - WebP at quality 78 (a 1170x2532 screenshot lands around 100-250 KB),
  - EXIF orientation applied, then all metadata dropped (no GPS or device data is kept),
  - first frame only, and a pixel cap against decompression bombs.
*/

export const PROOF_MAX_SIDE = 1600
const MAX_INPUT_PIXELS = 40_000_000

export type OptimizedProof = { bytes: Uint8Array; ext: 'webp'; mime: 'image/webp'; width: number; height: number }

export async function optimizeProofImage(input: Uint8Array): Promise<OptimizedProof | null> {
  try {
    const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, animated: false })
      .rotate()
      .resize({ width: PROOF_MAX_SIDE, height: PROOF_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer({ resolveWithObject: true })
    return { bytes: new Uint8Array(data), ext: 'webp', mime: 'image/webp', width: info.width, height: info.height }
  } catch {
    return null
  }
}
