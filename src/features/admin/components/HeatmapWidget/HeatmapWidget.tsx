"use client"

import { useRef, useState } from "react"
import Map, { Layer, Popup, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre"
import type { FeatureCollection, Point } from "geojson"
import "maplibre-gl/dist/maplibre-gl.css"
import RangeTabs from "@/features/admin/components/RangeTabs/RangeTabs"
import WidgetCard from "@/features/admin/components/WidgetCard/WidgetCard"
import type { HeatPoint } from "@/features/admin/data/dday"
import { MAP_INITIAL_VIEW } from "@/features/event-map-hifi/mapLocations"
import type { RangeKey } from "@/features/admin/data/timeRange"
import styles from "./HeatmapWidget.module.css"

interface HeatmapWidgetProps {
  title?: string
  description?: string
  points: HeatPoint[]
  range: RangeKey
  onRangeChange: (range: RangeKey) => void
  /** satuan di tooltip, default "scan" */
  unit?: string
  height?: number
  /** default: posisi awal yang sama dengan peta publik /event-map */
  initialView?: { longitude: number; latitude: number; zoom: number }
}

/**
 * Basemap gelap seperti mock Figma. Provider sama dengan /event-map (CARTO), hanya
 * varian "dark-matter" alih-alih "positron" supaya heat-nya kontras.
 */
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

/** Gradasi heat sama dengan legend Figma: biru (sepi) → kuning → merah (ramai). */
const HEAT_COLORS = {
  low: "#33aaff",
  mid: "#fff341",
  high: "#ff6767",
}

type HoverInfo = { lng: number; lat: number; name: string; value: number }

export default function HeatmapWidget({
  title = "Heat Map Keramaian",
  description = "Sebaran scan booth di area acara",
  points,
  range,
  onRangeChange,
  unit = "scan",
  height = 500,
  initialView = MAP_INITIAL_VIEW,
}: HeatmapWidgetProps) {
  const mapRef = useRef<MapRef>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  const max = Math.max(0, ...points.map((p) => p.value))
  const total = points.reduce((sum, p) => sum + p.value, 0)

  const data: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature",
      properties: { id: p.id, name: p.name, value: p.value, weight: max > 0 ? p.value / max : 0 },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  }

  const onMove = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0]
    if (!f || f.geometry.type !== "Point") {
      setHover(null)
      return
    }
    const [lng, lat] = f.geometry.coordinates
    setHover({ lng, lat, name: String(f.properties?.name), value: Number(f.properties?.value) })
  }

  return (
    <WidgetCard
      title={title}
      description={description}
      action={<RangeTabs value={range} onChange={onRangeChange} label={`Rentang waktu ${title}`} />}
    >
      <div
        className={styles.mapBox}
        style={{ height }}
        role="region"
        aria-label={`${title}: ${total.toLocaleString("id-ID")} ${unit} di ${points.filter((p) => p.value > 0).length} booth`}
      >
        <Map
          ref={mapRef}
          initialViewState={initialView}
          mapStyle={DARK_STYLE}
          // Scroll halaman dashboard tidak dibajak peta; zoom pakai tombol / pinch / dblclick.
          scrollZoom={false}
          dragRotate={false}
          attributionControl={{ compact: true }}
          interactiveLayerIds={["booth-hit"]}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          cursor={hover ? "pointer" : "grab"}
          style={{ width: "100%", height: "100%" }}
        >
          <Source id="booth-heat" type="geojson" data={data}>
            <Layer
              id="booth-heatmap"
              type="heatmap"
              paint={{
                "heatmap-weight": ["get", "weight"],
                "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 14, 1.2, 19, 2.4],
                "heatmap-radius": ["interpolate", ["exponential", 2], ["zoom"], 14, 20, 16, 70, 19, 320],
                "heatmap-opacity": 0.9,
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(51,170,255,0)",
                  0.12,
                  "rgba(51,170,255,0.45)",
                  0.4,
                  HEAT_COLORS.mid,
                  0.75,
                  "#ffb04a",
                  1,
                  HEAT_COLORS.high,
                ],
              }}
            />
            {/* Lingkaran transparan untuk hover tooltip per booth */}
            <Layer
              id="booth-hit"
              type="circle"
              paint={{ "circle-radius": 14, "circle-opacity": 0, "circle-stroke-opacity": 0 }}
            />
          </Source>

          {hover && (
            <Popup
              longitude={hover.lng}
              latitude={hover.lat}
              closeButton={false}
              closeOnClick={false}
              offset={14}
              className={styles.popup}
            >
              <p className={styles.popupName}>{hover.name}</p>
              <p className={styles.popupValue}>
                {hover.value.toLocaleString("id-ID")} {unit}
              </p>
            </Popup>
          )}
        </Map>

        {total === 0 && <p className={styles.empty}>Belum ada {unit} di rentang ini</p>}

        <div className={styles.legend} aria-hidden>
          <span className={styles.legendBar} />
          <span className={styles.legendText}>
            <span>Ramai</span>
            <span>Sepi</span>
          </span>
        </div>

        <div className={styles.stepper}>
          <button type="button" aria-label="Perbesar peta" onClick={() => mapRef.current?.zoomIn()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <button type="button" aria-label="Perkecil peta" onClick={() => mapRef.current?.zoomOut()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </WidgetCard>
  )
}
