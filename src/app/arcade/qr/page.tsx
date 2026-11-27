import { redirect } from "next/navigation"

import QuestPageShell from "@/features/quest/QuestPageShell"
import { QuestHeader, QuestScreen } from "@/features/quest/QuestShell"
import styles from "@/features/quest/arcade.module.css"
import quest from "@/features/quest/quest.module.css"
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
        <div className={quest.body}>
          <QuestHeader title="QR Kamu" backHref="/arcade" backLabel="Kembali ke Insight Arcade" />
          {token ? (
            <div className={styles.qrCard}>
              <PersonalQr token={token} size={288} />
            </div>
          ) : (
            <p className={styles.empty}>QR belum tersedia, muat ulang halaman.</p>
          )}
          <p className={styles.qrHint}>Tunjukkan QR ini ke panitia di booth, gate, atau meja hadiah.</p>
        </div>
      </QuestScreen>
    </QuestPageShell>
  )
}
