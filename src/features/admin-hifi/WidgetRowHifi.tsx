import type { CSSProperties, ReactNode } from "react"

import styles from "./WidgetRowHifi.module.css"

interface WidgetRowHifiProps {
  children: ReactNode
  /** grid-template-columns, misal "683fr 675fr". Default dua kolom sama lebar. */
  columns?: string
  /**
   * Penjajaran vertikal. Default center (begitu di Figma); stretch dipakai kalau tinggi kedua
   * widget jauh berbeda, mis. placeholder di samping Ring chart, supaya tidak mengambang.
   */
  align?: "center" | "stretch"
}

export default function WidgetRowHifi({ children, columns, align = "center" }: WidgetRowHifiProps) {
  const style = {
    ...(columns ? { "--columns": columns } : {}),
    ...(align === "stretch" ? { alignItems: "stretch" } : {}),
  } as CSSProperties

  return (
    <div className={styles.row} style={style}>
      {children}
    </div>
  )
}
