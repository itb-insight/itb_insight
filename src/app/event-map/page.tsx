import EventMap from "@/features/event-map/EventMap";
import Navbar from "@/shared/components/Navbar/Navbar";

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      {/* Shared landing header overlays the full-screen map (fixed position). Solid
          backdrop keeps it legible over map tiles instead of a transparent overlay. */}
      <Navbar isSolid />
      {/* Panggil komponen peta di sini */}
      <EventMap />
    </main>
  );
}