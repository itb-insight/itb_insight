import EventMap from "@/features/event-map/EventMap";
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi";

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      {/* Shared hi-fi header overlays the full-screen map (fixed position). Solid
          backdrop keeps it legible over map tiles instead of a transparent overlay. */}
      <NavbarHifi isSolid />
      {/* Panggil komponen peta di sini */}
      <EventMap />
    </main>
  );
}