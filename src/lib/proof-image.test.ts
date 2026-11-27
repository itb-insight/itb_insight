import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { optimizeProofImage, PROOF_MAX_SIDE } from './proof-image'

async function photo(width: number, height: number, format: 'jpeg' | 'png'): Promise<Uint8Array> {
  const img = sharp({ create: { width, height, channels: 3, background: { r: 40, g: 90, b: 200 } } })
    // GPS-looking EXIF that must not survive.
    .withExif({ IFD0: { Make: 'TestPhone', Model: 'X' }, IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '6/1 53/1 0/1' } })
  return new Uint8Array(await (format === 'jpeg' ? img.jpeg() : img.png()).toBuffer())
}

describe('optimizeProofImage', () => {
  it('shrinks a large phone screenshot to WebP within the max side', async () => {
    const input = await photo(1170, 2532, 'png')
    const out = await optimizeProofImage(input)
    expect(out).not.toBeNull()
    expect(out!.mime).toBe('image/webp')
    expect(Math.max(out!.width, out!.height)).toBe(PROOF_MAX_SIDE)
    expect(out!.bytes.byteLength).toBeLessThan(input.byteLength)
    const meta = await sharp(out!.bytes).metadata()
    expect(meta.format).toBe('webp')
  })

  it('drops EXIF metadata', async () => {
    const out = await optimizeProofImage(await photo(800, 600, 'jpeg'))
    const meta = await sharp(out!.bytes).metadata()
    expect(meta.exif).toBeUndefined()
  })

  it('does not enlarge small images', async () => {
    const out = await optimizeProofImage(await photo(400, 300, 'jpeg'))
    expect([out!.width, out!.height]).toEqual([400, 300])
  })

  it('returns null for bytes that are not an image', async () => {
    expect(await optimizeProofImage(new Uint8Array([0xff, 0xd8, 0xff, 0x00, 1, 2, 3]))).toBeNull()
  })
})
