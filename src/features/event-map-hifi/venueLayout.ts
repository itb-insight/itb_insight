import type { Feature, FeatureCollection, LineString, Point, Polygon, Position } from "geojson"

import raw from "./venue-layout.json"

/*
  Venue layout drawn in geojson.io (source: venue-layout.json; the original export is
  public/map/mapv3.geojson). To update it: open venue-layout.json in geojson.io, edit, save
  over this file. Shapes are classified by their `name` property:

    "event area"                  hidden boundary, used for the live "still inside" count
    "Special Guest Parking"       guest parking (parking pin + star)
    "public parking (<details>)"  public parking (parking pin)
    "toilets"                     toilet (toilet pin)
    "path…"                       walking route; "enter"/"exit" in the name adds a small tag
    "sterile" (line)              sterile barrier
    "TR" / "BL" (points)          top-right / bottom-left corners of the area the map may show
    "Exit" (point)                exit marker
    "…gate / gerbang / entrance / entry…" (polygon or point)
                                  entry gate (listed under "Exits & Gates")
    any other named point         landmark label
    any other named polygon       zone, labelled with its name, filled with its `fill` colour

  Sidebar entries, pins and descriptions are built from this in mapLocations.ts.

  Polygons with no area and lines with fewer than two points (geojson.io leaves these behind
  when a drawing is cancelled) are dropped.
*/

export const PATH_COLOR = "#FACC15"
export const PATH_CASING_COLOR = "#A16207"
export const STERILE_COLOR = "#DC2626"
export const PARKING_COLORS = { public: "#2563EB", guest: "#312E81" } as const
export const TOILET_COLOR = "#33AAFF"
export const EXIT_COLOR = "#15803D"
const DEFAULT_ZONE_COLOR = "#6B7280"

/** Names of entry gates ("Main Gate", "Gerbang Barat", "Side Entrance", ...). */
const GATE_NAME = /\b(gate|gerbang|entrance|entry)\b/i

/**
 * Zones that are sterile (crew/talent only), matched by lower-case name. They are drawn in red
 * with a "STERILE" tag and never get a sidebar entry or description (mapLocations.ts).
 */
const STERILE_ZONES = new Set(["backstage", "foh area", "foh"])

export type ParkingType = keyof typeof PARKING_COLORS

export interface ZoneProps {
  id: string
  kind: "zone" | "gate" | "parking" | "toilet"
  color: string
  sterile: boolean
}

export interface LineProps {
  id: string
  kind: "path" | "sterile"
}

export interface LabelProps {
  id: string
  kind: "zone" | "path-tag" | "sterile-tag" | "landmark" | "exit"
  label: string
  /** Second, smaller line under the label (e.g. "STERILE"), or "". */
  sublabel: string
}

/** One point inside each drawn polygon: where its pin goes and where the map flies to. */
export interface Anchor {
  id: string
  kind: "zone" | "gate" | "exit" | "parking-guest" | "parking-public" | "toilet"
  /** Display name: the zone label, or the details in "public parking (<details>)". */
  name: string
  sterile: boolean
  lng: number
  lat: number
}

export interface VenueLayout {
  zones: FeatureCollection<Polygon, ZoneProps>
  lines: FeatureCollection<LineString, LineProps>
  labels: FeatureCollection<Point, LabelProps>
  anchors: Anchor[]
  /** Event boundary. Never drawn: it backs the live count of people still inside the event. */
  eventArea: Feature<Polygon> | null
  /** [[west, south], [east, north]] from the "BL" and "TR" points; null unless both exist. */
  bounds: [[number, number], [number, number]] | null
}

// ---- geometry (planar; fine at campus scale) ----

/** Even-odd ray cast. `point` and `ring` are [lng, lat]. */
export function pointInRing([x, y]: Position, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function signedArea(ring: Position[]): number {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
  }
  return sum / 2
}

/**
 * A point inside the ring to hang a label on: the area centroid, or for concave shapes whose
 * centroid falls outside, the middle of the widest horizontal run through the centroid's latitude.
 */
export function labelPoint(ring: Position[]): Position {
  const area = signedArea(ring)
  let cx = 0
  let cy = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]
    cx += (ring[j][0] + ring[i][0]) * cross
    cy += (ring[j][1] + ring[i][1]) * cross
  }
  const centroid: Position = [cx / (6 * area), cy / (6 * area)]
  if (pointInRing(centroid, ring)) return centroid

  const y = centroid[1]
  const xs: number[] = []
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi)
  }
  xs.sort((a, b) => a - b)
  let best: Position = centroid
  let widest = -1
  for (let k = 0; k + 1 < xs.length; k += 2) {
    if (xs[k + 1] - xs[k] > widest) {
      widest = xs[k + 1] - xs[k]
      best = [(xs[k] + xs[k + 1]) / 2, y]
    }
  }
  return best
}

/** The point halfway along a line, by length (longitude scaled by cos(latitude)). */
export function lineMidpoint(coords: Position[]): Position {
  const k = Math.cos((coords[0][1] * Math.PI) / 180)
  const seg = (a: Position, b: Position) => Math.hypot((b[0] - a[0]) * k, b[1] - a[1])
  let total = 0
  for (let i = 1; i < coords.length; i++) total += seg(coords[i - 1], coords[i])
  let remaining = total / 2
  for (let i = 1; i < coords.length; i++) {
    const len = seg(coords[i - 1], coords[i])
    if (len >= remaining && len > 0) {
      const t = remaining / len
      const [ax, ay] = coords[i - 1]
      const [bx, by] = coords[i]
      return [ax + (bx - ax) * t, ay + (by - ay) * t]
    }
    remaining -= len
  }
  return coords[coords.length - 1]
}

function hasArea(polygon: Polygon): boolean {
  const ring = polygon.coordinates[0]
  return Array.isArray(ring) && ring.length >= 4 && Math.abs(signedArea(ring)) > 1e-12
}

function hasLength(line: LineString): boolean {
  const c = line.coordinates
  return c.length >= 2 && c.some((p) => p[0] !== c[0][0] || p[1] !== c[0][1])
}

// ---- classification ----

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** "path - enter exhibition" -> "Enter Exhibition"; plain "path" -> null. */
function pathTag(name: string): string | null {
  const rest = name.replace(/^path\b[\s\-–:]*/i, "").trim()
  return /\b(enter|exit)\b/i.test(rest) ? titleCase(rest) : null
}

/** "public parking (Parkir Seni Rupa (motorcycles and car))" -> "Parkir Seni Rupa (motorcycles and car)". */
function parkingName(name: string): string {
  const open = name.indexOf("(")
  return open >= 0 && name.endsWith(")") ? name.slice(open + 1, -1).trim() : name
}

/** The rectangle spanned by the two corner points (min/max, so swapped corners still work). */
function mapBounds(a: Position | null, b: Position | null): VenueLayout["bounds"] {
  if (!a || !b) return null
  const west = Math.min(a[0], b[0])
  const east = Math.max(a[0], b[0])
  const south = Math.min(a[1], b[1])
  const north = Math.max(a[1], b[1])
  if (west === east || south === north) return null
  return [
    [west, south],
    [east, north],
  ]
}

export function buildVenueLayout(source: FeatureCollection): VenueLayout {
  const zones: Feature<Polygon, ZoneProps>[] = []
  const lines: Feature<LineString, LineProps>[] = []
  const labels: Feature<Point, LabelProps>[] = []
  const anchors: Anchor[] = []
  let eventArea: Feature<Polygon> | null = null
  let bottomLeft: Position | null = null
  let topRight: Position | null = null
  const usedIds = new Map<string, number>()

  const uniqueId = (base: string) => {
    const n = (usedIds.get(base) ?? 0) + 1
    usedIds.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  }
  const label = (id: string, kind: LabelProps["kind"], at: Position, text: string, sub = "") =>
    labels.push({
      type: "Feature",
      properties: { id, kind, label: text, sublabel: sub },
      geometry: { type: "Point", coordinates: at },
    })

  for (const feature of source.features) {
    const props = feature.properties ?? {}
    const name = typeof props.name === "string" ? props.name.trim() : ""
    const lower = name.toLowerCase()
    const geometry = feature.geometry

    if (geometry?.type === "Polygon") {
      if (!hasArea(geometry)) continue

      if (lower === "event area") {
        eventArea = { type: "Feature", properties: { name }, geometry }
        continue
      }

      const parkingType: ParkingType | null = lower.startsWith("special guest parking")
        ? "guest"
        : lower.startsWith("public parking")
          ? "public"
          : null
      const [lng, lat] = labelPoint(geometry.coordinates[0])

      if (parkingType) {
        const id = uniqueId(`parking-${parkingType}`)
        zones.push({
          type: "Feature",
          properties: { id, kind: "parking", color: PARKING_COLORS[parkingType], sterile: false },
          geometry,
        })
        anchors.push({ id, kind: `parking-${parkingType}`, name: parkingName(name), sterile: false, lng, lat })
        continue
      }

      if (lower === "toilet" || lower === "toilets") {
        const id = uniqueId("toilet")
        zones.push({ type: "Feature", properties: { id, kind: "toilet", color: TOILET_COLOR, sterile: false }, geometry })
        anchors.push({ id, kind: "toilet", name: "Toilet", sterile: false, lng, lat })
        continue
      }

      const id = uniqueId(slug(name) || "zone")
      const sterile = STERILE_ZONES.has(lower)
      const kind = GATE_NAME.test(name) ? "gate" : "zone"
      const fill = typeof props.fill === "string" && props.fill ? props.fill : DEFAULT_ZONE_COLOR
      zones.push({
        type: "Feature",
        properties: { id, kind, color: sterile ? STERILE_COLOR : fill, sterile },
        geometry,
      })
      if (name) {
        const display = name === lower ? titleCase(name) : name // "backstage" -> "Backstage"
        label(id, "zone", [lng, lat], display, sterile ? "STERILE" : "")
        anchors.push({ id, kind, name: display, sterile, lng, lat })
      }
      continue
    }

    if (geometry?.type === "Point") {
      if (!name) continue
      if (lower === "bl" || lower === "tr") {
        if (lower === "bl") bottomLeft = geometry.coordinates
        else topRight = geometry.coordinates
        continue
      }
      const exit = lower === "exit"
      const display = name === lower ? titleCase(name) : name // "indonesia tenggelam" -> "Indonesia Tenggelam"
      const id = uniqueId(exit ? "exit" : slug(name))
      const [lng, lat] = geometry.coordinates
      label(id, exit ? "exit" : "landmark", [lng, lat], display)
      if (exit || GATE_NAME.test(name)) {
        anchors.push({ id, kind: exit ? "exit" : "gate", name: display, sterile: false, lng, lat })
      }
      continue
    }

    if (geometry?.type === "LineString") {
      if (!hasLength(geometry)) continue
      const sterile = lower === "sterile"
      const id = uniqueId(sterile ? "sterile" : slug(name) || "path")
      lines.push({ type: "Feature", properties: { id, kind: sterile ? "sterile" : "path" }, geometry })

      const tag = sterile ? "Sterile" : pathTag(name)
      if (tag) label(id, sterile ? "sterile-tag" : "path-tag", lineMidpoint(geometry.coordinates), tag)
    }
  }

  return {
    zones: { type: "FeatureCollection", features: zones },
    lines: { type: "FeatureCollection", features: lines },
    labels: { type: "FeatureCollection", features: labels },
    anchors,
    eventArea,
    bounds: mapBounds(bottomLeft, topRight),
  }
}

export const VENUE_LAYOUT = buildVenueLayout(raw as unknown as FeatureCollection)

// ---- "You are here" range ----

/** The visitor's location is only used inside the event area or up to this far outside it. */
export const EVENT_AREA_MARGIN_M = 1000

const METRES_PER_DEGREE = 111_320

/**
 * Metres from `point` to the polygon ring: 0 inside, otherwise the distance to the nearest edge.
 * Uses a flat projection around the point, accurate to well under 1% at this scale.
 */
export function distanceToRingM(point: { lat: number; lng: number }, ring: Position[]): number {
  if (pointInRing([point.lng, point.lat], ring)) return 0
  const k = Math.cos((point.lat * Math.PI) / 180) * METRES_PER_DEGREE
  const xy = (p: Position) => [(p[0] - point.lng) * k, (p[1] - point.lat) * METRES_PER_DEGREE]
  let best = Infinity
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = xy(ring[i - 1])
    const [bx, by] = xy(ring[i])
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    // Closest point on segment AB to the origin (the visitor).
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / len2))
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return best
}

/**
 * True when the visitor is inside the event area or within EVENT_AREA_MARGIN_M of it. Without
 * an "event area" polygon nobody is in range, so the location feature stays off.
 */
export function isNearEventArea(point: { lat: number; lng: number }): boolean {
  const ring = VENUE_LAYOUT.eventArea?.geometry.coordinates[0]
  return !!ring && distanceToRingM(point, ring) <= EVENT_AREA_MARGIN_M
}
