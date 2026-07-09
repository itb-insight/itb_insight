import EventMap from "@/features/event-map/EventMap";

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      {/* Panggil komponen peta di sini */}
      <EventMap />
    </main>
  );
}