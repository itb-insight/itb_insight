import Image from "next/image"

import styles from "./PlaceLogos.module.css"

interface PlaceLogosProps {
  logos: string[]
  /** "card": the 120x84 slot in a place card. "detail": the full-width banner in the detail view. */
  variant: "card" | "detail"
  className?: string
}

/** Competition logos shown in place of a photo, side by side when a zone hosts several. */
export default function PlaceLogos({ logos, variant, className }: PlaceLogosProps) {
  const size = variant === "card" ? 64 : 160
  return (
    <span className={[styles.logos, styles[variant], className].filter(Boolean).join(" ")}>
      {logos.map((src) => (
        <Image
          key={src}
          src={src}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          loading="eager"
          className={styles.logo}
        />
      ))}
    </span>
  )
}
