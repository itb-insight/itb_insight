"use client"

import { useCallback, useState } from "react"

import type { MapCategory } from "./mapCategories"
import { locationsByCategory, type MapLocation } from "./mapLocations"

export interface MapBrowse {
  openCategory: MapCategory | null
  openPlace: MapLocation | null
  places: MapLocation[]
  openCategoryBy: (category: MapCategory) => void
  openPlaceBy: (place: MapLocation) => void
  backToCategories: () => void
  backToPlaces: () => void
}

export function useMapBrowse(): MapBrowse {
  const [openCategory, setOpenCategory] = useState<MapCategory | null>(null)
  const [openPlace, setOpenPlace] = useState<MapLocation | null>(null)

  const places = openCategory ? locationsByCategory(openCategory.id) : []

  const openCategoryBy = useCallback((category: MapCategory) => {
    setOpenCategory(category)
    setOpenPlace(null)
  }, [])

  const openPlaceBy = useCallback((place: MapLocation) => setOpenPlace(place), [])

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
    backToCategories,
    backToPlaces,
  }
}
