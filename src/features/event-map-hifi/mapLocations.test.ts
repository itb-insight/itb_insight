import { describe, expect, it } from "vitest"

import { MAP_CATEGORIES, pinForCategory } from "./mapCategories"
import { MAP_LOCATIONS, parseParkingName } from "./mapLocations"

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

  it("lists exits and entry gates with the side they are on", () => {
    const gates = byCategory("gate").map((l) => [l.name, l.description])
    expect(gates).toEqual([
      ["Main Gate", "Pintu masuk · sisi selatan · dekat Monumen Kubus"],
      ["Exit 1", "Pintu keluar · sisi utara · dekat Tunnel"],
      ["Exit 2", "Pintu keluar · sisi barat laut"],
    ])
  })

  it("moves parking vehicle types out of the title into icons", () => {
    expect(parseParkingName("Parkir Sipil - Motorcycles only")).toEqual({ name: "Parkir Sipil", vehicles: ["motorcycle"] })
    expect(parseParkingName("Parkir Seni Rupa (motorcycles and car)")).toEqual({
      name: "Parkir Seni Rupa",
      vehicles: ["motorcycle", "car"],
    })
    expect(parseParkingName("Parkir Timur")).toEqual({ name: "Parkir Timur", vehicles: [] })
    const publicParking = byCategory("parkir").filter((l) => !l.starred)
    expect(publicParking.map((l) => [l.name, l.vehicles])).toEqual([
      ["Parkir Sipil", ["motorcycle"]],
      ["Parkir Seni Rupa", ["motorcycle", "car"]],
    ])
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
