import type { ComponentType } from "react"
import { Trophy } from "lucide-react"

import {
  BoothIcon,
  ExitIcon,
  FastfoodIcon,
  MonumentIcon,
  MosqueIcon,
  ParkingIcon,
  ToiletIcon,
} from "./CategoryIcons"

export interface MapCategory {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  pinColor: string
  iconColor?: string
  /** Map pin. Categories without one (event zones) are labelled on the map instead. */
  pin?: string
  /** Extra words the search matches for this category. */
  keywords?: string
}

export const MAP_PIN = {
  width: 44,
  height: 57,
  selectedWidth: 47,
  selectedHeight: 61,
  tipOffset: 8,
  selected: "/map-pin/Pinpoint selected.svg",
} as const

export const MAP_CATEGORIES: MapCategory[] = [
  {
    id: "event",
    label: "Event & Kompetisi",
    icon: Trophy,
    pinColor: "#7245F5",
    keywords: "event acara kompetisi competition lomba exhibition pameran",
  },
  {
    id: "gate",
    label: "Exits & Gates",
    icon: ExitIcon,
    pinColor: "#15803D",
    keywords: "exit gate gerbang pintu entrance entry", // "keluar"/"masuk" come from descriptions
  },
  {
    id: "megaprop",
    label: "Megaprop",
    icon: MonumentIcon,
    pinColor: "#3D65B8",
    iconColor: "#FAFAFA",
    pin: "/map-pin/Pin Megaprop.svg",
  },
  {
    id: "fnb",
    label: "Food & Beverages",
    icon: FastfoodIcon,
    pinColor: "#FF6767",
    pin: "/map-pin/FnB.svg",
    keywords: "fnb makan minum makanan minuman jajan kuliner food drink",
  },
  { id: "booth", label: "Booth", icon: BoothIcon, pinColor: "#A86BE1", pin: "/map-pin/Pin Booth.svg", keywords: "stand" },
  {
    id: "toilet",
    label: "Toilet",
    icon: ToiletIcon,
    pinColor: "#33AAFF",
    pin: "/map-pin/Toilet.svg",
    keywords: "wc kamar mandi restroom",
  },
  {
    id: "mushola",
    label: "Mushola",
    icon: MosqueIcon,
    pinColor: "#4AB136",
    pin: "/map-pin/Mushola.svg",
    keywords: "musholla masjid sholat shalat prayer",
  },
  {
    id: "parkir",
    label: "Parkir",
    icon: ParkingIcon,
    pinColor: "#0095FF",
    pin: "/map-pin/Parkir.svg",
    keywords: "parking", // vehicle words come from each spot's `vehicles`
  },
]

export function pinForCategory(categoryId: string): string | null {
  return MAP_CATEGORIES.find((c) => c.id === categoryId)?.pin ?? null
}
