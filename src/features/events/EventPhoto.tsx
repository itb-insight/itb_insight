import Image from "next/image";
import type { EventItem } from "@/features/events/types";
import { u } from "@/features/events/scale";

/**
 * Foto kegiatan. Figma: 655x480, radius 25, scaleMode FILL (dipotong untuk
 * menutupi kotak, rasio terjaga), drop shadow #dee8fb radius 10 tanpa offset
 * — tampil sebagai pendar terang di sekeliling foto.
 *
 * next/image dipakai supaya browser menerima versi WebP/AVIF yang sudah
 * diperkecil sesuai lebar layar. `sizes` ~38vw = 655/1728 lebar frame.
 */
export default function EventPhoto({ event }: { event: EventItem }) {
  const p = event.photoBox;

  return (
    <div
      style={{
        position: "absolute",
        left: u(p.x),
        top: u(p.y),
        width: u(p.w),
        height: u(p.h),
        borderRadius: u(25),
        overflow: "hidden",
        boxShadow: `0 0 ${u(10)} #dee8fb`,
      }}
    >
      <Image
        src="/events/event-photo.jpg"
        alt={`Dokumentasi kegiatan ${event.title.replace(/\n/g, " ")}`}
        fill
        sizes="38vw"
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
