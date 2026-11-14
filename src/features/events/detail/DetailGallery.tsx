import Image from "next/image";
import type { EventImage } from "@/features/events/types";
import styles from "@/features/events/detail/EventDetail.module.css";

/**
 * Galeri mosaik: foto pertama besar, sisanya mengisi grid 6 kolom. Tata
 * letaknya disetel untuk 5 atau 6 foto (lihat .gallery di CSS).
 */
export default function DetailGallery({ images }: { images: EventImage[] }) {
  const five = images.length === 5;
  return (
    <section aria-labelledby="galeri-title" className={styles.section}>
      <h2 id="galeri-title" className={`${styles.sectionTitle} ${styles.iceText}`}>
        Gallery
      </h2>
      <div className={`${styles.gallery} ${five ? styles.galleryFive : ""}`}>
        {images.map((img, i) => (
          <figure key={img.src} className={styles.galleryItem}>
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={i === 0 ? "(max-width: 760px) 100vw, 780px" : "(max-width: 760px) 50vw, 400px"}
              style={{ objectFit: "cover", objectPosition: img.position ?? "50% 50%" }}
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
