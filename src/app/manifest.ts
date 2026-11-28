import type { MetadataRoute } from "next"

// Web app manifest: makes the site installable (PWA). Offline behaviour: public/sw.js and
// docs/OFFLINE.md. Icons are generated from src/app/icon.png (public/icons/).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ITB Insight",
    short_name: "Insight",
    description: "ITB Insight: peta acara, Insight Arcade dan QR kamu, juga saat sinyal lemah.",
    lang: "id",
    start_url: "/arcade",
    scope: "/",
    display: "standalone",
    background_color: "#091b3f",
    theme_color: "#091b3f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "QR Kamu", url: "/arcade/qr", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Peta acara", url: "/event-map", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Scanner booth (panitia)", url: "/admin/booth", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
