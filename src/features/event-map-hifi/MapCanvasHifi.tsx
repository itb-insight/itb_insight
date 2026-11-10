"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/maplibre"
import "maplibre-gl/dist/maplibre-gl.css"

import styles from "./MapCanvasHifi.module.css"
import { MAP_PIN, pinForCategory } from "./mapCategories"
import MapZoomStepper from "./MapZoomStepper"
import {
  MAP_AREAS,
  MAP_INITIAL_VIEW,
  MAP_LOCATIONS,
  MAP_STYLE_URL,
  type MapLocation,
} from "./mapLocations"

interface MapCanvasHifiProps {
  activeLocationId?: string | null
  onSelectLocation?: (location: MapLocation) => void
}

export default function MapCanvasHifi({
  activeLocationId = null,
  onSelectLocation,
}: MapCanvasHifiProps) {
  const mapRef = useRef<MapRef>(null)
  const [clickedId, setClickedId] = useState<string | null>(null)
  const selectedId = activeLocationId ?? clickedId

  const handleMarkerClick = (location: MapLocation) => {
    setClickedId(location.id)
    mapRef.current?.flyTo({
      center: [location.lng, location.lat],
      zoom: 18.5,
      duration: 1500,
      essential: true,
    })
    onSelectLocation?.(location)
  }

  return (
    <div className={styles.canvas}>
      <Map
        ref={mapRef}
        initialViewState={MAP_INITIAL_VIEW}
        mapStyle={MAP_STYLE_URL}
        style={{ width: "100%", height: "100%" }}
      >
        <Source id="event-areas" type="geojson" data={MAP_AREAS}>
          <Layer id="area-fill" type="fill" paint={{ "fill-color": "#000000", "fill-opacity": 0.15 }} />
          <Layer
            id="area-outline"
            type="line"
            paint={{ "line-color": "#000000", "line-width": 1, "line-opacity": 0.3 }}
          />
          <Layer
            id="area-labels"
            type="symbol"
            layout={{ "text-field": ["get", "name"], "text-size": 14, "text-anchor": "center" }}
            paint={{ "text-color": "#000000" }}
          />
        </Source>

        {MAP_LOCATIONS.map((location) => {
          const active = selectedId === location.id
          const src = active ? MAP_PIN.selected : pinForCategory(location.category)
          const w = active ? MAP_PIN.selectedWidth : MAP_PIN.width
          const h = active ? MAP_PIN.selectedHeight : MAP_PIN.height

          return (
            <Marker
              key={location.id}
              longitude={location.lng}
              latitude={location.lat}
              anchor="bottom"
              offset={[0, MAP_PIN.tipOffset]}
            >
              <button
                type="button"
                className={styles.marker}
                aria-label={location.name}
                aria-pressed={active}
                style={{ zIndex: active ? 2 : 1 }}
                onClick={() => handleMarkerClick(location)}
              >
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
