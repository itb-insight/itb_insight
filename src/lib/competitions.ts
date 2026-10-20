// Registration catalog. SLUGS MUST MATCH the public pages in
// src/features/competition/data.ts (the 4 real competitions) and are matched to DB rows by slug
// (rows are auto-created by findOrCreateCompetitionRow in src/lib/registrations.ts).
//
// TODO(competition team): the values marked TODO are PLACEHOLDERS and must be confirmed by the
// Competition division before registration opens:
//   - registrationType / teamMin / teamMax
//   - registrationFee (IDR). `null` = not finalized -> payment creation is BLOCKED (FEE_NOT_CONFIGURED)
//   - regOpen / regClose (left undefined = always open)

export type CompetitionSummary = {
  _id: string
  title: string
  slug: { current: string }
  description?: unknown
  category?: string
  registrationType: 'individual' | 'team'
  teamUidPrefix?: string
  teamMin?: number
  teamMax?: number
  regOpen?: string
  regClose?: string
  requirements?: string[]
  guideBookUrl?: string
  registrationFee?: number | null
}

const competitions: CompetitionSummary[] = [
  {
    _id: 'safety-and-rescue-robot-competition',
    title: 'Safety and Rescue Robot Competition',
    slug: { current: 'safety-and-rescue-robot-competition' },
    description: 'Lomba robot Search and Rescue (SAR) nasional bagi mahasiswa/i di Indonesia.',
    category: 'robotika',
    registrationType: 'team', // TODO confirm
    teamUidPrefix: 'SAR',
    teamMin: 2, // TODO confirm
    teamMax: 4, // TODO confirm
    requirements: ['Kartu mahasiswa', 'Sketsa robot', 'Bukti follow Instagram', 'Bukti share broadcast'],
    registrationFee: null, // TODO confirm (IDR)
  },
  {
    _id: 'microdrone-obstacle-race',
    title: 'Microdrone Obstacle Race',
    slug: { current: 'microdrone-obstacle-race' },
    description: 'Balap drone obstacle nasional bagi mahasiswa/i di Indonesia.',
    category: 'drone',
    registrationType: 'team', // TODO confirm
    teamUidPrefix: 'MOR',
    teamMin: 1, // TODO confirm
    teamMax: 3, // TODO confirm
    requirements: ['Kartu mahasiswa', 'Bukti follow Instagram', 'Bukti share broadcast'],
    registrationFee: null, // TODO confirm (IDR)
  },
  {
    _id: 'business-plan-competition',
    title: 'Business Plan Competition',
    slug: { current: 'business-plan-competition' },
    description: 'Kompetisi inovasi bisnis nasional bertema Artificial Intelligence.',
    category: 'bisnis',
    registrationType: 'team', // TODO confirm
    teamUidPrefix: 'BPC',
    teamMin: 2, // TODO confirm
    teamMax: 3, // TODO confirm
    requirements: ['Kartu identitas (mahasiswa/siswa)', 'Bukti follow Instagram', 'Bukti share broadcast'],
    registrationFee: null, // TODO confirm (IDR)
  },
  {
    _id: 'olimpiade-engineering',
    title: 'Olimpiade Engineering',
    slug: { current: 'olimpiade-engineering' },
    description: 'Olimpiade engineering nasional untuk siswa SMA/SMK/MA sederajat.',
    category: 'olimpiade',
    registrationType: 'individual', // TODO confirm
    teamMin: 1,
    teamMax: 1,
    requirements: ['Kartu pelajar', 'Bukti follow Instagram', 'Bukti share broadcast'],
    registrationFee: null, // TODO confirm (IDR)
  },
]

function normalizeCompetition(competition: CompetitionSummary): CompetitionSummary {
  const registrationType = competition.registrationType || ((competition.teamMax || 1) > 1 ? 'team' : 'individual')

  return {
    ...competition,
    registrationType,
    registrationFee: competition.registrationFee ?? null,
    teamMin: registrationType === 'individual' ? 1 : competition.teamMin || 1,
    teamMax: registrationType === 'individual' ? 1 : competition.teamMax || 5,
  }
}

export async function getCompetitions() {
  return competitions.map(normalizeCompetition)
}

export async function getCompetitionBySlug(slug: string) {
  const match = competitions.find((competition) => competition.slug.current === slug) || null
  return match ? normalizeCompetition(match) : null
}

// Server-side fee in IDR, or null when the competition's fee has not been finalized (CMP-14).
export async function getCompetitionFee(slug: string): Promise<number | null> {
  const competition = await getCompetitionBySlug(slug)
  const fee = competition?.registrationFee
  return typeof fee === 'number' && Number.isInteger(fee) && fee > 0 ? fee : null
}
