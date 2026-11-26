import { MAP_CATEGORIES } from "./mapCategories"
import { VEHICLE_LABELS, type MapLocation } from "./mapLocations"

const VEHICLE_WORDS = { motorcycle: "motorcycle sepeda motor", car: "car" }

/** Lower-case, accents stripped, punctuation collapsed to single spaces. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function haystack(location: MapLocation): string {
  const category = MAP_CATEGORIES.find((c) => c.id === location.category)
  return normalize(
    [
      location.name,
      location.description ?? "",
      category?.label ?? "",
      category?.keywords ?? "",
      ...(location.links ?? []).map((l) => l.label),
      ...(location.vehicles ?? []).map((v) => `${VEHICLE_LABELS[v]} ${VEHICLE_WORDS[v]}`),
    ].join(" "),
  )
}

/**
 * Places matching every word of `query` (in name, description, category or page links),
 * best first: name starts with the query, then name contains it, then the rest.
 */
export function searchLocations(query: string, locations: MapLocation[]): MapLocation[] {
  const q = normalize(query)
  if (!q) return []
  const words = q.split(" ")

  const scored: { location: MapLocation; score: number; index: number }[] = []
  locations.forEach((location, index) => {
    const text = haystack(location)
    if (!words.every((w) => text.includes(w))) return
    const name = normalize(location.name)
    const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2
    scored.push({ location, score, index })
  })
  return scored.sort((a, b) => a.score - b.score || a.index - b.index).map((s) => s.location)
}
