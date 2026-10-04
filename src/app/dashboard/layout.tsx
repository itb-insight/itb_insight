import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi";
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi";
import DashboardSidebar from "@/features/dashboard/DashboardSidebar";

const BG_IMAGE = "/images/dashboard-bg.png"

// Shared side-bar, and custom header element on mobile
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <NavbarHifi />

      <div className="max-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-16 pt-24 md:flex-row">
        <DashboardSidebar />
              <main className="flex-1">{children}</main>
      </div>



      <img 
        src={BG_IMAGE}
        alt= ""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
      />

      <FooterHifi />
    </div>
  )
}
