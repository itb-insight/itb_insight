import { describe, expect, it } from 'vitest'

import { exists, fileSize, listFiles, readText, trackedFiles } from '../support/repo'

/*
  Performance budget for what ships to visitors.

  - files in public/ stay under MAX_PUBLIC_FILE_BYTES: everything there is uploaded with every
    deploy and served as-is (no optimization for CSS backgrounds, <video>, raw <img>)
  - source code does not reference public assets over MAX_REFERENCED_BYTES: resize and convert
    to WebP/AVIF (images) or re-encode (video) first
  - no Google Fonts @import: next/font already self-hosts the fonts without blocking render

  The baselines record today's offenders. They may shrink, never grow: a baseline file that gets
  bigger fails, and a fixed one must be removed from the list.
*/

const MAX_PUBLIC_FILE_BYTES = 5 * 1024 * 1024
const MAX_REFERENCED_BYTES = 1024 * 1024

/** Oversized files in public/ -> recorded size in bytes. */
const OVERSIZED_PUBLIC_BASELINE: Record<string, number> = {
  // 720p scroll video for desktop; the 540p mobile encode is 3.4 MB. See design-sources/README.md.
  'public/itb-model/fallback/scrub-16x9-v2.mp4': 6155159,
  // 3D drone for DroneCube (loaded lazily with next/dynamic). Draco/meshopt compression would cut it a lot.
  'public/models/drone.glb': 23446248,
}

/** Source file -> heavy public assets it already references. */
const HEAVY_REFERENCE_BASELINE: Record<string, string[]> = {
  'src/features/drone/DroneCube.tsx': ['/models/drone.glb'],
  // Served through next/image, which resizes it; the source is just over the limit.
  'src/features/landing/components/GallerySectionHifi/GallerySectionHifi.tsx': ['/images/gallery/fountain.webp'],
  'src/features/landing/components/ScrollVideoBackground/ScrollVideoBackground.tsx': [
    '/itb-model/fallback/scrub-16x9-v2.mp4',
    '/itb-model/fallback/scrub-9x16-v2.mp4',
  ],
}

/** Files that still @import Google Fonts. */
const GOOGLE_FONTS_BASELINE: string[] = []

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const publicFiles = trackedFiles('public').map((file) => [file, fileSize(file)] as const)
const sourceFiles = listFiles('src', /\.(?:ts|tsx|css)$/).filter((file) => !/\.test\.tsx?$/.test(file))

const ASSET_REFERENCE = /["'(](\/[^"'()\s]+\.(?:png|jpe?g|webp|avif|gif|mp4|webm|mov|glb|gltf))["')]/gi
const heavyReferences = new Map<string, string[]>()
for (const file of sourceFiles) {
  const heavy = new Set<string>()
  // Comments don't load anything (e.g. a commented-out backup background).
  const code = readText(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  for (const match of code.matchAll(ASSET_REFERENCE)) {
    const asset = `public${match[1]}`
    if (exists(asset) && fileSize(asset) > MAX_REFERENCED_BYTES) heavy.add(match[1])
  }
  if (heavy.size) heavyReferences.set(file, [...heavy].sort())
}

describe('guardrail: asset budget', () => {
  it(`no new file in public/ over ${mb(MAX_PUBLIC_FILE_BYTES)}`, () => {
    const offenders = publicFiles
      .filter(([file, size]) => size > MAX_PUBLIC_FILE_BYTES && !(file in OVERSIZED_PUBLIC_BASELINE))
      .map(([file, size]) => `${file} (${mb(size)})`)
    expect(offenders, 'Compress/resize it, or keep source files (raw exports, originals) out of public/').toEqual([])
  })

  it('baselined oversized files do not grow', () => {
    const sizes = new Map(publicFiles)
    const grown = Object.entries(OVERSIZED_PUBLIC_BASELINE)
      .filter(([file, recorded]) => (sizes.get(file) ?? 0) > recorded)
      .map(([file]) => file)
    expect(grown).toEqual([])
  })

  it('the oversized baseline only lists files that are still oversized', () => {
    const sizes = new Map(publicFiles)
    const stale = Object.keys(OVERSIZED_PUBLIC_BASELINE).filter((file) => (sizes.get(file) ?? 0) <= MAX_PUBLIC_FILE_BYTES)
    expect(stale, 'Fixed or deleted: remove these from OVERSIZED_PUBLIC_BASELINE').toEqual([])
  })

  it(`code does not reference new public assets over ${mb(MAX_REFERENCED_BYTES)}`, () => {
    const offenders: string[] = []
    for (const [file, assets] of heavyReferences) {
      for (const asset of assets) {
        if (!HEAVY_REFERENCE_BASELINE[file]?.includes(asset)) offenders.push(`${file} -> ${asset} (${mb(fileSize(`public${asset}`))})`)
      }
    }
    expect(offenders, 'Resize and convert (WebP/AVIF, or a smaller video encode) before referencing it').toEqual([])
  })

  it('the heavy-reference baseline only lists references that still exist', () => {
    const stale = Object.entries(HEAVY_REFERENCE_BASELINE).flatMap(([file, assets]) =>
      assets.filter((asset) => !heavyReferences.get(file)?.includes(asset)).map((asset) => `${file} -> ${asset}`),
    )
    expect(stale, 'Fixed: remove these from HEAVY_REFERENCE_BASELINE').toEqual([])
  })

  it('no new Google Fonts @import (use next/font)', () => {
    const importing = sourceFiles.filter((file) => readText(file).includes('fonts.googleapis.com'))
    expect(importing.filter((file) => !GOOGLE_FONTS_BASELINE.includes(file))).toEqual([])
    expect(
      GOOGLE_FONTS_BASELINE.filter((file) => !importing.includes(file)),
      'Fixed: remove these from GOOGLE_FONTS_BASELINE',
    ).toEqual([])
  })
})
