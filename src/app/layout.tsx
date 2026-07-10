import { Gabarito } from "next/font/google"
import "./globals.css"

const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-primary",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={gabarito.variable}>
      <body>{children}</body>
    </html>
  )
}