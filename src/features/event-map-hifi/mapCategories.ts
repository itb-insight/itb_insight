import type { ComponentType } from "react"

import {
  BoothIcon,
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
  pin: string
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
    id: "megaprop",
    label: "Megaprop",
    icon: MonumentIcon,
    pinColor: "#3D65B8",
    iconColor: "#FAFAFA",
    pin: "/map-pin/Pin Megaprop.svg",
  },
  { id: "fnb", label: "FnB", icon: FastfoodIcon, pinColor: "#FF6767", pin: "/map-pin/FnB.svg" },
  { id: "booth", label: "Booth", icon: BoothIcon, pinColor: "#A86BE1", pin: "/map-pin/Pin Booth.svg" },
  { id: "toilet", label: "Toilet", icon: ToiletIcon, pinColor: "#33AAFF", pin: "/map-pin/Toilet.svg" },
  { id: "mushola", label: "Mushola", icon: MosqueIcon, pinColor: "#4AB136", pin: "/map-pin/Mushola.svg" },
  { id: "parkir", label: "Parkir", icon: ParkingIcon, pinColor: "#0095FF", pin: "/map-pin/Parkir.svg" },
]

export const MAP_TABS = ["All", "Competition", "Exhibition"] as const

export type MapTab = (typeof MAP_TABS)[number]

export function pinForCategory(categoryId: string): string {
  return MAP_CATEGORIES.find((c) => c.id === categoryId)?.pin ?? MAP_CATEGORIES[0].pin
}
