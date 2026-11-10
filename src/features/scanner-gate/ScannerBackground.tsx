import Image from "next/image"

import styles from "./ScannerBackground.module.css"

const SHAPES = [
  { src: "/images/bg-home/deco2.svg", width: 700, height: 848, className: styles.deco2 },
  { src: "/images/bg-home/yellow-blob.svg", width: 1239, height: 1236, className: styles.yellowBlob },
  { src: "/images/bg-home/green-blob.svg", width: 990, height: 864, className: styles.greenBlob },
]

export default function ScannerBackground() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {SHAPES.map((shape) => (
        <Image
          key={shape.src}
          src={shape.src}
          alt=""
          width={shape.width}
          height={shape.height}
          loading="eager"
          className={`${styles.shape} ${shape.className}`}
        />
      ))}
    </div>
  )
}
