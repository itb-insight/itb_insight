// Pure rendering helpers for admin-written emails (no server imports: unit-testable).
//
// Supports formatted-string placeholders `{{variable_name}}` (case-insensitive) for use cases like:
//   - Winner announcements: {{nama}}, {{nama_tim}}, {{kompetisi}}, {{juara}}, {{gdrive_link}}
//   - Shadow account credentials: {{nama}}, {{email}}, {{password}}, {{team_uid}}
//
// Everything is substituted before HTML escaping, so neither the admin's text nor any recipient's
// profile/variable value can inject HTML or header control characters.

export const FALLBACK_NAME = 'Sahabat ITB Insight'

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export type TemplateVariables = Record<string, string | null | undefined>

export type RecipientContext = {
  name?: string | null
  email?: string | null
  variables?: TemplateVariables | null
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cleanSingleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
}

function displayName(name: string | null | undefined): string {
  return cleanSingleLine(name ?? '') || FALLBACK_NAME
}

function buildLookup(recipient: RecipientContext): Map<string, string> {
  const map = new Map<string, string>()

  if (recipient.variables) {
    for (const [key, raw] of Object.entries(recipient.variables)) {
      if (raw === undefined || raw === null) continue
      const cleaned = cleanSingleLine(String(raw))
      if (cleaned) map.set(key.toLowerCase(), cleaned)
    }
  }

  const name = map.get('nama') || map.get('name') || displayName(recipient.name)
  map.set('nama', name)
  map.set('name', name)

  if (recipient.email) {
    const email = cleanSingleLine(recipient.email)
    if (email && !map.has('email')) map.set('email', email)
  }

  // Common Indonesian/English aliases so admins can write either form.
  const aliasPairs: Array<[string, string]> = [
    ['nama_tim', 'team_name'],
    ['kode_tim', 'team_uid'],
    ['kompetisi', 'competition'],
    ['institusi', 'institution'],
    ['sekolah', 'institution'],
    ['link_sertifikat', 'gdrive_link'],
    ['sertifikat', 'gdrive_link'],
    ['peringkat', 'juara'],
  ]
  for (const [a, b] of aliasPairs) {
    if (map.has(a) && !map.has(b)) map.set(b, map.get(a)!)
    else if (map.has(b) && !map.has(a)) map.set(a, map.get(b)!)
  }

  return map
}

function substitute(template: string, lookup: Map<string, string>): string {
  return template.replace(PLACEHOLDER, (_, rawKey: string) => lookup.get(rawKey.toLowerCase()) ?? '')
}

/** Subject is a header: one line, no control characters. */
export function renderSubject(subject: string, recipient: RecipientContext | string | null | undefined): string {
  const ctx: RecipientContext = typeof recipient === 'string' || !recipient ? { name: recipient } : recipient
  return cleanSingleLine(substitute(subject, buildLookup(ctx)))
}

export function renderText(body: string, recipient: RecipientContext | string | null | undefined): string {
  const ctx: RecipientContext = typeof recipient === 'string' || !recipient ? { name: recipient } : recipient
  return substitute(body, buildLookup(ctx))
}

export function renderHtml(body: string, recipient: RecipientContext | string | null | undefined): string {
  const paragraphs = renderText(body, recipient)
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')

  return (
    '<!doctype html><html><body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px;border-radius:12px">' +
    paragraphs +
    '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">' +
    '<p style="margin:0;font-size:12px;color:#6b7280">Email ini dikirim oleh panitia ITB Insight.</p>' +
    '</div></body></html>'
  )
}

export type RenderedEmail = { subject: string; html: string; text: string }

export function renderEmail(
  content: { subject: string; body: string },
  recipient: RecipientContext = {},
): RenderedEmail {
  return {
    subject: renderSubject(content.subject, recipient),
    html: renderHtml(content.body, recipient),
    text: renderText(content.body, recipient),
  }
}
