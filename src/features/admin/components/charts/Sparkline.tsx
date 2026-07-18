import styles from "./Sparkline.module.css"

interface SparklinePoint {
  day: string
  views: number
}

interface SparklineProps {
  points: SparklinePoint[]
  label: string
}

const WIDTH = 400
const HEIGHT = 110
const PAD = 8

/**
 * Single-series trend line. No fill, no gridlines — the shape is the message,
 * and an area fill in a neutral ramp reads as a second series.
 *
 * preserveAspectRatio is left at its default so the end-dot stays circular;
 * stretching an SVG with "none" would turn it into an ellipse.
 */
export default function Sparkline({ points, label }: SparklineProps) {
  if (points.length === 0) return null

  const values = points.map((p) => p.views)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1

  const coords = points.map((point, index) => {
    const x = PAD + (index / Math.max(1, points.length - 1)) * (WIDTH - PAD * 2)
    const y = PAD + (1 - (point.views - min) / span) * (HEIGHT - PAD * 2)
    return { x, y }
  })

  const path = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")
  const last = coords[coords.length - 1]
  const first = points[0]
  const latest = points[points.length - 1]

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${label}: ${first.views} on ${first.day} rising to ${latest.views} on ${latest.day}`}
      >
        <polyline
          points={path}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* End dot with a surface-coloured ring so it reads as a marker,
            not a kink in the line. */}
        <circle cx={last.x} cy={last.y} r="5" fill="var(--chart-1)" stroke="var(--color-bg-card)" strokeWidth="2" />
      </svg>

      <div className={styles.axis}>
        <span>{first.day}</span>
        <span>{latest.day}</span>
      </div>
    </div>
  )
}
