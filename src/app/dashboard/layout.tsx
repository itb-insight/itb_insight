import Navbar from "@/shared/components/Navbar/Navbar"

// Every dashboard route shares the landing header. The dashboard surfaces use a
// dark background and already reserve top padding (Dashboard.module.css .page),
// so the fixed navbar overlays cleanly without shifting content.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
