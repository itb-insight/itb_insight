// Shape of the "My Activity" card on /dashboard. Built on the server by
// src/lib/dashboard-activity.ts (from the user's competition teams) and rendered by ActivityCard.

export type MemberState =
  /** Linked to an account. */
  | "active"
  /** Shadow slot with an email waiting for that person to sign in. */
  | "invited"
  /** Shadow slot nobody can claim yet (form members have no email until the leader invites one). */
  | "unclaimed"

export interface ActivityMember {
  id: string
  slot: number | null
  /** "Ketua:", "Anggota 1:", … */
  role: string
  name: string
  /** The leader gets the dark row and a crown. */
  isLeader: boolean
  isYou: boolean
  state: MemberState
  /** Only sent to the team leader, for managing invites. */
  inviteEmail?: string | null
}

export interface ActivityAction {
  label: string
  href: string
  icon: string | null
}

export interface ActivityEntry {
  teamId: string
  teamUid: string
  competitionSlug: string
  competitionName: string
  /** Activity type chip, as in Figma ("Lomba"). */
  badge: string
  /** Shown next to the badge when the team is not simply registered (e.g. withdrawn). */
  statusLabel: string | null
  withdrawn: boolean
  viewerIsLeader: boolean
  teamName: string
  /** "Sekolah: …" / "Institusi: …" */
  institution: string
  members: ActivityMember[]
  /** Next stage on the competition timeline, or null when nothing is ahead. */
  nextStage: { label: string; date: string } | null
  /** Contact buttons; a competition without a link for a channel simply has no button for it. */
  actions: ActivityAction[]
}
