/*
  Link proofs for Insight Arcade social quests (sidequests.proof_kind = 'link', migration 0035):
  the story / Add Yours quests take a link to the story, post or video itself. Shared by the form
  (instant feedback) and POST /api/arcade/proof (the real check).
  Only Instagram, TikTok and X links are accepted (the platforms in src/shared/constants/social.ts).
  The query string and hash are dropped (share links carry tracking ids such as ?igsh=).
  The follow quests are photo quests (screenshot + username), not link quests.
*/

export type LinkPlatform = "instagram" | "tiktok" | "x"
export type ProofLink = { url: string; platform: LinkPlatform }
export type ProofLinkResult = { ok: true; link: ProofLink } | { ok: false; message: string }

export const PROOF_LINK_MAX = 300

const HOSTS: Record<string, LinkPlatform> = {
  "instagram.com": "instagram",
  "www.instagram.com": "instagram",
  "m.instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "www.tiktok.com": "tiktok",
  "m.tiktok.com": "tiktok",
  "vm.tiktok.com": "tiktok",
  "vt.tiktok.com": "tiktok",
  "x.com": "x",
  "www.x.com": "x",
  "mobile.x.com": "x",
  "twitter.com": "x",
  "www.twitter.com": "x",
  "mobile.twitter.com": "x",
}

const IG_HANDLE = /^[A-Za-z0-9._]{1,30}$/

function parse(raw: string): { url: URL; platform: LinkPlatform; segments: string[] } | null {
  let text = raw.trim()
  if (!text || text.length > PROOF_LINK_MAX) return null
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `https://${text}`
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (url.username || url.password || url.port) return null
  const platform = HOSTS[url.hostname.toLowerCase()]
  if (!platform) return null
  const segments = url.pathname.split("/").filter(Boolean)
  return { url, platform, segments }
}

function normalized(url: URL, segments: string[]): string {
  return `https://${url.hostname.toLowerCase()}/${segments.join("/")}`
}

function isContent(platform: LinkPlatform, host: string, segments: string[]): boolean {
  const [a, b, c] = segments
  if (platform === "instagram") {
    if (a === "stories") return segments.length >= 3 && IG_HANDLE.test(b ?? "")
    return ["p", "reel", "reels", "s", "tv"].includes(a ?? "") && segments.length >= 2
  }
  if (platform === "tiktok") {
    if (host.startsWith("vm.") || host.startsWith("vt.")) return segments.length >= 1
    if (a === "t") return segments.length >= 2
    return Boolean(a?.startsWith("@")) && (b === "video" || b === "photo") && Boolean(c)
  }
  return segments.length >= 3 && b === "status" && /^\d+$/.test(c ?? "")
}

/** Checks a link proof: an Instagram / TikTok / X story, post or video link. */
export function parseProofLink(raw: string): ProofLinkResult {
  const parsed = parse(raw)
  if (!parsed) return { ok: false, message: "Link harus dari Instagram, TikTok, atau X (pakai tombol Share → Copy link)." }
  const { url, platform, segments } = parsed
  if (!isContent(platform, url.hostname.toLowerCase(), segments)) {
    return { ok: false, message: "Kirim link ke story, postingan, atau video-nya (pakai tombol Share → Copy link), bukan link profil." }
  }
  return { ok: true, link: { url: normalized(url, segments), platform } }
}
