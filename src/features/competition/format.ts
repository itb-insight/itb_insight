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
