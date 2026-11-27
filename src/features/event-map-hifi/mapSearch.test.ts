import { describe, expect, it } from "vitest"

import { MAP_LOCATIONS } from "./mapLocations"
import { matchesYou, normalize, searchLocations } from "./mapSearch"

const names = (query: string) => searchLocations(query, MAP_LOCATIONS).map((l) => l.name)

describe("map search", () => {
  it("returns nothing for an empty query", () => {
    expect(searchLocations("   ", MAP_LOCATIONS)).toEqual([])
  })

  it("matches names regardless of case and punctuation, best match first", () => {
    expect(names("drone")[0]).toBe("Drone Soccer")
    expect(names("PLAY-TECH")[0]).toBe("Play Tech")
    expect(names("olympiad bpc")[0]).toBe("Olympiad + BPC")
  })

  it("matches descriptions, linked pages and category keywords", () => {
    expect(names("insight on stage")).toContain("Stage")
    expect(names("business plan")).toEqual(["Olympiad + BPC"])
    expect(names("wc")).toEqual(["Toilet 1", "Toilet 2"])
    expect(names("parking")).toHaveLength(14)
    expect(names("makan")).toEqual(["Food and Beverages"])
    expect(names("mobil").sort()).toEqual(
      [
        "Parkir Seni Rupa",
        "Parkir Sarana Olahraga Ganesha",
        "Parkir Sarana Budaya Ganesha",
        "Parkir Kebun Binatang",
        "Parkir Ganyang",
      ].sort(),
    )
    expect(names("motor")).toHaveLength(7)
    expect(names("keluar")).toEqual(["Exit 1", "Exit 2"])
  })

  it("requires every word to match", () => {
    expect(names("parkir sipil")).toEqual(["Parkir Sipil"])
    expect(names("toilet zzz")).toEqual([])
  })

  it('finds "You are here" with posisi / aku / you and similar words', () => {
    for (const q of ["posisi", "aku", "you", "You are here", "posisi aku", "lokasi saya", "temukan aku", "pos"]) {
      expect(matchesYou(q), q).toBe(true)
    }
    for (const q of ["", "stage", "toilet", "aku stage", "parkir"]) expect(matchesYou(q), q).toBe(false)
  })

  it("normalizes accents and symbols", () => {
    expect(normalize("  Café & Résto!! ")).toBe("cafe resto")
  })
})
