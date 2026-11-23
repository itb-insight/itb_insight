// Audience filter for admin email campaigns: type, validation and the safety rules.
// Pure (no server imports) so the API route and unit tests share one definition.

export const REGISTRATION_STATUSES = ['submitted', 'verified', 'rejected'] as const
export const PAYMENT_FILTERS = ['paid', 'pending', 'failed', 'expired', 'cancelled', 'unpaid'] as const
export const ROLE_A_VALUES = ['staff', 'stakeholder', 'sponsor_partner', 'company', 'admin'] as const

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]
export type PaymentFilter = (typeof PAYMENT_FILTERS)[number]
export type RoleA = (typeof ROLE_A_VALUES)[number]

/**
 * Criteria are AND-combined; `manualEmails` is added on top (union).
 *  - competitionSlugs / registrationStatus / paymentStatus: registrants (individuals AND every
 *    member of a registered team). `paymentStatus: 'unpaid'` = registration has no paid payment.
 *  - checkedIn: true = attended the gate, false = registered an account but has not.
 *  - roleA: profiles.role_a (staff, sponsor, ...).
 *  - allUsers: explicit opt-in to "every account"; never implied by an empty filter.
 */
export type AudienceFilter = {
  allUsers?: boolean
  competitionSlugs?: string[]
  registrationStatus?: RegistrationStatus[]
  paymentStatus?: PaymentFilter[]
  checkedIn?: boolean
  roleA?: RoleA[]
  manualEmails?: string[]
}

export const MAX_MANUAL_EMAILS = 500
export const MAX_SLUGS = 20

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value)
}

export function hasCriteria(filter: AudienceFilter): boolean {
  return Boolean(
    filter.allUsers ||
      filter.competitionSlugs?.length ||
      filter.registrationStatus?.length ||
      filter.paymentStatus?.length ||
      filter.checkedIn !== undefined ||
      filter.roleA?.length ||
      filter.manualEmails?.length,
  )
}

type ParseResult = { ok: true; filter: AudienceFilter } | { ok: false; message: string }

function stringList<T extends string>(
  raw: unknown,
  field: string,
  allowed?: readonly T[],
  max = 50,
): { ok: true; values: T[] | undefined } | { ok: false; message: string } {
  if (raw === undefined || raw === null) return { ok: true, values: undefined }
  if (!Array.isArray(raw) || raw.length > max || raw.some((item) => typeof item !== 'string')) {
    return { ok: false, message: `Filter ${field} tidak valid.` }
  }
  const values = [...new Set((raw as string[]).map((item) => item.trim()).filter(Boolean))] as T[]
  if (allowed && values.some((value) => !allowed.includes(value))) {
    return { ok: false, message: `Filter ${field} berisi nilai yang tidak dikenal.` }
  }
  return { ok: true, values: values.length ? values : undefined }
}

/** Validates untrusted JSON into an AudienceFilter. Unknown keys are ignored. */
export function parseAudienceFilter(raw: unknown): ParseResult {
  const source = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null
  if (!source) return { ok: false, message: 'Filter penerima wajib diisi.' }

  const filter: AudienceFilter = {}

  if (source.allUsers !== undefined) {
    if (typeof source.allUsers !== 'boolean') return { ok: false, message: 'Filter allUsers tidak valid.' }
    if (source.allUsers) filter.allUsers = true
  }
  if (source.checkedIn !== undefined && source.checkedIn !== null) {
    if (typeof source.checkedIn !== 'boolean') return { ok: false, message: 'Filter checkedIn tidak valid.' }
    filter.checkedIn = source.checkedIn
  }

  const slugs = stringList<string>(source.competitionSlugs, 'competitionSlugs', undefined, MAX_SLUGS)
  if (!slugs.ok) return slugs
  if (slugs.values?.some((slug) => !/^[a-z0-9-]{1,80}$/.test(slug))) {
    return { ok: false, message: 'Filter competitionSlugs tidak valid.' }
  }
  filter.competitionSlugs = slugs.values

  const statuses = stringList(source.registrationStatus, 'registrationStatus', REGISTRATION_STATUSES)
  if (!statuses.ok) return statuses
  filter.registrationStatus = statuses.values

  const payments = stringList(source.paymentStatus, 'paymentStatus', PAYMENT_FILTERS)
  if (!payments.ok) return payments
  filter.paymentStatus = payments.values

  const roles = stringList(source.roleA, 'roleA', ROLE_A_VALUES)
  if (!roles.ok) return roles
  filter.roleA = roles.values

  const manual = stringList<string>(source.manualEmails, 'manualEmails', undefined, MAX_MANUAL_EMAILS)
  if (!manual.ok) return manual
  filter.manualEmails = manual.values

  for (const key of Object.keys(filter) as (keyof AudienceFilter)[]) {
    if (filter[key] === undefined) delete filter[key]
  }

  if (!hasCriteria(filter)) {
    return { ok: false, message: 'Pilih minimal satu filter penerima, atau aktifkan allUsers secara eksplisit.' }
  }

  return { ok: true, filter }
}
