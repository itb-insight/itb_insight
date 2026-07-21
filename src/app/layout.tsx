import { Gabarito } from "next/font/google"
import { Suspense } from "react"
import AnalyticsRoot from "@/lib/analytics/components/AnalyticsRoot"
import "./globals.css"
import AnalyticsProvider from "@/features/analytics/AnalyticsProvider"

const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-primary",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={gabarito.variable}>
      <body>
        <AnalyticsRoot />
        {children}
        {/* AnalyticsProvider uses usePathname(), which must sit under a Suspense boundary. */}
        <Suspense>
          <AnalyticsProvider />
        </Suspense>
      </body>
    </html>
  )
}