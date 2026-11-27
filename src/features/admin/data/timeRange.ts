/**
 * Time-range config + bucketing helpers untuk widget /admin/d-day.
 * Dipakai bareng oleh LineChartWidget & HeatmapWidget (tab 30 min | 1 jam | 2 jam | 5 jam | 12 jam).
 */

export type RangeKey = "30m" | "1h" | "2h" | "5h" | "12h";

export type RangeOption = {
  key: RangeKey;
  label: string;
  /** panjang window ke belakang dari `now` (menit) */
  minutes: number;
  /** ukuran satu titik/bucket di line chart (menit) */
  bucketMinutes: number;
};

export const RANGE_OPTIONS: RangeOption[] = [
  { key: "30m", label: "30 min", minutes: 30, bucketMinutes: 5 },
  { key: "1h", label: "1 jam", minutes: 60, bucketMinutes: 5 },
  { key: "2h", label: "2 jam", minutes: 120, bucketMinutes: 10 },
  { key: "5h", label: "5 jam", minutes: 300, bucketMinutes: 30 },
  { key: "12h", label: "12 jam", minutes: 720, bucketMinutes: 60 },
];

export const getRange = (key: RangeKey): RangeOption =>
  RANGE_OPTIONS.find((r) => r.key === key) ?? RANGE_OPTIONS[RANGE_OPTIONS.length - 1];

/**
 * Acara di Bandung, jadi jam selalu ditampilkan dalam WIB (UTC+7, tanpa DST),
 * apa pun timezone browser atau server (Vercel/CI berjalan di UTC).
 */
const WIB_OFFSET_MS = 7 * 60 * 60_000;

/** Format jam gaya Indonesia dalam WIB: 08.00, 13.25 */
export const formatClock = (d: Date) => {
  const wib = new Date(d.getTime() + WIB_OFFSET_MS);
  return `${String(wib.getUTCHours()).padStart(2, "0")}.${String(wib.getUTCMinutes()).padStart(2, "0")}`;
};

/** Awal window, dibulatkan ke bawah ke kelipatan bucket supaya label rapi (08.00, 09.00, ...) */
export function windowStart(range: RangeOption, now: Date) {
  const bucketMs = range.bucketMinutes * 60_000;
  const end = Math.ceil(now.getTime() / bucketMs) * bucketMs;
  return new Date(end - range.minutes * 60_000);
}

/** `count`: how many events this row stands for (pre-aggregated slots); default 1. */
export type TimedEvent = { at: string | Date; count?: number };

/**
 * Hitung jumlah event per bucket.
 * Contoh: check-in gate selama 12 jam → 12 bucket @1 jam.
 */
export function bucketize<T extends TimedEvent>(
  events: T[],
  range: RangeOption,
  now: Date = new Date(),
): { labels: string[]; values: number[] } {
  const start = windowStart(range, now).getTime();
  const bucketMs = range.bucketMinutes * 60_000;
  const n = Math.round(range.minutes / range.bucketMinutes);
  const values = new Array<number>(n).fill(0);

  for (const e of events) {
    const t = new Date(e.at).getTime();
    const i = Math.floor((t - start) / bucketMs);
    if (i >= 0 && i < n) values[i] += e.count ?? 1;
  }
  const labels = values.map((_, i) => formatClock(new Date(start + i * bucketMs)));
  return { labels, values };
}

/**
 * Versi multi-series: kelompokkan event per key (mis. gate_id) → satu garis per gate.
 */
export function bucketizeBy<T extends TimedEvent>(
  events: T[],
  keyOf: (e: T) => string,
  range: RangeOption,
  now: Date = new Date(),
) {
  const groups = new Map<string, T[]>();
  for (const e of events) {
    const k = keyOf(e);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }
  let labels: string[] = bucketize([], range, now).labels;
  const series = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, evs]) => {
      const b = bucketize(evs, range, now);
      labels = b.labels;
      return { name, values: b.values };
    });
  return { labels, series };
}

/** Filter event yang masuk window range (dipakai heatmap) */
export function withinRange<T extends TimedEvent>(events: T[], range: RangeOption, now: Date = new Date()) {
  const start = now.getTime() - range.minutes * 60_000;
  return events.filter((e) => {
    const t = new Date(e.at).getTime();
    return t >= start && t <= now.getTime();
  });
}
