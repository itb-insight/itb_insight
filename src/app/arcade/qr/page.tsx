import { redirect } from "next/navigation"

import QuestPageShell from "@/features/quest/QuestPageShell"
import { QuestScreen } from "@/features/quest/QuestShell"
import styles from "@/features/quest/quest.module.css"
import { getArcadePlayer } from "@/lib/arcade"
import { createClient } from "@/lib/supabase/server"
import { ensureVisitorTicket } from "@/lib/tickets"
import PersonalQr from "@/shared/components/PersonalQr/PersonalQr"

export const dynamic = "force-dynamic"
export const metadata = { title: "QR Insight Arcade | ITB Insight", robots: { index: false, follow: false } }

// The scan tab: the visitor's personal QR, which booth staff, gate staff and the prize desk scan.
export default async function ArcadeQrPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/arcade/qr")

  const [ticket, player] = await Promise.all([ensureVisitorTicket(user.id), getArcadePlayer(user.id).catch(() => null)])
  const token = ticket.ok ? ticket.ticket.qr_code : null

  return (
    <QuestPageShell activeTab="quests" points={player?.points} rank={player?.rank}>
      <QuestScreen>
        <div className={styles.body}>
          <h1 className={styles.cardTitle}>QR Insight Arcade</h1>
          <p className={styles.cardMeta}>Tunjukkan QR ini ke panitia di booth, gate, atau meja hadiah.</p>
          {token ? <PersonalQr token={token} size={280} /> : <p className={styles.cardMeta}>QR belum tersedia, muat ulang halaman.</p>}
        </div>
      </QuestScreen>
    </QuestPageShell>
  )
}
