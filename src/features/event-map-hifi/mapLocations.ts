import { VENUE_LAYOUT, type Anchor } from "./venueLayout"

/*
  Places in the sidebar and on the map. Positions come from the venue layout (venue-layout.json);
  this file adds names, categories and copy.

  - Event/competition zones: listed when their layout id (the slugged zone name) is in
    ZONE_CONTENT. Copy is condensed from src/features/events/ and src/features/competition/.
  - Parking and toilets: one entry per drawn polygon, described by the nearest listed zone.
*/

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

function buildLocations(): MapLocation[] {
  const locations: MapLocation[] = []
  let guestNo = 0
  let toiletNo = 0
  const toiletCount = anchors.filter((a) => a.kind === "toilet").length

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
      locations.push({
        ...base,
        category: "parkir",
        name: anchor.name,
        description: join("Parkir umum", near(anchor)),
        about: `Parkir umum untuk pengunjung: ${anchor.name}.`,
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
