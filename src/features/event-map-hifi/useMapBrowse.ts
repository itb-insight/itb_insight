"use client"

import { useCallback, useMemo, useState } from "react"

import { MAP_CATEGORIES, type MapCategory } from "./mapCategories"
import { isCategoryVisible, isLocationVisible, type MapTab } from "./mapFilters"
import { MAP_LOCATIONS, type MapLocation } from "./mapLocations"
import { matchesYou, searchLocations, YOU_ID } from "./mapSearch"

export interface MapBrowse {
  /** Categories shown on the active tab. */
  categories: MapCategory[]
  openCategory: MapCategory | null
  openPlace: MapLocation | null
  /** Places in the open category, on the active tab. */
  places: MapLocation[]
  query: string
  setQuery: (query: string) => void
  /**
   * Search results on the active tab; empty when there is no query. "posisi" / "aku" / "you"
   * put a "You are here" entry first (on every tab); choosing it calls `onLocateMe`.
   */
  results: MapLocation[]
  openCategoryBy: (category: MapCategory) => void
  openPlaceBy: (place: MapLocation) => void
  /** Open a place from outside the list (e.g. its pin on the map), with its category behind it. */
  showPlace: (place: MapLocation) => void
  backToCategories: () => void
  backToPlaces: () => void
}

/** Sidebar / bottom sheet navigation: categories -> places -> place detail, plus search. */
/** Whether the visitor's position is known and within range of the event area. */
export type YouStatus = "unknown" | "near" | "far"

const YOU_DESCRIPTIONS: Record<YouStatus, string> = {
  unknown: "Ketuk untuk menemukan lokasimu",
  near: "Posisimu saat ini",
  far: "Di luar area acara (lebih dari 1 km)",
}

export function useMapBrowse(tab: MapTab, onLocateMe?: () => void, youStatus: YouStatus = "unknown"): MapBrowse {
  const [category, setCategory] = useState<MapCategory | null>(null)
  const [place, setPlace] = useState<MapLocation | null>(null)
  const [query, setQuery] = useState("")

  // Whatever the active tab hides is closed (derived, so switching back restores it).
  const openCategory = category && isCategoryVisible(tab, category.id) ? category : null
  const openPlace = place && isLocationVisible(tab, place) ? place : null

  const visible = useMemo(() => MAP_LOCATIONS.filter((l) => isLocationVisible(tab, l)), [tab])
  const categories = useMemo(() => MAP_CATEGORIES.filter((c) => isCategoryVisible(tab, c.id)), [tab])
  const places = useMemo(
    () => (openCategory ? visible.filter((l) => l.category === openCategory.id) : []),
    [visible, openCategory],
  )
  const results = useMemo(() => {
    const places = searchLocations(query, visible)
    if (!matchesYou(query)) return places
    const you: MapLocation = {
      id: YOU_ID,
      category: "you",
      name: "You are here",
      description: YOU_DESCRIPTIONS[youStatus],
      lat: 0, // not used: choosing it locates the visitor instead
      lng: 0,
    }
    return [you, ...places]
  }, [query, visible, youStatus])

  const openCategoryBy = useCallback((next: MapCategory) => {
    setCategory(next)
    setPlace(null)
  }, [])

  const openPlaceBy = useCallback(
    (next: MapLocation) => {
      if (next.id === YOU_ID) onLocateMe?.()
      else setPlace(next)
    },
    [onLocateMe],
  )

  const showPlace = useCallback((next: MapLocation) => {
    setCategory(MAP_CATEGORIES.find((c) => c.id === next.category) ?? null)
    setPlace(next)
  }, [])

  const backToCategories = useCallback(() => {
    setCategory(null)
    setPlace(null)
  }, [])

  const backToPlaces = useCallback(() => setPlace(null), [])

  return {
    categories,
    openCategory,
    openPlace,
    places,
    query,
    setQuery,
    results,
    openCategoryBy,
    openPlaceBy,
    showPlace,
    backToCategories,
    backToPlaces,
  }
}
