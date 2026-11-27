"use client";

import { ChevronDown, Search, Trash2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState, useTransition } from "react";

import PanelHifi from "@/features/admin-hifi/PanelHifi";
import { postWithAuth } from "@/features/dashboard/apiClient";
import { AdminPill } from "@/layouts/AdminShellHifi/AdminPageHeader";
import {
  EMAIL_PATTERN,
  groupBoothsByCategory,
  normalizeEmail,
  type PointsBooth,
} from "@/lib/booth-points";
import type {
  AllBoothsHolder,
  BoothAccessOverview,
  BoothAssignmentView,
} from "@/lib/booth-roster";

import styles from "./BoothAccessManager.module.css";

/*
  Booth access page (/admin/booth-access). Booth stakeholders and admins:
    - add a booth to an email (the account may not exist yet; it counts once that email signs in
      verified),
    - see every booth with the people who can scan there, booths with nobody flagged. Each event
      and each booth is collapsible, closed at first, with the number of people assigned in a
      circle; a search opens what matches,
    - remove an assignment (kept as history, not deleted),
    - see who reaches every booth through their profile role, and the latest changes.
  Writes go to POST /api/booth-points/access; the page reloads its server data after each change.
*/

type Status =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

const timeFormat = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

function displayName(a: BoothAssignmentView): string {
  return a.profile?.fullName ?? a.email;
}

function accountNote(a: BoothAssignmentView): string | null {
  if (!a.profile) return "Belum login";
  if (!a.profile.roleA) return "Akun pengunjung";
  return null;
}

const ALL_BOOTHS_REASON: Record<AllBoothsHolder["reason"], string> = {
  stakeholder: "Stakeholder booth",
  staff_all: "Staff booth (semua)",
};

export default function BoothAccessManager({
  overview,
}: {
  overview: BoothAccessOverview;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [email, setEmail] = useState("");
  const [boothId, setBoothId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Expanded events (category ids) and booths (booth ids). Everything starts closed.
  const [openKeys, setOpenKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const busy = status.kind === "busy" || refreshing;
  const groups = useMemo(
    () => groupBoothsByCategory(overview.booths),
    [overview.booths],
  );

  const byBooth = useMemo(() => {
    const map = new Map<string, BoothAssignmentView[]>();
    for (const a of overview.assignments) {
      map.set(a.boothId, [...(map.get(a.boothId) ?? []), a]);
    }
    for (const list of map.values())
      list.sort((x, y) => displayName(x).localeCompare(displayName(y)));
    return map;
  }, [overview.assignments]);

  const boothName = useMemo(
    () => new Map(overview.booths.map((b) => [b.id, b.name])),
    [overview.booths],
  );
  const peopleCount = new Set(overview.assignments.map((a) => a.email)).size;
  const uncovered = overview.booths.filter((b) => !byBooth.has(b.id)).length;

  const q = query.trim().toLowerCase();
  // While searching, everything that matches is shown open.
  const isOpen = (key: string) => Boolean(q) || openKeys.has(key);
  const matches = (booth: PointsBooth) =>
    !q ||
    booth.name.toLowerCase().includes(q) ||
    (byBooth.get(booth.id) ?? []).some(
      (a) => a.email.includes(q) || displayName(a).toLowerCase().includes(q),
    );

  async function call(
    body: Record<string, unknown>,
  ): Promise<{ email?: string; boothName?: string }> {
    const res = await postWithAuth<{ email?: string; boothName?: string }>(
      "/api/booth-points/access",
      body,
    );
    if (res.needsAuth) throw new Error("Sesi berakhir. Silakan login ulang.");
    if (!res.payload.success) throw new Error(res.payload.error.message);
    return res.payload.data;
  }

  async function handleGrant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = normalizeEmail(email);
    if (!EMAIL_PATTERN.test(target)) {
      setStatus({ kind: "error", message: "Email tidak valid." });
      return;
    }
    if (!boothId) {
      setStatus({ kind: "error", message: "Pilih booth dulu." });
      return;
    }
    setStatus({ kind: "busy" });
    try {
      const data = await call({ action: "grant", email: target, boothId });
      // Keep the email: adding several booths for one person is the common case.
      setBoothId("");
      setStatus({
        kind: "ok",
        message: `${data.email ?? target} sekarang bisa scan di ${data.boothName ?? "booth ini"}.`,
      });
      startRefresh(() => router.refresh());
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Gagal menambah akses.",
      });
    }
  }

  async function handleRevoke(a: BoothAssignmentView) {
    const booth = boothName.get(a.boothId) ?? "booth ini";
    if (
      !window.confirm(`Cabut akses ${displayName(a)} (${a.email}) di ${booth}?`)
    )
      return;
    setStatus({ kind: "busy" });
    try {
      await call({ action: "revoke", assignmentId: a.id });
      setStatus({
        kind: "ok",
        message: `Akses ${a.email} di ${booth} dicabut.`,
      });
      startRefresh(() => router.refresh());
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Gagal mencabut akses.",
      });
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.column}>
        <PanelHifi
          title="Tambah akses"
          subtitle="Email akun Google / email login LO. Boleh sebelum akunnya dibuat: akses berlaku saat ia login dengan email itu."
        >
          <form className={styles.form} onSubmit={handleGrant}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <input
                className={styles.input}
                type="email"
                inputMode="email"
                autoComplete="off"
                spellCheck={false}
                placeholder="nama@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Booth</span>
              <select
                className={styles.input}
                value={boothId}
                onChange={(e) => setBoothId(e.target.value)}
                disabled={busy}
                required
              >
                <option value="" disabled>
                  Pilih booth…
                </option>
                {groups.map((group) => (
                  <optgroup key={group.category} label={group.label}>
                    {group.booths.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <button type="submit" className={styles.primaryBtn} disabled={busy}>
              <UserPlus size={20} aria-hidden="true" /> Tambah akses
            </button>
          </form>

          <div aria-live="polite">
            {status.kind === "busy" ? (
              <p className={styles.muted}>Menyimpan…</p>
            ) : null}
            {status.kind === "ok" ? (
              <p className={`${styles.status} ${styles.statusOk}`}>
                {status.message}
              </p>
            ) : null}
            {status.kind === "error" ? (
              <p className={`${styles.status} ${styles.statusError}`}>
                {status.message}
              </p>
            ) : null}
          </div>
        </PanelHifi>

        <PanelHifi
          title="Siapa bisa scan di mana"
          subtitle={`${overview.booths.length} booth · ${peopleCount} orang dengan akses per booth`}
          action={
            uncovered > 0 ? (
              <AdminPill>{uncovered} booth tanpa LO</AdminPill>
            ) : undefined
          }
        >
          <label className={styles.search}>
            <Search size={18} aria-hidden="true" />
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Cari booth, nama, atau email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Cari booth, nama, atau email"
            />
          </label>

          {groups.map((group) => {
            const shown = group.booths.filter(matches);
            if (shown.length === 0) return null;
            const covered = group.booths.filter((b) =>
              byBooth.has(b.id),
            ).length;
            const groupPeople = new Set(
              group.booths.flatMap((b) =>
                (byBooth.get(b.id) ?? []).map((a) => a.email),
              ),
            ).size;
            const groupKey = `category:${group.category}`;
            const groupOpen = isOpen(groupKey);
            const groupPanel = `booth-access-${group.category}`;
            return (
              <section key={group.category} className={styles.category}>
                <h3 className={styles.categoryHeading}>
                  <button
                    type="button"
                    className={styles.categoryToggle}
                    aria-expanded={groupOpen}
                    aria-controls={groupPanel}
                    onClick={() => toggle(groupKey)}
                  >
                    <ChevronDown
                      size={20}
                      aria-hidden="true"
                      className={
                        groupOpen ? styles.chevronOpen : styles.chevron
                      }
                    />
                    <span className={styles.categoryLabel}>{group.label}</span>
                    <span className={styles.categoryMeta}>
                      {covered}/{group.booths.length} booth punya LO
                    </span>
                    <span
                      className={styles.count}
                      aria-label={`${groupPeople} orang`}
                    >
                      {groupPeople}
                    </span>
                  </button>
                </h3>
                {groupOpen ? (
                  <ul id={groupPanel} className={styles.boothList}>
                    {shown.map((booth) => {
                      const people = byBooth.get(booth.id) ?? [];
                      const boothOpen = isOpen(booth.id);
                      const boothPanel = `booth-access-${booth.id}`;
                      return (
                        <li key={booth.id} className={styles.boothRow}>
                          <button
                            type="button"
                            className={styles.boothToggle}
                            aria-expanded={boothOpen}
                            aria-controls={boothPanel}
                            onClick={() => toggle(booth.id)}
                          >
                            <ChevronDown
                              size={18}
                              aria-hidden="true"
                              className={
                                boothOpen ? styles.chevronOpen : styles.chevron
                              }
                            />
                            <span className={styles.boothName}>
                              {booth.name}
                            </span>
                            <span className={styles.boothMeta}>
                              {booth.contribution} + {booth.bonus} poin
                            </span>
                            <span
                              className={`${styles.count} ${people.length === 0 ? styles.countEmpty : ""}`}
                              aria-label={`${people.length} orang`}
                            >
                              {people.length}
                            </span>
                          </button>
                          {!boothOpen ? null : people.length === 0 ? (
                            <p id={boothPanel} className={styles.empty}>
                              Belum ada LO
                            </p>
                          ) : (
                            <ul id={boothPanel} className={styles.people}>
                              {people.map((a) => {
                                const note = accountNote(a);
                                return (
                                  <li key={a.id} className={styles.person}>
                                    <span className={styles.personText}>
                                      <span className={styles.personName}>
                                        {displayName(a)}
                                      </span>
                                      <span className={styles.personEmail}>
                                        {a.email}
                                      </span>
                                      {note ? (
                                        <span className={styles.personNote}>
                                          {note}
                                        </span>
                                      ) : null}
                                    </span>
                                    <button
                                      type="button"
                                      className={styles.removeBtn}
                                      onClick={() => handleRevoke(a)}
                                      disabled={busy}
                                      aria-label={`Cabut akses ${displayName(a)} di ${booth.name}`}
                                      title="Cabut akses"
                                    >
                                      <Trash2 size={18} aria-hidden="true" />
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })}

          {groups.every(
            (group) => group.booths.filter(matches).length === 0,
          ) ? (
            <p className={styles.muted}>Tidak ada yang cocok.</p>
          ) : null}
        </PanelHifi>
      </div>

      <div className={styles.column}>
        <PanelHifi
          title="Akses semua booth"
          subtitle="Lewat role profil (stakeholder booth, atau staff booth 'all'). Diatur admin, bukan dari halaman ini."
        >
          {overview.allBooths.length === 0 ? (
            <p className={styles.muted}>Belum ada.</p>
          ) : (
            <ul className={styles.log}>
              {overview.allBooths.map((holder) => (
                <li key={holder.email} className={styles.logRow}>
                  <span className={styles.logName}>{holder.fullName}</span>
                  <span className={styles.logTag}>
                    {ALL_BOOTHS_REASON[holder.reason]}
                  </span>
                  <span className={styles.logMeta}>{holder.email}</span>
                </li>
              ))}
            </ul>
          )}
        </PanelHifi>

        <PanelHifi
          title="Riwayat perubahan"
          subtitle="Akses yang ditambah dan dicabut, terbaru di atas."
        >
          {overview.history.length === 0 ? (
            <p className={styles.muted}>Belum ada.</p>
          ) : (
            <ul className={styles.log}>
              {overview.history.map((change) => (
                <li key={change.key} className={styles.logRow}>
                  <span className={styles.logName}>{change.email}</span>
                  <span
                    className={
                      change.kind === "assigned"
                        ? styles.logAdded
                        : styles.logRemoved
                    }
                  >
                    {change.kind === "assigned" ? "+ " : "− "}
                    {change.boothName}
                  </span>
                  <span className={styles.logMeta} suppressHydrationWarning>
                    {change.kind === "assigned" ? "Ditambah" : "Dicabut"} oleh{" "}
                    {change.byName ?? "admin (SQL)"} ·{" "}
                    {timeFormat.format(new Date(change.at))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PanelHifi>
      </div>
    </div>
  );
}
