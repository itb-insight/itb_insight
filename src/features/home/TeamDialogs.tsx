"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { X } from "lucide-react"

import { postWithAuth } from "@/features/dashboard/apiClient"
import Modal from "@/shared/components/modals/Modal"
import ModalButton from "@/shared/components/modals/ModalButton"

import type { ActivityEntry, ActivityMember } from "./activityTypes"
import styles from "./TeamDialogs.module.css"

/** Mirrors WITHDRAW_CONFIRMATION in src/lib/team-actions.ts (the API checks it too). */
const CONFIRM_WORD = "MUNDUR"

export type TeamDialog = "manage" | "invite" | "leader" | null

interface TeamDialogsProps {
  entry: ActivityEntry
  open: TeamDialog
  onClose: () => void
}

/** Calls /api/teams/manage; resolves to an error message, or null on success (and refreshes). */
function useTeamAction() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function call(body: Record<string, unknown>): Promise<string | null> {
    setBusy(true)
    try {
      const res = await postWithAuth<unknown>("/api/teams/manage", body)
      if (res.needsAuth) return "Sesi berakhir. Silakan masuk lagi."
      if (!res.payload.success) return res.payload.error.message
      router.refresh()
      return null
    } catch {
      return "Tidak bisa terhubung. Coba lagi."
    } finally {
      setBusy(false)
    }
  }

  return { call, busy }
}

export default function TeamDialogs({ entry, open, onClose }: TeamDialogsProps) {
  return (
    <>
      <ManageDialog entry={entry} open={open === "manage"} onClose={onClose} />
      <InviteDialog entry={entry} open={open === "invite"} onClose={onClose} />
      <LeaderDialog entry={entry} open={open === "leader"} onClose={onClose} />
    </>
  )
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Tutup">
        <X size={24} aria-hidden="true" />
      </button>
    </header>
  )
}

/* ── Edit Data: team details (read-only) and withdrawal ─────────────────────── */

function ManageDialog({ entry, open, onClose }: { entry: ActivityEntry; open: boolean; onClose: () => void }) {
  const { call, busy } = useTeamAction()
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)
  const leader = entry.viewerIsLeader

  const close = () => {
    setTyped("")
    setError(null)
    onClose()
  }

  const submit = async () => {
    const message = await call({ action: "withdraw", teamId: entry.teamId, confirmation: typed.trim() })
    if (message) setError(message)
    else close()
  }

  return (
    <Modal open={open} onClose={close} label="Kelola Tim" width="min(560px, calc(100vw - 32px))" radius={16}>
      <div className={styles.body}>
        <Header title="Kelola Tim" onClose={close} />

        <dl className={styles.details}>
          <dt>Lomba</dt>
          <dd>{entry.competitionName}</dd>
          <dt>Nama tim</dt>
          <dd>{entry.teamName}</dd>
          <dt>Kode tim</dt>
          <dd>{entry.teamUid}</dd>
          <dt>{entry.institution.split(":")[0]}</dt>
          <dd>{entry.institution.split(":").slice(1).join(":").trim()}</dd>
        </dl>

        <p className={styles.note}>
          Data tim berasal dari formulir pendaftaran. Nama tim tidak dapat diubah dan anggota tidak dapat dikeluarkan.
          Untuk koreksi data, hubungi narahubung lomba.
        </p>

        <section className={styles.danger}>
          <h3 className={styles.dangerTitle}>{leader ? "Mundurkan tim" : "Mundur dari tim"}</h3>
          <p className={styles.dangerText}>
            {leader ? (
              <>
                Sebagai ketua, mundur berarti <strong>seluruh tim</strong> mengundurkan diri dari {entry.competitionName}{" "}
                untuk semua anggota. Biaya pendaftaran tidak dikembalikan dan tindakan ini tidak bisa dibatalkan dari
                website. Jika hanya kamu yang ingin keluar, ganti ketua terlebih dahulu.
              </>
            ) : (
              <>
                Kamu akan keluar dari tim {entry.teamName}. Tim tetap berjalan tanpamu, dan kamu tidak bisa bergabung
                kembali dari website.
              </>
            )}
          </p>
          <label className={styles.field}>
            <span>
              Ketik <strong>{CONFIRM_WORD}</strong> untuk mengonfirmasi
            </span>
            <input
              className={styles.input}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(error)}
            />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <ModalButton
            variant="outline"
            className={styles.dangerButton}
            disabled={busy || typed.trim() !== CONFIRM_WORD}
            onClick={submit}
          >
            {busy ? "Memproses…" : leader ? "Mundurkan Tim" : "Mundur dari Tim"}
          </ModalButton>
        </section>
      </div>
    </Modal>
  )
}

/* ── Invite Anggota: put an email on an empty slot ─────────────────────────── */

function InviteDialog({ entry, open, onClose }: { entry: ActivityEntry; open: boolean; onClose: () => void }) {
  const slots = entry.members.filter((m) => !m.isLeader && m.state !== "active")

  return (
    <Modal open={open} onClose={onClose} label="Invite Anggota" width="min(620px, calc(100vw - 32px))" radius={16}>
      <div className={styles.body}>
        <Header title="Invite Anggota" onClose={onClose} />
        <p className={styles.note}>
          Masukkan email yang akan dipakai anggota untuk masuk ke website. Begitu mereka masuk dengan email itu, nama
          mereka di tim ini otomatis tersambung ke akunnya. Email bisa diubah selama anggota belum bergabung.
        </p>
        {slots.length ? (
          slots.map((member) => <InviteRow key={member.id} entry={entry} member={member} />)
        ) : (
          <p className={styles.note}>Semua anggota sudah bergabung.</p>
        )}
      </div>
    </Modal>
  )
}

function InviteRow({ entry, member }: { entry: ActivityEntry; member: ActivityMember }) {
  const { call, busy } = useTeamAction()
  const [email, setEmail] = useState(member.inviteEmail ?? "")
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const saved = (member.inviteEmail ?? "") === email.trim().toLowerCase()

  const save = async (value: string) => {
    const message = await call({ action: "invite", teamId: entry.teamId, memberId: member.id, email: value })
    setStatus(message ? { ok: false, text: message } : { ok: true, text: value ? "Undangan disimpan." : "Undangan dihapus." })
    if (!message) setEmail(value)
  }

  return (
    <div className={styles.inviteRow}>
      <label className={styles.field}>
        <span>
          {member.role} {member.name}
        </span>
        <input
          className={styles.input}
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder="email@contoh.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setStatus(null)
          }}
        />
      </label>
      <div className={styles.inviteButtons}>
        <ModalButton size="sm" disabled={busy || !email.trim() || saved} onClick={() => save(email.trim())}>
          Simpan
        </ModalButton>
        {member.inviteEmail && (
          <ModalButton size="sm" variant="outline" disabled={busy} onClick={() => save("")}>
            Hapus
          </ModalButton>
        )}
      </div>
      {status && (
        <p className={status.ok ? styles.success : styles.error} role="status">
          {status.text}
        </p>
      )}
    </div>
  )
}

/* ── Ubah ketua: hand leadership to a joined member ────────────────────────── */

function LeaderDialog({ entry, open, onClose }: { entry: ActivityEntry; open: boolean; onClose: () => void }) {
  const { call, busy } = useTeamAction()
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const candidates = entry.members.filter((m) => !m.isLeader && m.state === "active")
  const chosen = candidates.find((m) => m.id === selected)

  const close = () => {
    setSelected(null)
    setError(null)
    onClose()
  }

  const submit = async () => {
    if (!selected) return
    const message = await call({ action: "leader", teamId: entry.teamId, memberId: selected })
    if (message) setError(message)
    else close()
  }

  return (
    <Modal open={open} onClose={close} label="Ubah Ketua" width="min(560px, calc(100vw - 32px))" radius={16}>
      <div className={styles.body}>
        <Header title="Ubah Ketua" onClose={close} />
        {candidates.length ? (
          <>
            <p className={styles.note}>
              Pilih anggota yang akan menjadi ketua. Hanya anggota yang sudah bergabung (masuk dengan akunnya) yang
              bisa dipilih.
            </p>
            <div className={styles.choices} role="radiogroup" aria-label="Ketua baru">
              {candidates.map((member) => (
                <label key={member.id} className={`${styles.choice} ${selected === member.id ? styles.choiceActive : ""}`}>
                  <input
                    type="radio"
                    name="new-leader"
                    value={member.id}
                    checked={selected === member.id}
                    onChange={() => setSelected(member.id)}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
            {chosen && (
              <p className={styles.dangerText}>
                {chosen.name} akan menjadi ketua, dan kamu menjadi anggota biasa. Setelah ini hanya {chosen.name} yang
                bisa mengundang anggota, mengganti ketua, atau memundurkan tim.
              </p>
            )}
            {error && <p className={styles.error} role="alert">{error}</p>}
            <ModalButton disabled={busy || !selected} onClick={submit}>
              {busy ? "Memproses…" : "Jadikan Ketua"}
            </ModalButton>
          </>
        ) : (
          <p className={styles.note}>
            Belum ada anggota yang bergabung. Undang anggota lewat &quot;Invite Anggota&quot;; setelah mereka masuk
            dengan email itu, mereka bisa dijadikan ketua.
          </p>
        )}
      </div>
    </Modal>
  )
}
