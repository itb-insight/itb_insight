import type { MetadataRoute } from "next"
import { getEventDetailSlugs } from "@/features/events/details"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

const routes = ["", "/event", "/event-map", "/login", "/register", "/signup"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const eventRoutes = (await getEventDetailSlugs()).map((slug) => `/event/${slug}`)
  return [...routes, ...eventRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }))
}
