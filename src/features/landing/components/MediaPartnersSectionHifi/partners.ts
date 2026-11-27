// Media partners shown in the landing marquee. Shared with /admin (Sponsor Performance), so the
// analytics id below is the one the dashboard joins clicks on: keep it stable.

// Card width per size tier (the M/L/XL hint in each filename under public/media-partner).
export const TIER_WIDTH = { M: 200, L: 220, XL: 260 } as const

export type Tier = keyof typeof TIER_WIDTH

export type MediaPartner = {
  /** File name inside public/media-partner */
  file: string
  alt: string
  tier: Tier
  /** Instagram handle without the "@". `null` = not linked yet (card is not clickable). */
  instagram: string | null
}

export const MEDIA_PARTNERS: MediaPartner[] = [
  { file: "01. M_AIESEC in Bandung.png", alt: "AIESEC in Bandung", tier: "M", instagram: "aiesecbandung" },
  { file: "tecitb-logo.jpg", alt: "TEC ITB", tier: "M", instagram: "tec.itb" },
  { file: "03. M_SRE ITB.png", alt: "SRE ITB", tier: "M", instagram: "sreitb" },
  { file: "04. XL_Acara Bandung.png", alt: "Acara Bandung", tier: "XL", instagram: "acrbandung" },
  { file: "05. L_Young on Top Bandung.png", alt: "Young on Top Bandung", tier: "L", instagram: "yotbdg" },
  { file: "06. M_Para Pencari Event Bandung.png", alt: "Para Pencari Event Bandung", tier: "M", instagram: "papebandung" },
  { file: "07. M_ITB Receh.png", alt: "ITB Receh", tier: "M", instagram: "itb.receh" },
  { file: "08. M_ShARE ITB.png", alt: "ShARE ITB", tier: "M", instagram: "share_itb" },
  { file: "09. L_TSA ITB.jpg", alt: "TSA ITB", tier: "L", instagram: "tsaitb" },
  { file: "10. M_StudentsXCEOs International Summit.png", alt: "StudentsXCEOs International Summit", tier: "M", instagram: "studentsxceosbdg" },
  { file: "11. M_Strativate.png", alt: "Strativate", tier: "M", instagram: "strativate.id" },
]

/** The useImpression sectionId of the marquee: one impression covers every logo in it. */
export const MEDIA_PARTNERS_SECTION_ID = "media-partners"

/** Stable analytics id per partner: "Young on Top Bandung" → "young-on-top-bandung". */
export const sponsorId = (partner: MediaPartner) =>
  partner.alt.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
