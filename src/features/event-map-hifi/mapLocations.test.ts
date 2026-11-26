import { describe, expect, it } from "vitest"

import { MAP_CATEGORIES, pinForCategory } from "./mapCategories"
import { MAP_LOCATIONS } from "./mapLocations"

const byCategory = (id: string) => MAP_LOCATIONS.filter((l) => l.category === id)

describe("map locations", () => {
  it("lists every event and competition zone with a summary and page links", () => {
    const events = byCategory("event")
    expect(events.map((e) => e.name).sort()).toEqual(
      ["Drone Soccer", "Exhibition", "Olympiad + BPC", "Play Tech", "Seminar + Showtech", "Stage"].sort(),
    )
    for (const event of events) {
      expect(event.about, event.name).toBeTruthy()
      expect(event.links?.length, event.name).toBeGreaterThan(0)
      for (const link of event.links!) expect(link.href).toMatch(/^\/(event|competition)\/[a-z0-9-]+(#[a-z]+)?$/)
    }
  })

  it("gives parking, toilets and food pins, and stars only guest parking", () => {
    expect(byCategory("parkir")).toHaveLength(8)
    expect(byCategory("parkir").filter((l) => l.starred)).toHaveLength(6)
    expect(byCategory("toilet")).toHaveLength(2)
    expect(byCategory("fnb").map((l) => l.name)).toEqual(["Food and Beverages"])
    for (const id of ["parkir", "toilet", "fnb"]) expect(pinForCategory(id)).toMatch(/^\/map-pin\//)
  })

  it("leaves sterile zones (backstage, FOH) out of the place list", () => {
    const ids = MAP_LOCATIONS.map((l) => l.id)
    expect(ids).not.toContain("backstage")
    expect(ids).not.toContain("foh-area")
  })

  it("describes every place and uses unique ids and known categories", () => {
    const categories = new Set(MAP_CATEGORIES.map((c) => c.id))
    for (const place of MAP_LOCATIONS) {
      expect(place.description, place.id).toBeTruthy()
      expect(categories.has(place.category), place.id).toBe(true)
    }
    expect(new Set(MAP_LOCATIONS.map((l) => l.id)).size).toBe(MAP_LOCATIONS.length)
  })
})
