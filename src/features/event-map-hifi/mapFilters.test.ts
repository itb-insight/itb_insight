import { describe, expect, it } from "vitest"

import { isCategoryVisible, isLocationVisible, isZoneVisible, type MapTab } from "./mapFilters"
import { MAP_LOCATIONS } from "./mapLocations"
import { VENUE_LAYOUT } from "./venueLayout"

const placesOn = (tab: MapTab) => MAP_LOCATIONS.filter((l) => isLocationVisible(tab, l))
const eventsOn = (tab: MapTab) =>
  placesOn(tab)
    .filter((l) => l.category === "event")
    .map((l) => l.id)
    .sort()
const zonesOn = (tab: MapTab) =>
  VENUE_LAYOUT.zones.features.filter((f) => isZoneVisible(tab, f.properties)).map((f) => f.properties.id)

describe("map filter tabs", () => {
  it("shows everything on All", () => {
    expect(placesOn("All")).toHaveLength(MAP_LOCATIONS.length)
    expect(zonesOn("All")).toHaveLength(VENUE_LAYOUT.zones.features.length)
  })

  it("Competition: Drone Soccer and Olympiad + BPC", () => {
    expect(eventsOn("Competition")).toEqual(["drone-soccer", "olympiad-bpc"])
    expect(new Set(placesOn("Competition").map((l) => l.category))).toEqual(new Set(["event", "gate"]))
  })

  it("Exhibition: Stage, Drone Soccer, Play Tech, Seminar + Showtech, Exhibition", () => {
    expect(eventsOn("Exhibition")).toEqual(["drone-soccer", "exhibition", "play-tech", "seminar-showtech", "stage"])
  })

  it("Amenities: parking, toilets, food and beverages (and mushola later)", () => {
    expect(new Set(placesOn("Amenities").map((l) => l.category))).toEqual(new Set(["parkir", "toilet", "fnb", "gate"]))
    expect(placesOn("Amenities")).toHaveLength(MAP_LOCATIONS.filter((l) => l.category !== "event").length)
    expect(isCategoryVisible("Amenities", "mushola")).toBe(true)
    expect(isCategoryVisible("Amenities", "event")).toBe(false)
  })

  it("keeps the Exits & Gates section on every tab", () => {
    for (const tab of ["All", "Competition", "Exhibition", "Amenities"] as const) {
      expect(isCategoryVisible(tab, "gate"), tab).toBe(true)
      expect(placesOn(tab).filter((l) => l.category === "gate"), tab).toHaveLength(3)
    }
  })

  it("keeps sterile areas and the main gate on every tab", () => {
    for (const tab of ["Competition", "Exhibition", "Amenities"] as const) {
      const zones = zonesOn(tab)
      expect(zones, tab).toEqual(expect.arrayContaining(["backstage", "foh-area", "main-gate"]))
    }
    expect(zonesOn("Competition")).not.toContain("stage")
    expect(zonesOn("Competition").some((id) => id.startsWith("parking"))).toBe(false)
  })
})
