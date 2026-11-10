import type { FeatureCollection, Polygon } from "geojson"

export interface MapLocation {
  id: string
  category: string
  name: string
  lat: number
  lng: number
  description?: string
  image?: string
  detailImage?: string
  about?: string
}

export const MAP_PLACEHOLDER_IMAGE = "/images/map-placeholder.png"

export const MAP_PLACEHOLDER_DETAIL_IMAGE = "/images/map-placeholder2.png"

export const MAP_PLACEHOLDER_ABOUT =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud " +
  "exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure " +
  "dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. " +
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt " +
  "mollit anim id est laborum."

export const MAP_LOCATIONS: MapLocation[] = [
  { id: "fnb-1", category: "fnb", name: "Ayam Goreng", lat: -6.891, lng: 107.611, description: "Depan Aula Barat" },
  { id: "fnb-2", category: "fnb", name: "Martabak", lat: -6.8912, lng: 107.6115, description: "Depan Aula Barat" },
  { id: "fnb-3", category: "fnb", name: "Ayam Penyet Cabe Ijo", lat: -6.8914, lng: 107.6108, description: "Depan Aula Barat" },
  { id: "fnb-4", category: "fnb", name: "Seblak", lat: -6.8916, lng: 107.6102, description: "Depan Aula Barat" },
  { id: "mp-1", category: "megaprop", name: "Instalasi Robot Raksasa", lat: -6.8925, lng: 107.61, description: "Depan Aula Barat" },
  { id: "booth-1", category: "booth", name: "Booth Nusantara Teknologi", lat: -6.8918, lng: 107.6118, description: "Depan Aula Barat" },
  { id: "pb-1", category: "booth", name: "Photobooth Utama", lat: -6.8905, lng: 107.6105, description: "Depan Aula Barat" },
  { id: "parkir-1", category: "parkir", name: "Parkir Timur", lat: -6.8895, lng: 107.612, description: "Depan Aula Barat" },
  { id: "toilet-1", category: "toilet", name: "Toilet CC Barat", lat: -6.8918, lng: 107.6104, description: "Depan Aula Barat" },
]

export const MAP_INITIAL_VIEW = {
  longitude: 107.6106,
  latitude: -6.8915,
  zoom: 16.5,
}

export const MAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"

export const MAP_AREAS: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Main Stage Area" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [107.6095, -6.8925],
            [107.6105, -6.8925],
            [107.6105, -6.891],
            [107.6095, -6.891],
            [107.6095, -6.8925],
          ],
        ],
      },
    },
  ],
}

export function locationsByCategory(categoryId: string): MapLocation[] {
  return MAP_LOCATIONS.filter((l) => l.category === categoryId)
}
