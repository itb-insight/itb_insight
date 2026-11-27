// Audience filter for admin email campaigns: type, validation and the safety rules.
// Pure (no server imports) so the API route and unit tests share one definition.

export const REGISTRATION_STATUSES = ['submitted', 'verified', 'rejected', 'withdrawn'] as const
export const PAYMENT_FILTERS = ['paid', 'pending', 'failed', 'expired', 'cancelled', 'unpaid'] as const
export const ROLE_A_VALUES = ['staff', 'stakeholder', 'sponsor_partner', 'company', 'admin'] as const
export const TEAM_SOURCES = ['web', 'form_import', 'test'] as const

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]
export type PaymentFilter = (typeof PAYMENT_FILTERS)[number]
export type RoleA = (typeof ROLE_A_VALUES)[number]
export type TeamSource = (typeof TEAM_SOURCES)[number]

/**
 * Structured per-recipient override: lets the admin pass formatted-string variables per person
 * (e.g. `{ email, name: "Tim A", variables: { juara: "Juara 1", gdrive_link: "https://..." } }`
 * or `{ email, variables: { password: "..." } }` for bulk-created shadow accounts).
 */
export type CustomRecipientInput = {
  email: string
  name?: string
  variables?: Record<string, string>
}

/**
 * Criteria are AND-combined; `manualEmails` and `customRecipients` are unioned on top.
 *  - competitionSlugs / registrationStatus / paymentStatus / teamSources: registrants (individuals,
 *    every member of a registered team, and shadow slots via `claim_email` when `includeShadowSlots`
 *    is true or `shadowOnly` is true).
 *  - shadowOnly: true = only unclaimed shadow slots (`competition_team_members` with `user_id IS NULL`
 *    and a `claim_email`), useful for sending initial login credentials to bulk-imported participants.
 *  - checkedIn: true = attended the gate, false = registered an account but has not.
 *  - roleA: profiles.role_a (staff, sponsor, ...).
 *  - allUsers: explicit opt-in to "every account"; never implied by an empty filter.
 */
export type AudienceFilter = {
  allUsers?: boolean
  competitionSlugs?: string[]
  registrationStatus?: RegistrationStatus[]
  paymentStatus?: PaymentFilter[]
  teamSources?: TeamSource[]
  includeShadowSlots?: boolean
  shadowOnly?: boolean
  checkedIn?: boolean
  roleA?: RoleA[]
  manualEmails?: string[]
  customRecipients?: CustomRecipientInput[]
}

export const MAX_MANUAL_EMAILS = 500
export const MAX_CUSTOM_RECIPIENTS = 1000
export const MAX_VARIABLES_PER_RECIPIENT = 20
export const MAX_VARIABLE_KEY_LENGTH = 40
export const MAX_VARIABLE_VALUE_LENGTH = 500
export const MAX_SLUGS = 20

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
const VARIABLE_KEY_PATTERN = /^[a-zA-Z0-9_]{1,40}$/

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
      filter.teamSources?.length ||
      filter.shadowOnly ||
      filter.checkedIn !== undefined ||
      filter.roleA?.length ||
      filter.manualEmails?.length ||
      filter.customRecipients?.length,
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

function parseCustomRecipients(
  raw: unknown,
): { ok: true; values: CustomRecipientInput[] | undefined } | { ok: false; message: string } {
  if (raw === undefined || raw === null) return { ok: true, values: undefined }
  if (!Array.isArray(raw) || raw.length > MAX_CUSTOM_RECIPIENTS) {
    return { ok: false, message: `Filter customRecipients tidak valid (maksimal ${MAX_CUSTOM_RECIPIENTS}).` }
  }

  const out: CustomRecipientInput[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return { ok: false, message: 'Setiap item customRecipients harus berupa objek.' }
    }
    const rec = item as Record<string, unknown>
    if (typeof rec.email !== 'string' || !rec.email.trim() || rec.email.trim().length > 254) {
      return { ok: false, message: 'Setiap item customRecipients wajib memiliki email string.' }
    }

    let name: string | undefined
    if (rec.name !== undefined && rec.name !== null) {
      if (typeof rec.name !== 'string' || rec.name.trim().length > 150) {
        return { ok: false, message: 'Field name pada customRecipients tidak valid.' }
      }
      if (rec.name.trim()) name = rec.name.trim()
    }

    let variables: Record<string, string> | undefined
    if (rec.variables !== undefined && rec.variables !== null) {
      if (typeof rec.variables !== 'object' || Array.isArray(rec.variables)) {
        return { ok: false, message: 'Field variables pada customRecipients harus berupa objek.' }
      }
      const entries = Object.entries(rec.variables as Record<string, unknown>)
      if (entries.length > MAX_VARIABLES_PER_RECIPIENT) {
        return { ok: false, message: `Variabel per penerima maksimal ${MAX_VARIABLES_PER_RECIPIENT}.` }
      }
      variables = {}
      for (const [k, v] of entries) {
        if (!VARIABLE_KEY_PATTERN.test(k) || k.length > MAX_VARIABLE_KEY_LENGTH) {
          return { ok: false, message: `Nama variabel "${k}" tidak valid (gunakan huruf, angka, atau underscore).` }
        }
        if (typeof v !== 'string' || v.length > MAX_VARIABLE_VALUE_LENGTH) {
          return { ok: false, message: `Nilai variabel "${k}" harus berupa string (maks ${MAX_VARIABLE_VALUE_LENGTH} karakter).` }
        }
        variables[k.toLowerCase()] = v.trim()
      }
    }

    out.push({
      email: rec.email.trim(),
      ...(name ? { name } : {}),
      ...(variables && Object.keys(variables).length ? { variables } : {}),
    })
  }

  return { ok: true, values: out.length ? out : undefined }
}

/** Validates untrusted JSON into an AudienceFilter. Unknown keys are ignored. */
export function parseAudienceFilter(raw: unknown): ParseResult {
  const source = typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null
  if (!source) return { ok: false, message: 'Filter penerima wajib diisi.' }

  const filter: AudienceFilter = {}

  for (const boolField of ['allUsers', 'includeShadowSlots', 'shadowOnly'] as const) {
    if (source[boolField] !== undefined && source[boolField] !== null) {
      if (typeof source[boolField] !== 'boolean') {
        return { ok: false, message: `Filter ${boolField} tidak valid.` }
      }
      if (source[boolField]) filter[boolField] = true
    }
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

  const teamSources = stringList(source.teamSources, 'teamSources', TEAM_SOURCES)
  if (!teamSources.ok) return teamSources
  filter.teamSources = teamSources.values

  const roles = stringList(source.roleA, 'roleA', ROLE_A_VALUES)
  if (!roles.ok) return roles
  filter.roleA = roles.values

  const manual = stringList<string>(source.manualEmails, 'manualEmails', undefined, MAX_MANUAL_EMAILS)
  if (!manual.ok) return manual
  filter.manualEmails = manual.values

  const custom = parseCustomRecipients(source.customRecipients)
  if (!custom.ok) return custom
  filter.customRecipients = custom.values

  for (const key of Object.keys(filter) as (keyof AudienceFilter)[]) {
    if (filter[key] === undefined) delete filter[key]
  }

  if (!hasCriteria(filter)) {
    return { ok: false, message: 'Pilih minimal satu filter penerima, atau aktifkan allUsers secara eksplisit.' }
  }

  return { ok: true, filter }
}
