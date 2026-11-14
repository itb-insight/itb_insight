import "server-only";
import type { Competition } from "@/features/competition/types";
import { getAllCompetitions } from "@/features/competition/data";
import { formatRp, joinIndonesian } from "@/features/competition/format";

/**
 * FAQ halaman /competition (daftar semua lomba).
 *
 * Jawabannya DIHITUNG dari data tiap lomba (data.ts), bukan diketik ulang,
 * supaya ikut berubah kalau biaya, jadwal, atau syarat peserta berubah.
 * Semua kalimat tidak menyebut "sudah ditutup" / "masih dibuka": halaman ini
 * dibangun statis, jadi status seperti itu bisa basi. Status terkini ada di
 * tombol Register Now pada halaman tiap lomba.
 */
export interface FaqItem {
  q: string;
  a: string;
}

const TZ = "Asia/Jakarta";

function dateId(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(iso));
}

/** "26 – 28 November 2026" kalau satu bulan, selain itu dua tanggal penuh. */
function dateRangeId(isos: string[]): string {
  const sorted = [...isos].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const part = (iso: string, opt: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("id-ID", { ...opt, timeZone: TZ }).format(new Date(iso));
  if (part(first, { month: "numeric", year: "numeric" }) === part(last, { month: "numeric", year: "numeric" })) {
    const d1 = part(first, { day: "numeric" });
    const d2 = part(last, { day: "numeric" });
    return d1 === d2 ? dateId(first) : `${d1} – ${dateId(last)}`;
  }
  return `${dateId(first)} – ${dateId(last)}`;
}

const fact = (c: Competition, label: string) => c.info.facts.find((f) => f.label === label)?.value;

const bullets = (lines: string[]) => lines.map((l) => `• ${l}`).join("\n");

function feeLine(c: Competition): string {
  const amounts = c.fees.map((f) => f.amount);
  const lo = Math.min(...amounts);
  const hi = Math.max(...amounts);
  const unit = c.fees[0].unit.toLowerCase();
  if (c.fees.length === 1) return `${c.title}: ${formatRp(lo)} ${unit}`;
  const labels = c.fees.map((f) => f.label).filter(Boolean) as string[];
  return `${c.title}: ${formatRp(lo)} – ${formatRp(hi)} ${unit} (${joinIndonesian(labels)})`;
}

function deadlineLine(c: Competition): string {
  const closes = dateId(c.registration.closes);
  if (c.fees.length === 1) return `${c.title}: ${closes}`;
  const periods = c.fees
    .filter((f) => f.label && f.periodLabel)
    .map((f) => `${f.label} ${f.periodLabel}`);
  return `${c.title}: ${closes} (${periods.join(", ")})`;
}

export async function getCompetitionFaq(): Promise<FaqItem[]> {
  const comps = await getAllCompetitions();

  const titles = joinIndonesian(comps.map((c) => c.title));
  const finals = dateRangeId(comps.map((c) => c.finalCountdown.date));
  const totalPrize = comps.reduce((sum, c) => sum + (c.prize.amount ?? 0), 0);
  const extras = [...new Set(comps.flatMap((c) => c.prize.extras ?? []).map((e) => e.toLowerCase()))];
  const prizeText =
    `Total hadiah uang tunai ${formatRp(totalPrize)}` +
    (extras.length ? `, ditambah hadiah ${joinIndonesian(extras)}.` : ".");

  return [
    {
      q: "Apa itu Insight Competition?",
      a:
        `Insight Competition adalah rangkaian kompetisi nasional dalam ITB Insight 2026, event teknologi terbesar di ITB. ` +
        `Tahun ini ada ${comps.length} lomba: ${titles}. ` +
        `Babak final dan awarding berlangsung pada ${finals} di Kampus ITB Ganesha, Bandung. ${prizeText}`,
    },
    {
      q: "Siapa yang bisa mendaftar?",
      a:
        `Tergantung lombanya:\n` +
        bullets(comps.map((c) => `${c.title}: ${fact(c, "Format")}. ${fact(c, "Peserta")}.`)) +
        `\nSemua lomba terbuka untuk peserta dari seluruh Indonesia.`,
    },
    {
      q: "Bagaimana cara mendaftar?",
      a:
        `Pendaftaran tidak dilakukan lewat akun di website ini, tetapi lewat formulir pendaftaran resmi tiap lomba. ` +
        `Buka halaman lomba yang kamu pilih, lalu klik Register Now untuk membuka formulirnya. ` +
        `Tombol itu hanya aktif selama pendaftaran dibuka; di luar masa itu tampil sebagai Pendaftaran Ditutup.\n\n` +
        `Biaya pendaftaran:\n` +
        bullets(comps.map(feeLine)) +
        `\n\nSyarat peserta dan dokumen yang perlu disiapkan ada di bagian Detail Lomba pada halaman tiap lomba. ` +
        `Pertanyaan lain? Hubungi kami lewat Instagram @itbinsight atau narahubung yang tercantum di halaman lomba.`,
    },
    {
      q: "Kapan deadline pendaftaran?",
      a:
        `Deadline berbeda tiap lomba:\n` +
        bullets(comps.map(deadlineLine)) +
        `\n\nUntuk lomba dengan beberapa gelombang, biayanya naik di tiap gelombang, jadi makin awal mendaftar makin murah.`,
    },
  ];
}
