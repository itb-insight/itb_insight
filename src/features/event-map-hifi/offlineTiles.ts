import { MAP_INITIAL_VIEW, MAP_STYLE_URL } from "./mapLocations"
import { VENUE_LAYOUT } from "./venueLayout"

/*
  What the service worker (public/sw.js, WARM_MAP) downloads so /event-map works without signal:
  the Carto style, its sprites, the glyphs our labels use, and the basemap tiles covering the
  venue. docs/OFFLINE.md.
*/

export type TileCoord = { z: number; x: number; y: number }
type Bounds = [[number, number], [number, number]]

/** Carto's vector tiles stop at z15 (MapLibre overzooms past it). */
export const OFFLINE_ZOOMS = [12, 13, 14, 15] as const
const MAX_TILES = 200

/** Slippy-map tile coordinates covering [[west, south], [east, north]] at each zoom. */
export function tilesForBounds(bounds: Bounds, zooms: readonly number[], limit = MAX_TILES): TileCoord[] {
  const [[west, south], [east, north]] = bounds
  const tiles: TileCoord[] = []
  for (const z of zooms) {
    const n = 2 ** z
    const tx = (lng: number) => Math.min(n - 1, Math.max(0, Math.floor(((lng + 180) / 360) * n)))
    const ty = (lat: number) => {
      const rad = (lat * Math.PI) / 180
      const y = Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n)
      return Math.min(n - 1, Math.max(0, y))
    }
    for (let x = tx(west); x <= tx(east); x++) {
      for (let y = ty(north); y <= ty(south); y++) {
        if (tiles.length >= limit) return tiles
        tiles.push({ z, x, y })
      }
    }
  }
  return tiles
}

/** The area the map may show, or about 1 km around the start view when the layout has no corners. */
export function venueBounds(): Bounds {
  if (VENUE_LAYOUT.bounds) return VENUE_LAYOUT.bounds
  const { longitude, latitude } = MAP_INITIAL_VIEW
  return [
    [longitude - 0.01, latitude - 0.01],
    [longitude + 0.01, latitude + 0.01],
  ]
}

/** Font stacks of our own label layers (MapCanvasHifi), fetched as glyph range 0-255. */
export const FONT_STACKS = [
  ["Montserrat SemiBold", "Open Sans Bold", "Noto Sans Regular", "Noto Sans CJK JP Regular"],
  ["Montserrat SemiBold Italic", "Open Sans Italic", "Noto Sans Regular", "Noto Sans CJK JP Regular"],
]

export function warmMapMessage() {
  return {
    type: "WARM_MAP" as const,
    styleUrl: MAP_STYLE_URL,
    tiles: tilesForBounds(venueBounds(), OFFLINE_ZOOMS),
    fontStacks: FONT_STACKS.map((stack) => stack.join(",")),
  }
}
