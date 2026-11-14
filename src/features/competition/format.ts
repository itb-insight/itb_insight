const rupiah = new Intl.NumberFormat("id-ID", {
  style: "decimal",
  maximumFractionDigits: 0,
});

/** 250000 -> "IDR 250.000" ; 0 -> "IDR 000.000" (placeholder desain) */
export function formatRupiah(value: number): string {
  if (!value) return "IDR 000.000";
  return `IDR ${rupiah.format(value)}`;
}

/** Pecah angka jadi array digit untuk tampilan kotak-kotak prizepool. */
export function toDigitBoxes(value: number, length = 8): string[] {
  return String(value).padStart(length, "0").split("");
}

/** Harga terendah dari semua gelombang (untuk kartu ringkas). */
export function lowestFee(amounts: number[]): number {
  return Math.min(...amounts);
}

/** "laptop, medali, dan plakat" */
export function joinIndonesian(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} dan ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, dan ${items[items.length - 1]}`;
}

/** Tautan ke situs lain (Google Form, Drive, WhatsApp) dibuka di tab baru. */
export function externalLinkProps(href: string) {
  return /^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

/**
 * Bagian detail lomba dirender dua kali (versi desktop dan mobile, salah
 * satunya disembunyikan CSS), jadi id anchor-nya diberi akhiran per versi
 * supaya tidak kembar. "#kontak" di data menjadi "#kontak-mobile" di mobile.
 */
export function anchorId(id: string, variant: "desktop" | "mobile"): string {
  return variant === "mobile" ? `${id}-mobile` : id;
}

/** Sesuaikan tautan "#anchor" dari data dengan versi halamannya. */
export function variantHref(href: string, variant: "desktop" | "mobile"): string {
  return href.startsWith("#") ? `#${anchorId(href.slice(1), variant)}` : href;
}

/** "081380181827" -> "https://wa.me/6281380181827" (wa.me butuh kode negara). */
export function whatsappUrl(localNumber: string): string {
  return `https://wa.me/62${localNumber.replace(/\D/g, "").replace(/^0/, "")}`;
}

/** 135000 -> "Rp135.000" (untuk teks kalimat; formatRupiah memakai awalan "IDR" untuk kartu). */
export function formatRp(value: number): string {
  return `Rp${rupiah.format(value)}`;
}
