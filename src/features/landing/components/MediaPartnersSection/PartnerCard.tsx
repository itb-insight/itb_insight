"use client"

import Image from "next/image"
import trackClick from "@/lib/analytics/trackClick"

interface PartnerCardProps {
  sponsorId: string
  tier: string
  src: string
  alt: string
  sizes: string
  className: string
  logoClassName: string
}

/**
 * Client leaf for sponsor click tracking. Kept deliberately small so
 * MediaPartnersSection stays a server component — only the click handler
 * needs to run on the client.
 */
export default function PartnerCard({
  sponsorId,
  tier,
  src,
  alt,
  sizes,
  className,
  logoClassName,
}: PartnerCardProps) {
  return (
    <div
      className={className}
      onClick={() => trackClick("sponsor_click", { sponsorId, tier })}
    >
      <Image src={src} alt={alt} fill sizes={sizes} className={logoClassName} />
    </div>
  )
}
