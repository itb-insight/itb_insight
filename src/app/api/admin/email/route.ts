// Admin simultaneous email campaigns (PRD ACC-06).
//  - GET: recent campaigns, or one campaign with its delivery counts and recent failures (?campaignId=...).
//  - POST: preview recipients (dryRun: true), queue + send a new campaign, or resume/retry an existing one.

import { after, type NextRequest } from 'next/server'

import { getScopedUser } from '@/lib/admin'
import { apiError, apiSuccess } from '@/lib/api-response'
import { recordAuditLog } from '@/lib/audit'
import { parseAudienceFilter } from '@/lib/email/audience'
import { createCampaign, getCampaignCounts, processCampaign, resumeCampaign } from '@/lib/email/campaigns'
import { resolveRecipients } from '@/lib/email/recipients'
import { isEmailConfigured } from '@/lib/email/resend'
import { renderEmail } from '@/lib/email/template'
import { parseTextFields, UUID_PATTERN } from '@/lib/input'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const SAMPLE_RECIPIENTS = 10
const RECENT_CAMPAIGNS = 20
const RECENT_FAILURES = 25

export async function GET(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) return apiError(auth.code, auth.message, auth.status)

  try {
    const db = createServiceClient()
    const campaignId = new URL(request.url).searchParams.get('campaignId')?.trim()

    if (campaignId) {
      if (!UUID_PATTERN.test(campaignId)) {
        return apiError('INVALID_INPUT', 'ID kampanye tidak valid.', 400)
      }

      const [{ data: campaign, error }, counts, { data: failures }] = await Promise.all([
        db.from('email_campaigns').select('*').eq('id', campaignId).maybeSingle(),
        getCampaignCounts(campaignId),
        db
          .from('email_outbox')
          .select('to_email, to_name, attempts, last_error, updated_at')
          .eq('campaign_id', campaignId)
          .eq('status', 'failed')
          .order('updated_at', { ascending: false })
          .limit(RECENT_FAILURES),
      ])

      if (error) return apiError('DATABASE_ERROR', 'Gagal memuat status kampanye.', 500)
      if (!campaign) return apiError('NOT_FOUND', 'Kampanye tidak ditemukan.', 404)

      return apiSuccess({
        configured: isEmailConfigured(),
        campaign,
        counts,
        failures: failures ?? [],
      })
    }

    const { data: campaigns, error } = await db
      .from('email_campaigns')
      .select('id, subject, filter, status, recipient_count, sent_count, failed_count, created_at, started_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(RECENT_CAMPAIGNS)

    if (error) return apiError('DATABASE_ERROR', 'Gagal memuat riwayat kampanye.', 500)

    return apiSuccess({
      configured: isEmailConfigured(),
      campaigns: campaigns ?? [],
    })
  } catch (err) {
    console.error('[API Admin Email GET Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat memuat data email.', 500)
  }
}

export async function POST(request: NextRequest) {
  const auth = await getScopedUser(request, ['admin'])
  if (!auth.ok) return apiError(auth.code, auth.message, auth.status)

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return apiError('INVALID_JSON', 'Payload JSON tidak valid.', 400)
  }

  const body = typeof rawBody === 'object' && rawBody !== null ? (rawBody as Record<string, unknown>) : {}
  const dryRun = body.dryRun === true

  try {
    // 1. Resume / retry an existing campaign
    if (body.campaignId !== undefined && body.campaignId !== null) {
      const rate = checkRateLimit(request, {
        scope: 'admin-email-send',
        identity: auth.user.id,
        limit: 10,
        windowMs: 10 * 60_000,
      })
      if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

      const fields = parseTextFields(body, { campaignId: 36 })
      if (!fields.ok || !fields.values.campaignId || !UUID_PATTERN.test(fields.values.campaignId)) {
        return apiError('INVALID_INPUT', 'ID kampanye tidak valid.', 400)
      }
      if (!isEmailConfigured()) {
        return apiError('EMAIL_NOT_CONFIGURED', 'Layanan email belum dikonfigurasi (RESEND_API_KEY / EMAIL_FROM).', 503)
      }

      const campaignId = fields.values.campaignId
      const retryFailed = body.retryFailed === true

      const { data: existing } = await createServiceClient()
        .from('email_campaigns')
        .select('id')
        .eq('id', campaignId)
        .maybeSingle()
      if (!existing) return apiError('NOT_FOUND', 'Kampanye tidak ditemukan.', 404)

      await recordAuditLog({
        userId: auth.user.id,
        action: 'EMAIL_CAMPAIGN_RESUMED',
        targetTable: 'email_campaigns',
        recordId: campaignId,
        metadata: { retryFailed },
        ipAddress: getClientIp(request),
      })

      after(async () => {
        await resumeCampaign(campaignId, retryFailed)
      })

      return apiSuccess({ campaignId, status: 'sending', retryFailed })
    }

    // 2. Preview or send a new campaign
    const rate = checkRateLimit(request, {
      scope: dryRun ? 'admin-email-preview' : 'admin-email-send',
      identity: auth.user.id,
      limit: dryRun ? 60 : 5,
      windowMs: 10 * 60_000,
    })
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSeconds)

    const text = parseTextFields(body, { subject: 150, body: 10_000 })
    if (!text.ok) {
      return apiError('INVALID_INPUT', `Field ${text.field} tidak valid atau terlalu panjang.`, 400)
    }
    const { subject, body: messageBody } = text.values
    if (!subject || !messageBody) {
      return apiError('INVALID_INPUT', 'Subjek dan isi email wajib diisi.', 400)
    }

    const parsedFilter = parseAudienceFilter(body.filter)
    if (!parsedFilter.ok) {
      return apiError('INVALID_FILTER', parsedFilter.message, 400)
    }

    const resolved = await resolveRecipients(parsedFilter.filter)
    if (!resolved.ok) {
      const status = resolved.code === 'DATABASE_ERROR' ? 500 : resolved.code === 'TOO_MANY_RECIPIENTS' ? 422 : 400
      return apiError(resolved.code, resolved.message, status)
    }

    if (dryRun) {
      const sample = resolved.recipients.slice(0, SAMPLE_RECIPIENTS)
      const rendered = renderEmail({ subject, body: messageBody }, { name: sample[0]?.name })
      return apiSuccess({
        dryRun: true,
        configured: isEmailConfigured(),
        recipientCount: resolved.recipients.length,
        sampleRecipients: sample,
        invalidManualEmails: resolved.invalidManualEmails,
        preview: rendered,
      })
    }

    if (!isEmailConfigured()) {
      return apiError('EMAIL_NOT_CONFIGURED', 'Layanan email belum dikonfigurasi (RESEND_API_KEY / EMAIL_FROM).', 503)
    }
    if (resolved.recipients.length === 0) {
      return apiError('NO_RECIPIENTS', 'Tidak ada penerima yang cocok dengan filter ini.', 422)
    }
    if (resolved.invalidManualEmails.length > 0) {
      return apiError(
        'INVALID_EMAIL',
        `Alamat email manual tidak valid: ${resolved.invalidManualEmails.slice(0, 5).join(', ')}`,
        400,
      )
    }

    const created = await createCampaign({
      createdBy: auth.user.id,
      content: { subject, body: messageBody },
      filter: parsedFilter.filter,
      recipients: resolved.recipients,
    })
    if (!created.ok) {
      return apiError('DATABASE_ERROR', created.message, 500)
    }

    await recordAuditLog({
      userId: auth.user.id,
      action: 'EMAIL_CAMPAIGN_QUEUED',
      targetTable: 'email_campaigns',
      recordId: created.campaignId,
      metadata: {
        subject,
        recipientCount: resolved.recipients.length,
        filter: parsedFilter.filter,
      },
      ipAddress: getClientIp(request),
    })

    after(async () => {
      await processCampaign(created.campaignId)
    })

    return apiSuccess(
      {
        campaignId: created.campaignId,
        status: 'sending',
        recipientCount: resolved.recipients.length,
      },
      202,
    )
  } catch (err) {
    console.error('[API Admin Email POST Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan internal saat memproses kampanye email.', 500)
  }
}
