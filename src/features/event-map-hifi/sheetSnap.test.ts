import { describe, expect, it } from "vitest"

import { nextSnapOnTap, pickSnap, sheetHeights } from "./sheetSnap"

const heights = sheetHeights(700) // closed 44, half 360, full 700

describe("bottom sheet snapping", () => {
  it("caps the half state on short screens", () => {
    expect(sheetHeights(400).half).toBe(240)
    expect(heights).toEqual({ closed: 44, half: 360, full: 700 })
  })

  it("settles on the nearest snap after a slow drag", () => {
    expect(pickSnap(100, 0, heights)).toBe("closed")
    expect(pickSnap(300, 0.1, heights)).toBe("half")
    expect(pickSnap(600, -0.1, heights)).toBe("full")
  })

  it("follows a flick to the next snap in its direction", () => {
    expect(pickSnap(380, 1, heights)).toBe("full")
    expect(pickSnap(380, -1, heights)).toBe("half")
    expect(pickSnap(340, -1, heights)).toBe("closed")
    expect(pickSnap(340, 1, heights)).toBe("half")
    expect(pickSnap(700, 1, heights)).toBe("full")
    expect(pickSnap(44, -1, heights)).toBe("closed")
  })

  it("cycles on tap: closed -> half -> full -> half", () => {
    expect(nextSnapOnTap("closed")).toBe("half")
    expect(nextSnapOnTap("half")).toBe("full")
    expect(nextSnapOnTap("full")).toBe("half")
  })
})
