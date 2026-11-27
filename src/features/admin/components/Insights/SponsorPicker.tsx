"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

import styles from "./Insights.module.css"

interface Option {
  id: string
  name: string
}

interface SponsorPickerProps {
  sponsors: Option[]
  booths: Option[]
  sponsor: string
  booth: string | null
}

/**
 * Which sponsor (brand reach on the site) and which booth (QR scans) the sponsor page shows.
 * There is no sponsor-to-booth link in the database, so the admin picks both; the choice lives in
 * the URL (?sponsor=&booth=) so a view can be shared.
 */
export default function SponsorPicker({ sponsors, booths, sponsor, booth }: SponsorPickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const go = (key: "sponsor" | "booth", value: string) => {
    const next = new URLSearchParams({ sponsor, ...(booth ? { booth } : {}) })
    if (value) next.set(key, value)
    else next.delete(key)
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  return (
    <div className={styles.pickers} aria-busy={pending}>
      <label className={styles.picker}>
        <span className={styles.srOnly}>Sponsor</span>
        <select value={sponsor} onChange={(e) => go("sponsor", e.target.value)} disabled={pending}>
          {sponsors.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.picker}>
        <span className={styles.srOnly}>Booth</span>
        <select value={booth ?? ""} onChange={(e) => go("booth", e.target.value)} disabled={pending}>
          <option value="">Pilih booth…</option>
          {booths.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
