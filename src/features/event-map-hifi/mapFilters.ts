/*
  Map filter tabs. A tab decides which zones, pins and sidebar entries are shown.
  Paths, exits, landmarks, gates and sterile areas stay visible on every tab, and so does the
  "Exits & Gates" sidebar section.
*/

export const MAP_TABS = ["All", "Competition", "Exhibition", "Amenities"] as const

export type MapTab = (typeof MAP_TABS)[number]

type FilterTab = Exclude<MapTab, "All">

/** Event zones by layout id (the slugged zone name). */
const ZONE_TABS: Record<string, FilterTab[]> = {
  "drone-soccer": ["Competition", "Exhibition"],
  "olympiad-bpc": ["Competition"],
  stage: ["Exhibition"],
  "play-tech": ["Exhibition"],
  "seminar-showtech": ["Exhibition"],
  exhibition: ["Exhibition"],
  "food-and-beverages": ["Amenities"],
  "masjid-brin": ["Amenities"],
  "masjid-salman": ["Amenities"],
}

/** Sidebar categories. Event zones inside "event" are filtered further by ZONE_TABS. */
const CATEGORY_TABS: Record<string, FilterTab[]> = {
  event: ["Competition", "Exhibition"],
  gate: ["Competition", "Exhibition", "Amenities"], // exits and gates: every tab
  megaprop: ["Exhibition"],
  booth: ["Exhibition"],
  fnb: ["Amenities"],
  toilet: ["Amenities"],
  salat: ["Amenities"],
  parkir: ["Amenities"],
}

export interface ZoneLike {
  id: string
  kind: string
  sterile: boolean
}

export interface LocationLike {
  id: string
  category: string
}

export function isZoneVisible(tab: MapTab, zone: ZoneLike): boolean {
  if (tab === "All" || zone.sterile || zone.kind === "gate") return true
  if (zone.kind === "parking" || zone.kind === "toilet") return tab === "Amenities"
  return ZONE_TABS[zone.id]?.includes(tab) ?? false
}

export function isLocationVisible(tab: MapTab, location: LocationLike): boolean {
  if (tab === "All") return true
  const tabs = ZONE_TABS[location.id] ?? CATEGORY_TABS[location.category] ?? []
  return tabs.includes(tab)
}

export function isCategoryVisible(tab: MapTab, categoryId: string): boolean {
  return tab === "All" || (CATEGORY_TABS[categoryId]?.includes(tab) ?? false)
}
