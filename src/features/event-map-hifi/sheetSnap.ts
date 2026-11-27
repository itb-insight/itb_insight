/*
  Mobile bottom sheet snap points. Keep in sync with .snapClosed / .snapHalf / .snapFull in
  MapBottomSheet.module.css. `available` is the height under the navbar (the map's height).
*/

export type SheetSnap = "closed" | "half" | "full"

export const SHEET_SNAPS: SheetSnap[] = ["closed", "half", "full"]

const CLOSED_PX = 44
const HALF_PX = 360
const HALF_MAX_SHARE = 0.6

export function sheetHeights(available: number): Record<SheetSnap, number> {
  return {
    closed: CLOSED_PX,
    half: Math.min(HALF_PX, available * HALF_MAX_SHARE),
    full: available,
  }
}

/** Flick faster than this (px/ms) and the sheet goes to the next snap in that direction. */
const FLICK_SPEED = 0.5

/**
 * Where a released drag settles. `height` is the sheet height at release, `velocity` is in px/ms,
 * positive when moving up.
 */
export function pickSnap(height: number, velocity: number, heights: Record<SheetSnap, number>): SheetSnap {
  if (Math.abs(velocity) > FLICK_SPEED) {
    if (velocity > 0) return SHEET_SNAPS.find((s) => heights[s] > height + 1) ?? "full"
    return [...SHEET_SNAPS].reverse().find((s) => heights[s] < height - 1) ?? "closed"
  }
  let best: SheetSnap = "half"
  for (const snap of SHEET_SNAPS) {
    if (Math.abs(heights[snap] - height) < Math.abs(heights[best] - height)) best = snap
  }
  return best
}

/** Tapping the handle: closed -> half -> full -> half. */
export function nextSnapOnTap(snap: SheetSnap): SheetSnap {
  return snap === "half" ? "full" : "half"
}
