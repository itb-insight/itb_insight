import { clearUserCaches } from "./swClient"

/*
  Sign-out and the offline features (docs/OFFLINE.md):
  - staff scans still waiting in the offline queue are sent only by the account that made them,
    so signing out first asks for confirmation;
  - pages cached for this account (QR, arcade, scanners) are deleted from the browser.
  Returns false when the user chose to stay signed in.
*/
export async function prepareSignOut(): Promise<boolean> {
  try {
    const { countPending } = await import("@/features/offline-queue/store")
    const pending = await countPending()
    if (
      pending > 0 &&
      !window.confirm(
        `Ada ${pending} scan yang belum terkirim di HP ini. Scan itu hanya bisa dikirim oleh akun yang sama: ` +
          "tetap keluar? (Pilih Batal, lalu tunggu sinyal dan tekan Kirim sekarang di halaman scanner.)",
      )
    ) {
      return false
    }
  } catch {
    // No queue in this browser.
  }
  await clearUserCaches()
  return true
}
