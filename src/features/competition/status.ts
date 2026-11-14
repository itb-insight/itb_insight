import type { Competition } from "@/features/competition/types";

export type RegistrationState = "upcoming" | "open" | "closed";

/**
 * Status pendaftaran saat halaman dirender di server. Halaman memakai ISR
 * (revalidate 3600), jadi status ini paling lambat 1 jam tertinggal dari
 * jam sebenarnya. Hitung mundurnya sendiri berjalan di browser.
 */
export function registrationState(c: Competition, now = Date.now()): RegistrationState {
  if (now < Date.parse(c.registration.opens)) return "upcoming";
  if (now <= Date.parse(c.registration.closes)) return "open";
  return "closed";
}

/**
 * Yang dihitung mundur:
 *   pendaftaran belum ditutup  -> batas akhir pendaftaran
 *   pendaftaran sudah ditutup  -> hari final (finalCountdown)
 * title berupa dua baris, mengikuti judul dua baris di desain mobile.
 */
export function countdownFor(c: Competition, now = Date.now()) {
  return registrationState(c, now) === "closed"
    ? { target: c.finalCountdown.date, title: c.finalCountdown.title }
    : { target: c.registration.closes, title: ["Registration", "countdown"] as [string, string] };
}

/**
 * Tombol "Register Now" DITUTUP secara default di semua lomba ("Pendaftaran
 * Ditutup"). Pendaftaran dilakukan lewat formulir eksternal (registerUrl),
 * bukan website. Tombol terbuka hanya kalau lomba punya registerUrl DAN
 * env server-nya bernilai true, per kode lomba:
 *   REGISTER_OPEN_MOR=true   Drone Soccer Competition (dulu Microdrone Obstacle Race)
 *   REGISTER_OPEN_BPC=true   Business Plan Competition
 *   REGISTER_OPEN_OE=true    Olimpiade Engineering
 *   REGISTER_OPEN_SAR=true   Safety and Rescue Robot Competition
 * Dibaca di server saat render; di Vercel, ubah env lalu redeploy.
 */
export function registerEnabled(c: Competition): c is Competition & { registerUrl: string } {
  return c.registerUrl !== null && process.env[`REGISTER_OPEN_${c.code}`] === "true";
}
