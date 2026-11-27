import type { CSSProperties, ReactNode } from "react"

import styles from "./WidgetRowHifi.module.css"

interface WidgetRowHifiProps {
  children: ReactNode
  /** grid-template-columns, misal "683fr 675fr". Default dua kolom sama lebar. */
  columns?: string
}

export default function WidgetRowHifi({ children, columns }: WidgetRowHifiProps) {
  const style = columns ? ({ "--columns": columns } as CSSProperties) : undefined

  return (
    <div className={styles.row} style={style}>
      {children}
    </div>
  )
}
