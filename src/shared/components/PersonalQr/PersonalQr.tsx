"use client"

import { QRCodeSVG } from "qrcode.react"

import { encodeVisitorQr } from "@/lib/qr"

type PersonalQrProps = {
  /** The visitor's `visitor_tickets.qr_code` token (not the profile uuid). */
  token: string
  /** Intrinsic SVG size in px; the SVG scales to its container via `className`. */
  size?: number
  className?: string
}

// Logo covers ~22% of the width. Level "H" recovers up to 30% damage, and `excavate`
// clears the modules behind the logo, so the code still scans reliably.
const LOGO_RATIO = 0.22

// Rendered entirely in the browser: no server or third-party QR API ever sees the token.
export default function PersonalQr({ token, size = 256, className }: PersonalQrProps) {
  const logo = Math.round(size * LOGO_RATIO)

  return (
    <QRCodeSVG
      value={encodeVisitorQr(token)}
      size={size}
      level="H"
      marginSize={2}
      fgColor="#08090f"
      bgColor="#ffffff"
      className={className}
      role="img"
      aria-label="QR profil pribadi"
      imageSettings={{
        src: "/images/qr-logo.png",
        width: logo,
        height: logo,
        excavate: true,
      }}
    />
  )
}
