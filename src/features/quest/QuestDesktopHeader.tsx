"use client"

import { useHasSession } from "@/shared/hooks/useHasSession"
import QuestHeader from "./QuestHeader"

/**
 * Header quest versi desktop, dengan keadaannya dipilih dari sesi.
 *
 * Keadaan `flash` BELUM dipakai: dia butuh jendela flash quest yang aktif dari
 * backend (lihat `getSidequestWindow` di branch feat/sidequest-backend), dan
 * menampilkannya dari data karangan berarti memasang hitung mundur palsu.
 *
 * `useHasSession()` mengembalikan false saat render server dan selama hidrasi,
 * jadi keadaan signedOut yang tergambar lebih dulu — sama seperti tombol
 * Log In / Dashboard di navbar situs.
 */
export default function QuestDesktopHeader() {
  const signedIn = useHasSession()

  return <QuestHeader state={signedIn ? "signedIn" : "signedOut"} uid="quest-page-header" />
}
