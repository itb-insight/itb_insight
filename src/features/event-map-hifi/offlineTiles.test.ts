import { describe, expect, it } from "vitest"

import { OFFLINE_ZOOMS, tilesForBounds, venueBounds, warmMapMessage } from "./offlineTiles"

describe("tilesForBounds", () => {
  it("finds the tile under a point (ITB campus at z15)", () => {
    // 107.61 E, -6.89 S: x = floor(287.61 / 360 * 2^15); south of the equator, so y > 2^14.
    const [tile] = tilesForBounds(
      [
        [107.61, -6.89],
        [107.61, -6.89],
      ],
      [15],
    )
    expect(tile).toEqual({ z: 15, x: 26178, y: 17012 })
  })

  it("covers the whole box, north to south", () => {
    const tiles = tilesForBounds(
      [
        [107.6, -6.9],
        [107.62, -6.88],
      ],
      [15],
    )
    const xs = new Set(tiles.map((t) => t.x))
    const ys = new Set(tiles.map((t) => t.y))
    expect(xs.size * ys.size).toBe(tiles.length)
    expect(tiles.length).toBeGreaterThan(1)
  })

  it("stops at the limit", () => {
    expect(tilesForBounds([[100, -10], [110, 0]], [15], 50)).toHaveLength(50)
  })
})

describe("warmMapMessage", () => {
  it("stays small enough to download on a weak signal", () => {
    const message = warmMapMessage()
    expect(message.tiles.length).toBeGreaterThan(0)
    expect(message.tiles.length).toBeLessThanOrEqual(200)
    expect(new Set(message.tiles.map((t) => t.z))).toEqual(new Set(OFFLINE_ZOOMS))
    const [[west, south], [east, north]] = venueBounds()
    expect(west).toBeLessThan(east)
    expect(south).toBeLessThan(north)
  })
})
