// Pure rendering helpers for admin-written emails (no server imports: unit-testable).
//
// The admin writes plain text. It is HTML-escaped before it goes into the HTML part, so neither
// the admin's text nor a recipient's profile name can inject markup. The only variable is {{nama}}.

export const FALLBACK_NAME = 'Sahabat ITB Insight'

const VARIABLE = /\{\{\s*nama\s*\}\}/gi

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function displayName(name: string | null | undefined): string {
  // Control characters (incl. CR/LF) never belong in a name; stripping them keeps headers safe.
  const cleaned = (name ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || FALLBACK_NAME
}

/** Subject is a header: one line, no control characters. */
export function renderSubject(subject: string, name: string | null | undefined): string {
  return subject.replace(VARIABLE, () => displayName(name)).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function renderText(body: string, name: string | null | undefined): string {
  return body.replace(VARIABLE, () => displayName(name))
}

export function renderHtml(body: string, name: string | null | undefined): string {
  const paragraphs = renderText(body, name)
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
  recipient: { name?: string | null },
): RenderedEmail {
  return {
    subject: renderSubject(content.subject, recipient.name),
    html: renderHtml(content.body, recipient.name),
    text: renderText(content.body, recipient.name),
  }
}
