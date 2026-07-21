"use client"

import dynamic from "next/dynamic"

/**
 * Loads the cube only in the browser.
 *
 * three is roughly 600KB and DroneCube touches document and WebGL on mount, so
 * it must not be part of the server render or the initial bundle. The
 * placeholder reserves the same box to avoid a layout shift when it swaps in.
 */
const DroneCube = dynamic(() => import("./DroneCube"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        maxWidth: 360,
        aspectRatio: "4 / 3",
      }}
    />
  ),
})

interface DroneMountProps {
  componentId?: string
  label?: string
}

export default function DroneMount({ componentId, label }: DroneMountProps) {
  return <DroneCube componentId={componentId} label={label} />
}
