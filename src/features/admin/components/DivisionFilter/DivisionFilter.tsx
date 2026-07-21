"use client"

import { useEffect, useState } from "react"
import { DIVISIONS, DIVISION_ORDER, type DivisionTag } from "@/lib/analytics/divisions"
import styles from "./DivisionFilter.module.css"

/**
 * Scopes the whole dashboard to one division.
 *
 * Sits in one row above every panel it affects — never per-panel, never inside
 * a card, so there is no ambiguity about what a filter applies to.
 *
 * Panels are matched by their data-divisions attribute rather than by React
 * state, which keeps every panel a server component. Dimming alone would drop
 * non-matching panels below readable contrast, so dimmed panels are also
 * marked `inert` (removing them from tab order and the a11y tree) and the
 * active filter is named in a visible chip.
 */
export default function DivisionFilter() {
  const [active, setActive] = useState<DivisionTag | "all">("all")

  useEffect(() => {
    const panels = document.querySelectorAll<HTMLElement>("[data-divisions]")

    for (const panel of panels) {
      const tags = (panel.dataset.divisions ?? "").split(" ").filter(Boolean)
      // A panel with no tags reports on everything and never dims.
      const matches = active === "all" || tags.length === 0 || tags.includes(active)

      panel.style.opacity = matches ? "1" : "0.35"
      panel.inert = !matches
    }
  }, [active])

  return (
    <div className={styles.row}>
      <span className={styles.legend} id="division-filter-label">
        Division
      </span>

      <div className={styles.tabs} role="group" aria-labelledby="division-filter-label">
        <button
          type="button"
          className={`${styles.tab} ${active === "all" ? styles.active : ""}`}
          onClick={() => setActive("all")}
          aria-pressed={active === "all"}
        >
          ALL
        </button>

        {DIVISION_ORDER.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`${styles.tab} ${active === tag ? styles.active : ""}`}
            onClick={() => setActive(tag)}
            aria-pressed={active === tag}
            title={DIVISIONS[tag]}
          >
            {tag}
          </button>
        ))}
      </div>

      {active !== "all" && (
        <span className={styles.chip}>Filtered: {DIVISIONS[active]}</span>
      )}
    </div>
  )
}
