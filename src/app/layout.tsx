import { Gabarito } from "next/font/google"
import AnalyticsRoot from "@/lib/analytics/components/AnalyticsRoot"
import PublicFooter from "@/shared/components/Footer/PublicFooter"
import "./globals.css"

const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-primary",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={gabarito.variable}>
      <body>
        <AnalyticsRoot />
        {children}
        <PublicFooter />
      </body>
    </html>
  )
}
