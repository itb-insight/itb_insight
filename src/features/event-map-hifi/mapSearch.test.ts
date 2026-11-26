import { describe, expect, it } from "vitest"

import { MAP_LOCATIONS } from "./mapLocations"
import { normalize, searchLocations } from "./mapSearch"

const names = (query: string) => searchLocations(query, MAP_LOCATIONS).map((l) => l.name)

describe("map search", () => {
  it("returns nothing for an empty query", () => {
    expect(searchLocations("   ", MAP_LOCATIONS)).toEqual([])
  })

  it("matches names regardless of case and punctuation, best match first", () => {
    expect(names("drone")[0]).toBe("Drone Soccer")
    expect(names("PLAY-TECH")[0]).toBe("Play Tech")
    expect(names("olympiad bpc")).toEqual(["Olympiad + BPC"])
  })

  it("matches descriptions, linked pages and category keywords", () => {
    expect(names("insight on stage")).toContain("Stage")
    expect(names("business plan")).toEqual(["Olympiad + BPC"])
    expect(names("wc")).toEqual(["Toilet 1", "Toilet 2"])
    expect(names("parking")).toHaveLength(8)
    expect(names("makan")).toEqual(["Food and Beverages"])
    expect(names("mobil")).toEqual(["Parkir Seni Rupa"])
    expect(names("motor").sort()).toEqual(["Parkir Seni Rupa", "Parkir Sipil"])
    expect(names("keluar")).toEqual(["Exit 1", "Exit 2"])
  })

  it("requires every word to match", () => {
    expect(names("parkir sipil")).toEqual(["Parkir Sipil"])
    expect(names("toilet zzz")).toEqual([])
  })

  it("normalizes accents and symbols", () => {
    expect(normalize("  Café & Résto!! ")).toBe("cafe resto")
  })
})
