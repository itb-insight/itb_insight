
export interface ActivityMember {
  role: string
  name: string
  /** The leader gets the dark row, a crown and an edit control. */
  isLeader: boolean
}

export interface ActivityAction {
  label: string
  icon: string
}

export interface ActivityEntry {
  competitionName: string
  badge: string
  teamName: string
  university: string
  members: ActivityMember[]
  submissionLabel: string
  submissionDate: string
  actions: ActivityAction[]
}

export const ACTIVITY: ActivityEntry[] = [
  {
    competitionName: "Lomba 1",
    badge: "Lomba",
    teamName: "Tim pemburu ayam",
    university: "Universitas: UNIVERSITAS ISLAM BANDUNG",
    members: [
      { role: "Ketua:", name: "Muhammad John Doe", isLeader: true },
      { role: "Anggota 1:", name: "Siti Jane Doe Sumanto", isLeader: false },
    ],
    submissionLabel: "Submisi",
    submissionDate: "27 Oktober 2026",
    actions: [
      { label: "Line Contact Person", icon: "/images/bg-home/Line.png" },
      { label: "Grup Whatsapp", icon: "/images/bg-home/Whatsapp.png" },
      { label: "Channel Discord", icon: "/images/bg-home/Discord.png" },
    ],
  },
  {
    competitionName: "Lomba 2",
    badge: "Lomba",
    teamName: "Tim kedua",
    university: "Universitas: INSTITUT TEKNOLOGI BANDUNG",
    members: [{ role: "Ketua:", name: "Muhammad John Doe", isLeader: true }],
    submissionLabel: "Submisi",
    submissionDate: "27 Oktober 2026",
    actions: [
      { label: "Line Contact Person", icon: "/images/bg-home/Line.png" },
      { label: "Grup Whatsapp", icon: "/images/bg-home/Whatsapp.png" },
      { label: "Channel Discord", icon: "/images/bg-home/Discord.png" },
    ],
  },
]
