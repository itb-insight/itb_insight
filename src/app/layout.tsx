import { Gabarito, Orbitron } from "next/font/google"
import AnalyticsRoot from "@/lib/analytics/components/AnalyticsRoot"
import "./globals.css"

const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-primary",
})

/* Cadangan untuk EXCRATCH, font display di halaman detail kompetisi.
   Dipakai hanya kalau /fonts/excratch.woff2 gagal dimuat. Sama-sama
   squarish-techno dan punya bobot Bold. Lihat --font-display di globals.css. */
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-orbitron",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${gabarito.variable} ${orbitron.variable}`}>
      <body>
        <AnalyticsRoot />
        {children}
      </body>
    </html>
  )
}