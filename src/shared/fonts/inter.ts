import { Inter } from "next/font/google"

/**
 * Inter, self-hosted by next/font (no request to Google, no render-blocking @import).
 * Add `inter.variable` to a page's root element: that ships the @font-face, after which the
 * existing `font-family: 'Inter'` declarations resolve to it.
 */
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
})
