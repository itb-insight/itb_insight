"use client"

import { useCallback, useState } from "react"

import { MAP_CATEGORIES, type MapCategory } from "./mapCategories"
import { locationsByCategory, type MapLocation } from "./mapLocations"

export interface MapBrowse {
  openCategory: MapCategory | null
  openPlace: MapLocation | null
  places: MapLocation[]
  openCategoryBy: (category: MapCategory) => void
  openPlaceBy: (place: MapLocation) => void
  /** Open a place from outside the list (e.g. its pin on the map), with its category behind it. */
  showPlace: (place: MapLocation) => void
  backToCategories: () => void
  backToPlaces: () => void
}

/** `onOpenPlace` runs whenever a place is opened, e.g. to focus the map on it. */
export function useMapBrowse(onOpenPlace?: (place: MapLocation) => void): MapBrowse {
  const [openCategory, setOpenCategory] = useState<MapCategory | null>(null)
  const [openPlace, setOpenPlace] = useState<MapLocation | null>(null)

  const places = openCategory ? locationsByCategory(openCategory.id) : []

  const openCategoryBy = useCallback((category: MapCategory) => {
    setOpenCategory(category)
    setOpenPlace(null)
  }, [])

  const openPlaceBy = useCallback(
    (place: MapLocation) => {
      setOpenPlace(place)
      onOpenPlace?.(place)
    },
    [onOpenPlace],
  )

  const showPlace = useCallback(
    (place: MapLocation) => {
      setOpenCategory(MAP_CATEGORIES.find((c) => c.id === place.category) ?? null)
      openPlaceBy(place)
    },
    [openPlaceBy],
  )

  const backToCategories = useCallback(() => {
    setOpenCategory(null)
    setOpenPlace(null)
  }, [])

  const backToPlaces = useCallback(() => setOpenPlace(null), [])

  return {
    openCategory,
    openPlace,
    places,
    openCategoryBy,
    openPlaceBy,
    showPlace,
    backToCategories,
    backToPlaces,
  }
}
