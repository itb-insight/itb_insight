import type { CSSProperties } from "react"

import styles from "./CategoryRow.module.css"
import { ChevronRightIcon } from "./CategoryIcons"
import type { MapCategory } from "./mapCategories"

interface CategoryRowProps {
  category: MapCategory
  onSelect: (category: MapCategory) => void
}

export default function CategoryRow({ category, onSelect }: CategoryRowProps) {
  const Icon = category.icon

  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => onSelect(category)}
      style={
        category.iconColor
          ? ({ "--row-icon-color": category.iconColor } as CSSProperties)
          : undefined
      }
    >
      <Icon className={styles.icon} />
      <span className={styles.label}>{category.label}</span>
      <ChevronRightIcon className={styles.chevron} />
    </button>
  )
}
