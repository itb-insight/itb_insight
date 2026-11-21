"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { postWithAuth } from "@/features/dashboard/apiClient"

import styles from "./CompetitionLab.module.css"
import type { LabTeam } from "./types"

export type LabDefaults = {
  competitionSlug: string
  teamName: string
  school: string
  members: Array<{ name: string; email: string }>
}

type LogEntry = { at: string; text: string; ok: boolean }

interface CompetitionLabProps {
  competitions: Array<{ slug: string; title: string }>
  defaults: LabDefaults
  teams: LabTeam[]
  adminEmail: string
}

const SLOT_LABELS = ["Ketua (slot 1)", "Anggota 1 (slot 2)", "Anggota 2 (slot 3)"]

/** Admin test bench for imported-team behaviour: seed a team, claim/release slots, preview, reset. */
export default function CompetitionLab({ competitions, defaults, teams, adminEmail }: CompetitionLabProps) {
  const router = useRouter()
  const [form, setForm] = useState(defaults)
  const [busy, setBusy] = useState<string | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])

  const addLog = (text: string, ok: boolean) =>
    setLog((prev) => [{ at: new Date().toLocaleTimeString("id-ID"), text, ok }, ...prev].slice(0, 20))

  async function run(label: string, body: Record<string, unknown>, describe: (data: never) => string) {
    setBusy(label)
    try {
      const res = await postWithAuth<never>("/api/admin/competition-lab", body)
      if (res.needsAuth) throw new Error("Sesi berakhir. Silakan login ulang.")
      if (!res.payload.success) throw new Error(res.payload.error.message)
      addLog(`${label}: ${describe(res.payload.data)}`, true)
      router.refresh()
    } catch (error) {
      addLog(`${label}: ${error instanceof Error ? error.message : "gagal"}`, false)
    } finally {
      setBusy(null)
    }
  }

  const seed = () =>
    run(
      "Buat tim uji",
      {
        action: "seed",
        competitionSlug: form.competitionSlug,
        teamName: form.teamName,
        school: form.school,
        ...Object.fromEntries(
          form.members.flatMap((member, i) => [
            [`member${i + 1}Name`, member.name],
            [`member${i + 1}Email`, member.email],
          ]),
        ),
      },
      (data: { teamUid: string }) => `tim ${data.teamUid} dibuat`,
    )

  const setMember = (index: number, key: "name" | "email", value: string) =>
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((member, i) => (i === index ? { ...member, [key]: value } : member)),
    }))

  return (
    <div className={styles.layout}>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>1. Buat tim uji</h2>
        <p className={styles.hint}>
          Sudah terisi untuk kasus uji utama: kamu sebagai ketua (diklaim saat membuka /dashboard), Anggota 1
          diundang lewat alias email, Anggota 2 tanpa email (slot bayangan yang belum bisa diklaim).
        </p>

        <label className={styles.field}>
          <span className={styles.label}>Lomba</span>
          <select
            className={styles.input}
            value={form.competitionSlug}
            onChange={(e) => setForm({ ...form, competitionSlug: e.target.value })}
          >
            {competitions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Nama tim</span>
            <input className={styles.input} value={form.teamName} onChange={(e) => setForm({ ...form, teamName: e.target.value })} />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Sekolah / institusi</span>
            <input className={styles.input} value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} />
          </label>
        </div>

        {form.members.map((member, i) => (
          <div key={SLOT_LABELS[i]} className={styles.row}>
            <label className={styles.field}>
              <span className={styles.label}>{SLOT_LABELS[i]} — nama</span>
              <input className={styles.input} value={member.name} onChange={(e) => setMember(i, "name", e.target.value)} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Email klaim (kosong = belum bisa diklaim)</span>
              <input
                className={styles.input}
                type="email"
                value={member.email}
                onChange={(e) => setMember(i, "email", e.target.value)}
              />
            </label>
          </div>
        ))}

        <div className={styles.buttons}>
          <button type="button" className={styles.primary} disabled={Boolean(busy)} onClick={seed}>
            {busy === "Buat tim uji" ? "Membuat…" : "Buat tim uji"}
          </button>
          <button type="button" className={styles.secondary} disabled={Boolean(busy)} onClick={() => setForm(defaults)}>
            Isi ulang default
          </button>
        </div>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>2. Klaim slot ({adminEmail})</h2>
        <p className={styles.hint}>
          Klaim berjalan otomatis saat login dan saat membuka /dashboard. Tombol ini menjalankannya sekarang untuk
          akunmu; &quot;Lepas slot&quot; mengembalikan slot tim uji milikmu menjadi bayangan supaya bisa diuji lagi.
        </p>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.primary}
            disabled={Boolean(busy)}
            onClick={() =>
              run(
                "Klaim",
                { action: "claim" },
                (data: { claimed: string[]; skipped: Array<{ reason: string }>; emailVerified: boolean }) =>
                  data.emailVerified
                    ? `${data.claimed.length} slot diklaim${data.skipped.length ? `, ${data.skipped.length} dilewati (${data.skipped.map((s) => s.reason).join(", ")})` : ""}`
                    : "email akunmu belum terverifikasi, tidak ada yang diklaim",
              )
            }
          >
            Jalankan klaim
          </button>
          <button
            type="button"
            className={styles.secondary}
            disabled={Boolean(busy)}
            onClick={() => run("Lepas slot", { action: "release" }, (data: { released: number }) => `${data.released} slot dilepas`)}
          >
            Lepas slot saya
          </button>
          <a className={styles.secondary} href="/dashboard">
            Buka /dashboard
          </a>
        </div>

        <h2 className={styles.panelTitle}>Log</h2>
        {log.length ? (
          <ul className={styles.log}>
            {log.map((entry, i) => (
              <li key={`${entry.at}-${i}`} className={entry.ok ? styles.logOk : styles.logError}>
                <span className={styles.logTime}>{entry.at}</span> {entry.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.hint}>Belum ada aksi.</p>
        )}
      </section>

      <section className={`${styles.panel} ${styles.full}`}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Tim uji ({teams.length})</h2>
          <button
            type="button"
            className={styles.danger}
            disabled={Boolean(busy) || !teams.length}
            onClick={() => {
              if (window.confirm("Hapus SEMUA tim uji? Tim hasil impor tidak tersentuh.")) {
                run("Reset", { action: "reset" }, (data: { deleted: number }) => `${data.deleted} tim uji dihapus`)
              }
            }}
          >
            Hapus semua tim uji
          </button>
        </div>

        {teams.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Tim</th>
                  <th>Lomba</th>
                  <th>Status</th>
                  <th>Slot</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td className={styles.mono}>{team.teamUid}</td>
                    <td>{team.teamName}</td>
                    <td>{team.competitionName}</td>
                    <td>{team.status}</td>
                    <td>
                      {team.members.map((m) => (
                        <div key={`${team.id}-${m.slot}`} className={styles.slot}>
                          {m.slot}. {m.name}{" "}
                          <span className={styles.slotState}>
                            {m.status === "withdrawn" ? "mundur" : m.claimed ? "aktif" : m.claimEmail ? `diundang: ${m.claimEmail}` : "bayangan"}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className={styles.rowActions}>
                      <a className={styles.link} href={`?preview=${encodeURIComponent(team.teamUid)}#preview`}>
                        Pratinjau
                      </a>
                      <button
                        type="button"
                        className={styles.linkDanger}
                        disabled={Boolean(busy)}
                        onClick={() => run("Hapus", { action: "delete", teamId: team.id }, () => `${team.teamUid} dihapus`)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.hint}>Belum ada tim uji.</p>
        )}
      </section>
    </div>
  )
}
