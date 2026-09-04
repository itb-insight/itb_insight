import type { Metadata } from "next"
import { Gabarito } from "next/font/google"
import "./globals.css"

const gabarito = Gabarito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-primary",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const description =
  "Insight ITB merupakan event teknologi terbesar di ITB, terdiri dari beberapa rangkaian acara seperti pameran, seminar, dan kompetisi."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ITB Insight",
    template: "%s | ITB Insight",
  },
  description,
  keywords: ["ITB Insight", "event teknologi ITB", "pameran", "seminar", "kompetisi", "ITB"],
  openGraph: {
    title: "ITB Insight",
    description,
    url: "/",
    siteName: "ITB Insight",
    images: [{ url: "/images/logoinsight-hifi.png", width: 744, height: 731 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ITB Insight",
    description,
    images: ["/images/logoinsight-hifi.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={gabarito.variable}>
      <body>
        <div style={{ position: "relative", minHeight: "100vh" }}>
          {children}
        </div>
      </body>
    </html>
  )
}