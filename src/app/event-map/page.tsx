import EventMapHifi from "@/features/event-map-hifi/EventMapHifi"

export const metadata = {
  title: "Event Map | ITB Insight",
  description: "Peta lokasi booth, panggung, dan fasilitas ITB Insight 2026.",
}

/*
  Versi hi-fi sekarang yang dipakai di route ini.

  Versi lo-fi-nya masih ada di src/features/event-map/ (MapLibre + sidebar putih)
  tapi sudah tidak punya route — disimpan sebagai rujukan, bukan dihapus.
*/
export default function EventMapPage() {
  return <EventMapHifi />
}
