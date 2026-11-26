"use client"

import type { RefObject } from "react"
import Image from "next/image"
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/maplibre"
import { Star } from "lucide-react"
import "maplibre-gl/dist/maplibre-gl.css"

import styles from "./MapCanvasHifi.module.css"
import { MAP_PIN, pinForCategory } from "./mapCategories"
import MapZoomStepper from "./MapZoomStepper"
import { MAP_INITIAL_VIEW, MAP_LOCATIONS, MAP_STYLE_URL, type MapLocation } from "./mapLocations"
import {
  EXIT_COLOR,
  PATH_CASING_COLOR,
  PATH_COLOR,
  STERILE_COLOR,
  VENUE_LAYOUT,
} from "./venueLayout"

interface MapCanvasHifiProps {
  mapRef: RefObject<MapRef | null>
  activeLocationId?: string | null
  onSelectLocation?: (location: MapLocation) => void
}

// Glyph stacks the Carto Positron style already serves (other stacks may 404).
const FONT_BOLD = ["Montserrat SemiBold", "Open Sans Bold", "Noto Sans Regular", "Noto Sans CJK JP Regular"]
const FONT_ITALIC = ["Montserrat SemiBold Italic", "Open Sans Italic", "Noto Sans Regular", "Noto Sans CJK JP Regular"]

/*
  TODO(special-guest role): guest parking is shown to everyone for now. It may later be visible
  only to users with a special-guest role. Hiding it in the client is cosmetic (the shapes ship
  in the bundle), so if the locations must stay private, serve the guest features from an API
  that checks the role server-side and drop them from venue-layout.json.
*/

export default function MapCanvasHifi({
  mapRef,
  activeLocationId = null,
  onSelectLocation,
}: MapCanvasHifiProps) {
  return (
    <div className={styles.canvas}>
      <Map
        ref={mapRef}
        initialViewState={MAP_INITIAL_VIEW}
        mapStyle={MAP_STYLE_URL}
        style={{ width: "100%", height: "100%" }}
      >
        <Source id="venue-zones" type="geojson" data={VENUE_LAYOUT.zones}>
          <Layer
            id="zone-fill"
            type="fill"
            paint={{
              "fill-color": ["to-color", ["get", "color"]],
              "fill-opacity": ["case", ["get", "sterile"], 0.12, ["==", ["get", "kind"], "zone"], 0.45, 0.35],
            }}
          />
          <Layer
            id="zone-outline"
            type="line"
            filter={["!", ["get", "sterile"]]}
            paint={{ "line-color": ["to-color", ["get", "color"]], "line-width": 1.5 }}
          />
          <Layer
            id="zone-outline-sterile"
            type="line"
            filter={["get", "sterile"]}
            paint={{ "line-color": STERILE_COLOR, "line-width": 2, "line-dasharray": [3, 2] }}
          />
        </Source>

        <Source id="venue-lines" type="geojson" data={VENUE_LAYOUT.lines}>
          <Layer
            id="path-casing"
            type="line"
            filter={["==", ["get", "kind"], "path"]}
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": PATH_CASING_COLOR,
              "line-width": ["interpolate", ["linear"], ["zoom"], 15, 4, 17, 8, 19, 15],
            }}
          />
          <Layer
            id="path-line"
            type="line"
            filter={["==", ["get", "kind"], "path"]}
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": PATH_COLOR,
              "line-width": ["interpolate", ["linear"], ["zoom"], 15, 2.5, 17, 6, 19, 12],
            }}
          />
          <Layer
            id="sterile-line"
            type="line"
            filter={["==", ["get", "kind"], "sterile"]}
            layout={{ "line-cap": "round" }}
            paint={{
              "line-color": STERILE_COLOR,
              "line-width": ["interpolate", ["linear"], ["zoom"], 15, 2, 17, 4, 19, 8],
              "line-dasharray": [1.5, 1],
            }}
          />
        </Source>

        {/* Later layers win label collisions, so zone names go last. */}
        <Source id="venue-labels" type="geojson" data={VENUE_LAYOUT.labels}>
          <Layer
            id="exit-dot"
            type="circle"
            filter={["==", ["get", "kind"], "exit"]}
            paint={{
              "circle-color": EXIT_COLOR,
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 15, 3, 18, 6],
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 1.5,
            }}
          />
          <Layer
            id="landmark-labels"
            type="symbol"
            filter={["==", ["get", "kind"], "landmark"]}
            layout={{
              "text-field": ["get", "label"],
              "text-font": FONT_ITALIC,
              "text-size": ["interpolate", ["linear"], ["zoom"], 16, 9, 18, 12, 19, 14],
              "text-max-width": 7,
            }}
            paint={{ "text-color": "#4B5563", "text-halo-color": "#FFFFFF", "text-halo-width": 1.5 }}
          />
          <Layer
            id="exit-labels"
            type="symbol"
            filter={["==", ["get", "kind"], "exit"]}
            layout={{
              "text-field": "EXIT",
              "text-font": FONT_BOLD,
              "text-size": ["interpolate", ["linear"], ["zoom"], 15, 9, 18, 12],
              "text-offset": [0, -1.1],
              "text-allow-overlap": true,
            }}
            paint={{ "text-color": EXIT_COLOR, "text-halo-color": "#FFFFFF", "text-halo-width": 1.5 }}
          />
          <Layer
            id="line-tags"
            type="symbol"
            filter={["in", ["get", "kind"], ["literal", ["path-tag", "sterile-tag"]]]}
            layout={{
              "text-field": ["get", "label"],
              "text-font": FONT_ITALIC,
              "text-size": ["interpolate", ["linear"], ["zoom"], 16, 9, 18, 11, 19, 13],
              "text-offset": [0, -1],
            }}
            paint={{
              "text-color": ["match", ["get", "kind"], "sterile-tag", STERILE_COLOR, "#713F12"],
              "text-halo-color": "#FFFFFF",
              "text-halo-width": 1.5,
            }}
          />
          <Layer
            id="zone-labels"
            type="symbol"
            filter={["==", ["get", "kind"], "zone"]}
            layout={{
              "text-field": [
                "format",
                ["get", "label"],
                {},
                ["case", ["==", ["get", "sublabel"], ""], "", "\n"],
                {},
                ["get", "sublabel"],
                { "font-scale": 0.75, "text-color": STERILE_COLOR },
              ],
              "text-font": FONT_BOLD,
              "text-size": ["interpolate", ["linear"], ["zoom"], 15, 10, 17, 13, 19, 18],
              "text-max-width": 8,
              // Hang the name just below the anchor so a pin on the same point (FnB, a focused
              // event) stands above it instead of covering it.
              "text-anchor": "top",
              "text-offset": [0, 0.3],
            }}
            paint={{ "text-color": "#111827", "text-halo-color": "#FFFFFF", "text-halo-width": 1.5 }}
          />
        </Source>

        {MAP_LOCATIONS.map((location) => {
          const active = activeLocationId === location.id
          const pin = pinForCategory(location.category)
          // Event zones have no pin of their own; they get the selected pin only while focused.
          if (!active && !pin) return null
          const src = active ? MAP_PIN.selected : pin!
          const w = active ? MAP_PIN.selectedWidth : MAP_PIN.width
          const h = active ? MAP_PIN.selectedHeight : MAP_PIN.height

          return (
            <Marker
              key={location.id}
              longitude={location.lng}
              latitude={location.lat}
              anchor="bottom"
              offset={[0, MAP_PIN.tipOffset]}
              style={{ zIndex: active ? 2 : 1 }}
            >
              <button
                type="button"
                className={styles.marker}
                aria-label={location.name}
                aria-pressed={active}
                onClick={() => onSelectLocation?.(location)}
              >
                {location.starred && <Star className={styles.markerStar} aria-hidden="true" />}
                <Image src={src} alt="" width={w} height={h} loading="eager" />
              </button>
            </Marker>
          )
        })}
      </Map>

      <MapZoomStepper mapRef={mapRef} />
    </div>
  )
}
