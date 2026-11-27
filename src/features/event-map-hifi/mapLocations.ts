import { VENUE_LAYOUT, type Anchor } from "./venueLayout"

/*
  Places in the sidebar and on the map. Positions come from the venue layout (venue-layout.json);
  this file adds names, categories and copy.

  - Event/competition zones: listed when their layout id (the slugged zone name) is in
    ZONE_CONTENT. Copy is condensed from src/features/events/ and src/features/competition/.
  - Parking and toilets: one entry per drawn polygon, described by the nearest listed zone.
  - Exits and entry gates: one entry each, described by which side of the event area they are
    on and any landmark right next to them.
*/

export type Vehicle = "motorcycle" | "car"

export const VEHICLE_LABELS: Record<Vehicle, string> = { motorcycle: "Motor", car: "Mobil" }

export interface MapLink {
  label: string
  href: string
}

export interface MapLocation {
  id: string
  category: string
  name: string
  lat: number
  lng: number
  /** One short line under the name. */
  description?: string
  image?: string
  detailImage?: string
  /** Short summary for the detail view. */
  about?: string
  /** Buttons in the detail view (event / competition pages). */
  links?: MapLink[]
  /** Special guest parking: drawn with a star on its pin. */
  starred?: boolean
  /** Parking: vehicles allowed, shown as icons after the name. */
  vehicles?: Vehicle[]
}

interface ZoneContent {
  category: string
  name?: string
  description: string
  about: string
  links?: MapLink[]
  image?: string
}

const ZONE_CONTENT: Record<string, ZoneContent> = {
  stage: {
    category: "event",
    description: "Insight on Stage",
    about:
      "Panggung utama ITB INSIGHT 2026: penampilan band, bintang tamu spesial, serta projection mapping dan light show dari pagi sampai malam. Terbuka untuk umum dan gratis.",
    links: [{ label: "Insight on Stage", href: "/event/insight-on-stage" }],
    image: "/events/insight-on-stage/hero.webp",
  },
  exhibition: {
    category: "event",
    description: "Tech-Xhibition",
    about:
      "Pameran produk dan prototipe inovatif dari perusahaan, startup, komunitas, dan institusi pendidikan. Coba langsung lewat demonstrasi dan pengalaman interaktif bersama para exhibitor.",
    links: [{ label: "Tech-Xhibition", href: "/event/tech-xhibition" }],
    image: "/events/tech-xhibition/hero.webp",
  },
  "play-tech": {
    category: "event",
    description: "Play-Tech",
    about:
      "Permainan interaktif yang memadukan keseruan dengan prinsip sains dan teknologi. Ada 18 wahana, mulai dari Robo Sumo, Wave & Go!, sampai kolam fluida non-Newtonian.",
    links: [{ label: "Play-Tech", href: "/event/playtech-showtech#playtech" }],
    image: "/events/playtech-showtech/hero.webp",
  },
  "seminar-showtech": {
    category: "event",
    description: "Technology Seminar & Show-Tech",
    about:
      "Technology Seminar: forum diskusi akademisi, industri, dan generasi muda tentang perkembangan teknologi dan masa depan dunia kerja (100 peserta per sesi). Show-Tech: instalasi teknologi yang artistik, dari Infinity Mirror, Piano Stairs, sampai Chroma Tunnel.",
    links: [
      { label: "Technology Seminar", href: "/event/technology-seminar" },
      { label: "Show-Tech", href: "/event/playtech-showtech#showtech" },
    ],
    image: "/events/technology-seminar/hero.webp",
  },
  "drone-soccer": {
    category: "event",
    description: "Drone Soccer Competition",
    about:
      "Kompetisi drone nasional bagi remaja dan dewasa. Hari pertama babak penyisihan, hari kedua babak eliminasi hingga terpilih juara 1, 2, dan 3.",
    links: [{ label: "Drone Soccer Competition", href: "/competition/microdrone-obstacle-race" }],
  },
  "olympiad-bpc": {
    category: "event",
    description: "Olimpiade Engineering & Business Plan Competition",
    about:
      "Olimpiade Engineering: kompetisi berbasis olimpiade bagi siswa SMA/SMK/MA sederajat untuk mengenal dunia engineering. Business Plan Competition: kompetisi inovasi bisnis nasional bertema Artificial Intelligence, dari BMC dan proposal hingga final pitching.",
    links: [
      { label: "Olimpiade Engineering", href: "/competition/olimpiade-engineering" },
      { label: "Business Plan Competition", href: "/competition/business-plan-competition" },
    ],
  },
  "food-and-beverages": {
    category: "fnb",
    description: "Area makanan & minuman",
    about: "Pusat jajanan dan minuman untuk pengunjung ITB INSIGHT 2026.",
  },
}

const anchors = VENUE_LAYOUT.anchors
const listedZones = anchors.filter((a) => a.kind === "zone" && a.id in ZONE_CONTENT)

/** Name of the listed zone closest to `point`, for "dekat …" descriptions. */
function nearestZoneName(point: Anchor): string | null {
  const k = Math.cos((point.lat * Math.PI) / 180)
  let best: Anchor | null = null
  let bestDistance = Infinity
  for (const zone of listedZones) {
    const d = Math.hypot((zone.lng - point.lng) * k, zone.lat - point.lat)
    if (d < bestDistance) {
      bestDistance = d
      best = zone
    }
  }
  return best ? (ZONE_CONTENT[best.id].name ?? best.name) : null
}

const near = (anchor: Anchor) => {
  const zone = nearestZoneName(anchor)
  return zone ? `dekat ${zone}` : ""
}

const join = (...parts: string[]) => parts.filter(Boolean).join(" · ")

const capitalize = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text)

/**
 * "Parkir Seni Rupa (motorcycles and car)" -> name "Parkir Seni Rupa", vehicles [motorcycle, car].
 * The vehicle words move out of the title into icons.
 */
export function parseParkingName(raw: string): { name: string; vehicles: Vehicle[] } {
  const vehicles: Vehicle[] = []
  if (/motor/i.test(raw)) vehicles.push("motorcycle")
  if (/\b(cars?|mobil)\b/i.test(raw)) vehicles.push("car")
  const name = raw.split(/\s+[-–(]/)[0].trim()
  return { name: name || raw, vehicles }
}

// ---- exits and gates ----

const eventArea = VENUE_LAYOUT.eventArea?.geometry.coordinates[0] ?? []
const eventCentre = eventArea.length
  ? {
      lng: (Math.min(...eventArea.map((p) => p[0])) + Math.max(...eventArea.map((p) => p[0]))) / 2,
      lat: (Math.min(...eventArea.map((p) => p[1])) + Math.max(...eventArea.map((p) => p[1]))) / 2,
    }
  : null

const COMPASS = ["timur", "timur laut", "utara", "barat laut", "barat", "barat daya", "selatan", "tenggara"]

/** "sisi utara": which side of the event area a point is on. */
function side(point: Anchor): string {
  if (!eventCentre) return ""
  const k = Math.cos((point.lat * Math.PI) / 180)
  const angle = (Math.atan2(point.lat - eventCentre.lat, (point.lng - eventCentre.lng) * k) * 180) / Math.PI
  return `sisi ${COMPASS[(Math.round(angle / 45) + 8) % 8]}`
}

const landmarks = VENUE_LAYOUT.labels.features.filter((f) => f.properties.kind === "landmark")
const NEAR_LANDMARK_M = 80
const METRES_PER_DEGREE = 111_320

/** "dekat Tunnel" when a landmark is within NEAR_LANDMARK_M metres. */
function nearLandmark(point: Anchor): string {
  const k = Math.cos((point.lat * Math.PI) / 180)
  let best = ""
  let bestDistance = NEAR_LANDMARK_M
  for (const landmark of landmarks) {
    const [lng, lat] = landmark.geometry.coordinates
    const d = Math.hypot((lng - point.lng) * k, lat - point.lat) * METRES_PER_DEGREE
    if (d < bestDistance) {
      bestDistance = d
      best = `dekat ${landmark.properties.label}`
    }
  }
  return best
}

function buildLocations(): MapLocation[] {
  const locations: MapLocation[] = []
  let guestNo = 0
  let toiletNo = 0
  let exitNo = 0
  const toiletCount = anchors.filter((a) => a.kind === "toilet").length
  const exitCount = anchors.filter((a) => a.kind === "exit").length

  for (const anchor of anchors) {
    const base = { id: anchor.id, lat: anchor.lat, lng: anchor.lng }

    if (anchor.kind === "zone") {
      const content = ZONE_CONTENT[anchor.id]
      if (!content || anchor.sterile) continue // sterile zones (crew only) are never listed
      locations.push({
        ...base,
        category: content.category,
        name: content.name ?? anchor.name,
        description: content.description,
        about: content.about,
        links: content.links,
        image: content.image,
        detailImage: content.image,
      })
    } else if (anchor.kind === "parking-guest") {
      guestNo += 1
      locations.push({
        ...base,
        category: "parkir",
        name: `Parkir Tamu Khusus ${guestNo}`,
        description: join("Khusus tamu undangan", near(anchor)),
        about: "Parkir khusus tamu undangan (special guest).",
        starred: true,
      })
    } else if (anchor.kind === "parking-public") {
      const { name, vehicles } = parseParkingName(anchor.name)
      const allowed = vehicles.map((v) => VEHICLE_LABELS[v].toLowerCase()).join(" dan ")
      locations.push({
        ...base,
        category: "parkir",
        name,
        description: join("Parkir umum", near(anchor)),
        about: allowed ? `Parkir umum untuk ${allowed}.` : "Parkir umum untuk pengunjung.",
        vehicles,
      })
    } else if (anchor.kind === "gate") {
      locations.push({
        ...base,
        category: "gate",
        name: anchor.name,
        description: capitalize(join("Pintu masuk", side(anchor), nearLandmark(anchor))),
      })
    } else if (anchor.kind === "exit") {
      exitNo += 1
      locations.push({
        ...base,
        category: "gate",
        name: exitCount > 1 ? `Exit ${exitNo}` : "Exit",
        description: capitalize(join("Pintu keluar", side(anchor), nearLandmark(anchor))),
      })
    } else if (anchor.kind === "toilet") {
      toiletNo += 1
      const where = near(anchor)
      locations.push({
        ...base,
        category: "toilet",
        name: toiletCount > 1 ? `Toilet ${toiletNo}` : "Toilet",
        description: where ? where[0].toUpperCase() + where.slice(1) : undefined,
      })
    }
  }
  return locations
}

export const MAP_LOCATIONS: MapLocation[] = buildLocations()

export const MAP_INITIAL_VIEW = {
  longitude: 107.61,
  latitude: -6.8905,
  zoom: 16.5,
}

export const MAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"

export function locationsByCategory(categoryId: string): MapLocation[] {
  return MAP_LOCATIONS.filter((l) => l.category === categoryId)
}
