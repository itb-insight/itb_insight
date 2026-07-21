// Competition catalog. In the `web` repo this was Sanity-backed with a hardcoded fallback;
// for the MVP we dropped Sanity and keep only the hardcoded list. These three must stay in
// sync with the seed rows in supabase/migrations/0002_mvp_schema.sql (matched by slug).

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
}

const competitions: CompetitionSummary[] = [
  {
    _id: 'robotics-challenge',
    title: 'Robotika Challenge',
    slug: { current: 'robotika-challenge' },
    description: 'Kompetisi robotika untuk tim mahasiswa yang ingin membangun prototipe cerdas dan kompetitif.',
    category: 'robotika',
    registrationType: 'team',
    teamUidPrefix: 'RBT',
    teamMin: 2,
    teamMax: 4,
    requirements: ['Kartu mahasiswa', 'Proposal tim', 'Berkas identitas anggota'],
  },
  {
    _id: 'hackathon-innovation-sprint',
    title: 'Hackathon Innovation Sprint',
    slug: { current: 'hackathon-innovation-sprint' },
    description: 'Sprint pengembangan produk digital dengan fokus pada solusi nyata untuk kampus dan industri.',
    category: 'hackathon',
    registrationType: 'team',
    teamUidPrefix: 'HCK',
    teamMin: 3,
    teamMax: 5,
    requirements: ['Laptop pribadi', 'GitHub account', 'Pitch deck awal'],
  },
  {
    _id: 'paper-competition',
    title: 'Paper Competition',
    slug: { current: 'paper-competition' },
    description: 'Kompetisi penulisan karya ilmiah individual untuk ide teknologi dan inovasi digital.',
    category: 'paper',
    registrationType: 'individual',
    teamMin: 1,
    teamMax: 1,
    requirements: ['Kartu mahasiswa', 'Abstrak karya', 'Berkas identitas peserta'],
  },
]

function normalizeCompetition(competition: CompetitionSummary): CompetitionSummary {
  const registrationType = competition.registrationType || ((competition.teamMax || 1) > 1 ? 'team' : 'individual')

  return {
    ...competition,
    registrationType,
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
