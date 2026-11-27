/*
  Official ITB INSIGHT social accounts: the one source for the footers (FooterHifi, Footer) and the
  Insight Arcade social quests (src/lib/proof-link.ts, migration 0035). Changing a handle here
  needs a migration that updates sidequests too; src/lib/proof-link.test.ts checks they agree.
*/

export type SocialKey = "instagram" | "x" | "tiktok" | "youtube"

export const SOCIAL: Record<SocialKey, { label: string; handle: string; url: string }> = {
  instagram: { label: "Instagram", handle: "itbinsight", url: "https://www.instagram.com/itbinsight/" },
  x: { label: "X", handle: "itbinsight", url: "https://x.com/itbinsight" },
  tiktok: { label: "TikTok", handle: "itb_insight", url: "https://www.tiktok.com/@itb_insight" },
  youtube: { label: "Youtube", handle: "insightitb", url: "https://youtube.com/@insightitb" },
}
