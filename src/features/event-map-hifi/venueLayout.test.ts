import { describe, expect, it } from "vitest"

import { labelPoint, lineMidpoint, pointInRing, VENUE_LAYOUT } from "./venueLayout"

const { zones, lines, labels, anchors, eventArea } = VENUE_LAYOUT

describe("venue layout (venue-layout.json)", () => {
  it("keeps the event area out of the drawn layers", () => {
    expect(eventArea?.geometry.type).toBe("Polygon")
    const ids = [...zones.features, ...lines.features, ...labels.features].map((f) => f.properties.id)
    expect(ids.some((id) => id.includes("event-area"))).toBe(false)
    expect(labels.features.some((f) => /event area/i.test(f.properties.label))).toBe(false)
  })

  it("splits parking into public and special-guest spots, and finds both toilets", () => {
    expect(anchors.filter((a) => a.kind === "parking-guest")).toHaveLength(6)
    expect(anchors.filter((a) => a.kind === "parking-public").map((a) => a.name)).toEqual([
      "Parkir Sipil - Motorcycles only",
      "Parkir Seni Rupa (motorcycles and car)",
    ])
    expect(anchors.filter((a) => a.kind === "toilet")).toHaveLength(2)
    // Parking and toilets get pins, not text labels.
    expect(labels.features.some((f) => /parking|toilet/i.test(f.properties.label))).toBe(false)
  })

  it("labels each named zone once and marks backstage and FOH sterile", () => {
    const zoneLabels = labels.features.filter((f) => f.properties.kind === "zone").map((f) => f.properties.label)
    expect(zoneLabels.sort()).toEqual(
      [
        "Backstage",
        "Drone Soccer",
        "Exhibition",
        "FOH Area",
        "Food and Beverages",
        "Main Gate",
        "Olympiad + BPC",
        "Play Tech",
        "Seminar + Showtech",
        "Stage",
      ].sort(),
    )
    const sterile = zones.features.filter((f) => f.properties.sterile).map((f) => f.properties.id)
    expect(sterile.sort()).toEqual(["backstage", "foh-area"])
    for (const id of sterile) {
      expect(labels.features.find((f) => f.properties.id === id)?.properties.sublabel).toBe("STERILE")
    }
  })

  it("tags only enter/exit paths and sterile lines", () => {
    const tags = labels.features
      .filter((f) => f.properties.kind === "path-tag" || f.properties.kind === "sterile-tag")
      .map((f) => f.properties.label)
    expect(tags.sort()).toEqual(["Enter Exhibition", "Exit Exhibition", "Exit Play Tech", "Sterile", "Sterile"])
    expect(lines.features.filter((f) => f.properties.kind === "sterile")).toHaveLength(2)
  })

  it("turns named points into exits and landmarks", () => {
    const of = (kind: string) => labels.features.filter((f) => f.properties.kind === kind).map((f) => f.properties.label)
    expect(of("exit")).toEqual(["Exit", "Exit"])
    expect(of("landmark").sort()).toEqual(["Indonesia Tenggelam", "Lapangan Basket & Voli", "Monumen Kubus", "Tunnel"])
  })

  it("drops the degenerate shapes geojson.io leaves behind", () => {
    for (const f of zones.features) expect(f.geometry.coordinates[0].length).toBeGreaterThanOrEqual(4)
    for (const f of lines.features) expect(f.geometry.coordinates.length).toBeGreaterThanOrEqual(2)
  })

  it("puts every anchor inside its polygon", () => {
    for (const zone of zones.features) {
      const anchor = anchors.find((a) => a.id === zone.properties.id)
      expect(anchor, zone.properties.id).toBeDefined()
      expect(pointInRing([anchor!.lng, anchor!.lat], zone.geometry.coordinates[0]), zone.properties.id).toBe(true)
    }
  })
})

describe("geometry helpers", () => {
  it("labels a concave (U-shaped) polygon inside one of its arms", () => {
    const u = [
      [0, 0],
      [3, 0],
      [3, 3],
      [2, 3],
      [2, 1],
      [1, 1],
      [1, 3],
      [0, 3],
      [0, 0],
    ]
    expect(pointInRing(labelPoint(u), u)).toBe(true)
  })

  it("finds the midpoint of a line by length", () => {
    expect(lineMidpoint([[0, 0], [0, 1], [0, 3]])).toEqual([0, 1.5])
  })
})
