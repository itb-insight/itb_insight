import { notFound, redirect } from "next/navigation"

import QuestHowToPlay from "@/features/quest/QuestHowToPlay"
import shared from "@/features/quest/quest-shared.module.css"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "How to Play | ITB Insight",
  description: "Aturan main quest ITB Insight.",
  robots: { index: false, follow: false },
}

/* Sesi dibaca dari cookie tiap permintaan, jadi halamannya tidak boleh dibekukan. */
export const dynamic = "force-dynamic"

export default async function QuestHowToPlayPage() {
  /*
    Aturan mainnya masih memuat placeholder "[FREEZE TIME]". Hapus baris ini —
    dan syarat NODE_ENV di MobileMenuHifi yang menyembunyikan menu Quest —
    begitu quest siap tayang.
  */
  if (process.env.NODE_ENV === "production") notFound()

  /*
    Pintu masuk quest dari menu situs selalu menunjuk ke sini, termasuk untuk
    yang belum masuk; halaman ini yang mengalihkan. Dilakukan di server, bukan
    dengan menukar href di menu, karena useHasSession() mengembalikan false
    sampai hidrasi selesai — tautannya akan sempat menunjuk /login walau
    pengguna sudah masuk. Lewat sini juga `next` terbawa, jadi setelah masuk dia
    mendarat di aturan main, bukan di beranda.
  */
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/quest/how-to-play")

  return (
    <div className={shared.shell}>
      <QuestHowToPlay />
    </div>
  )
}
