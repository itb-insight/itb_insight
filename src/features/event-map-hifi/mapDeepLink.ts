import { MAP_CATEGORIES, type MapCategory } from "./mapCategories"
import { MAP_LOCATIONS, type MapLocation } from "./mapLocations"

export type MapDeepLink = { place: MapLocation } | { category: MapCategory } | null

/**
 * What `/event-map?place=<id>` or `?category=<id>` asks to open (links built by mapPlaceHref /
 * mapCategoryHref in src/lib/maps.ts). The values are only looked up, never rendered, so an
 * unknown or hostile id simply opens the plain map.
 */
export function resolveMapDeepLink(search: string): MapDeepLink {
  const params = new URLSearchParams(search)
  const placeId = params.get("place")
  const place = placeId ? MAP_LOCATIONS.find((l) => l.id === placeId) : undefined
  if (place) return { place }
  const categoryId = params.get("category")
  const category = categoryId ? MAP_CATEGORIES.find((c) => c.id === categoryId) : undefined
  return category ? { category } : null
}
