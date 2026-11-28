import { describe, expect, it } from "vitest"

import { historyReference, matchesFilter, parseHistoryFilter, toHistoryEntry, type PointsEventInput } from "./historyView"

const event = (over: Partial<PointsEventInput>): PointsEventInput => ({
  at: "2026-11-28T03:00:00Z",
  kind: "quest",
  title: "Follow Instagram",
  category: null,
  points: 30,
  status: "earned",
  ...over,
})

const clock = () => "10:00"
const label = (id: string) => (id === "play-tech" ? "Play-Tech" : id)

describe("points history view", () => {
  it("formats amounts with their sign", () => {
    expect(toHistoryEntry(event({ points: 30 }), clock, label).amount).toBe("+30")
    expect(toHistoryEntry(event({ points: -30, status: "voided" }), clock, label).amount).toBe("-30")
    expect(toHistoryEntry(event({ points: 0, status: "voided" }), clock, label).amount).toBe("0")
  })

  it("describes booth rows by area and voided proofs by what happened", () => {
    expect(toHistoryEntry(event({ kind: "visit", category: "play-tech" }), clock, label)).toMatchObject({
      detail: "Booth · Play-Tech",
      source: "Booth",
      time: "10:00",
    })
    expect(toHistoryEntry(event({ points: -30, status: "voided" }), clock, label).detail).toBe("Bukti ditolak, poin dibatalkan")
    expect(toHistoryEntry(event({ points: 0, status: "voided" }), clock, label).detail).toBe("Bukti ulang ditolak")
  })

  it("filters ups, downs and rows still being checked", () => {
    const up = event({ points: 30 })
    const down = event({ points: -30, status: "voided" })
    const manualDown = event({ kind: "manual", points: -10, status: "manual" })
    const pending = event({ status: "pending" })
    const review = event({ status: "review" })

    expect([up, down, manualDown, pending, review].filter((e) => matchesFilter(e, "up"))).toEqual([up, review])
    expect([up, down, manualDown, pending, review].filter((e) => matchesFilter(e, "down"))).toEqual([down, manualDown])
    expect([up, down, manualDown, pending, review].filter((e) => matchesFilter(e, "check"))).toEqual([pending, review])
    expect([up, down].filter((e) => matchesFilter(e, "all"))).toHaveLength(2)
  })

  it("falls back to all for an unknown filter", () => {
    expect(parseHistoryFilter("down")).toBe("down")
    expect(parseHistoryFilter("<script>")).toBe("all")
    expect(parseHistoryFilter(["up", "down"])).toBe("all")
    expect(parseHistoryFilter(undefined)).toBe("all")
  })

  it("builds a short help-desk reference", () => {
    expect(historyReference("0913837e-aaaa-bbbb-cccc-dddddddddddd")).toBe("REF · U-0913837e")
  })
})
