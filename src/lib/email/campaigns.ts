// Email campaigns: queue one outbox row per recipient, then deliver in batches.
//
// Delivery rules (docs/EMAIL.md):
//  - The outbox row, not the HTTP call, is the record of what happened. A send failure never
//    touches registrations/payments; it only leaves the row pending (retry) or failed.
//  - Rows are claimed with `update ... where status = 'pending'`, so two workers (a retry
//    clicked while the first run is still going) never send the same row twice.
//  - Each batch carries an Idempotency-Key derived from its row ids, so a request retried after
//    a timeout cannot double-send either.
//  - A permanently invalid batch (400/422) is bisected until the bad address is isolated.

import 'server-only'

import { createHash } from 'node:crypto'

import { createServiceClient } from '@/lib/supabase/server'

import { type AudienceFilter } from './audience'
import { type Recipient } from './recipients'
import { BATCH_SIZE, sendBatch, type BatchResult } from './resend'
import { renderEmail } from './template'

export const MAX_ATTEMPTS = 4
const CONCURRENCY = 2
const INSERT_CHUNK = 500
const STALE_SENDING_MS = 10 * 60_000
const DEFAULT_BUDGET_MS = 240_000
const MAX_BACKOFF_SECONDS = 900
const MAX_IDLE_WAIT_MS = 60_000

type Row = Record<string, unknown>

export type CampaignContent = { subject: string; body: string }

export type CampaignCounts = { pending: number; sending: number; sent: number; failed: number }

function chunked<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

// Never persist plaintext passwords inside email_campaigns.filter audit trail; outbox row
// variables hold the value needed to render the message and are cleared after delivery.
function redactFilterForAudit(filter: AudienceFilter): AudienceFilter {
  if (!filter.customRecipients?.length) return filter
  return {
    ...filter,
    customRecipients: filter.customRecipients.map((item) => {
      if (!item.variables) return item
      const redacted: Record<string, string> = {}
      for (const [k, v] of Object.entries(item.variables)) {
        redacted[k] = /pass|secret|token|pwd/i.test(k) ? '[REDACTED]' : v
      }
      return { ...item, variables: redacted }
    }),
  }
}

export async function createCampaign(params: {
  createdBy: string
  content: CampaignContent
  filter: AudienceFilter
  recipients: Recipient[]
}): Promise<{ ok: true; campaignId: string } | { ok: false; message: string }> {
  const db = createServiceClient()

  const { data: campaign, error } = await db
    .from('email_campaigns')
    .insert({
      created_by: params.createdBy,
      subject: params.content.subject,
      body: params.content.body,
      filter: redactFilterForAudit(params.filter),
      status: 'queued',
      recipient_count: params.recipients.length,
    })
    .select('id')
    .single()

  if (error || !campaign) return { ok: false, message: 'Gagal membuat kampanye email.' }
  const campaignId = campaign.id as string

  for (const group of chunked(params.recipients, INSERT_CHUNK)) {
    const { error: insertError } = await db.from('email_outbox').insert(
      group.map((recipient) => ({
        campaign_id: campaignId,
        user_id: recipient.userId,
        to_email: recipient.email,
        to_name: recipient.name,
        variables: recipient.variables ?? {},
        idempotency_key: `${campaignId}:${recipient.email}`,
      })),
    )
    if (insertError) {
      // Do not leave a half-queued campaign that a later "resume" would send partially.
      await db.from('email_campaigns').delete().eq('id', campaignId)
      return { ok: false, message: 'Gagal mengantrekan penerima email.' }
    }
  }

  return { ok: true, campaignId }
}

export async function getCampaignCounts(campaignId: string): Promise<CampaignCounts> {
  const db = createServiceClient()
  const count = async (status: string) => {
    const { count: total } = await db
      .from('email_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', status)
    return total ?? 0
  }
  const [pending, sending, sent, failed] = await Promise.all([count('pending'), count('sending'), count('sent'), count('failed')])
  return { pending, sending, sent, failed }
}

async function finalizeCampaign(campaignId: string): Promise<CampaignCounts> {
  const db = createServiceClient()
  const counts = await getCampaignCounts(campaignId)
  const open = counts.pending + counts.sending
  const status = open > 0 ? 'sending' : counts.failed === 0 ? 'completed' : counts.sent === 0 ? 'failed' : 'partial'

  await db
    .from('email_campaigns')
    .update({
      status,
      sent_count: counts.sent,
      failed_count: counts.failed,
      completed_at: open > 0 ? null : new Date().toISOString(),
    })
    .eq('id', campaignId)

  return counts
}

type Claimed = {
  id: string
  to_email: string
  to_name: string | null
  variables: Record<string, string> | null
  attempts: number
}

async function claimRows(campaignId: string, limit: number): Promise<Claimed[]> {
  const db = createServiceClient()
  const { data: due } = await db
    .from('email_outbox')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .lte('next_attempt_at', new Date().toISOString())
    .order('created_at')
    .limit(limit)

  const ids = ((due as Row[] | null) ?? []).map((row) => row.id as string)
  if (ids.length === 0) return []

  // Only rows still pending are returned: whoever flips them first owns them.
  const { data: claimed } = await db
    .from('email_outbox')
    .update({ status: 'sending' })
    .in('id', ids)
    .eq('status', 'pending')
    .select('id, to_email, to_name, variables, attempts')

  return ((claimed as Claimed[] | null) ?? []).map((row) => ({ ...row, attempts: Number(row.attempts) || 0 }))
}

async function requeueStale(campaignId: string) {
  const db = createServiceClient()
  await db
    .from('email_outbox')
    .update({ status: 'pending' })
    .eq('campaign_id', campaignId)
    .eq('status', 'sending')
    .lt('updated_at', new Date(Date.now() - STALE_SENDING_MS).toISOString())
}

function scrubSentVariables(variables: Record<string, string> | null): Record<string, string> {
  if (!variables) return {}
  const cleaned: Record<string, string> = {}
  for (const [k, v] of Object.entries(variables)) {
    cleaned[k] = /pass|secret|token|pwd/i.test(k) ? '[REDACTED]' : v
  }
  return cleaned
}

async function markSent(row: Claimed, providerId: string | null) {
  await createServiceClient()
    .from('email_outbox')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      provider_message_id: providerId,
      last_error: null,
      variables: scrubSentVariables(row.variables),
    })
    .eq('id', row.id)
}

async function markFailure(rows: Claimed[], failure: Extract<BatchResult, { ok: false }>) {
  const db = createServiceClient()
  await Promise.all(
    rows.map((row) => {
      const attempts = row.attempts + 1
      if (failure.permanent || attempts >= MAX_ATTEMPTS) {
        return db.from('email_outbox').update({ status: 'failed', attempts, last_error: failure.message }).eq('id', row.id)
      }
      const delay = Math.min(failure.retryAfterSeconds ?? 60 * 2 ** (attempts - 1), MAX_BACKOFF_SECONDS)
      return db
        .from('email_outbox')
        .update({
          status: 'pending',
          attempts,
          last_error: failure.message,
          next_attempt_at: new Date(Date.now() + delay * 1000).toISOString(),
        })
        .eq('id', row.id)
    }),
  )
}

async function deliver(rows: Claimed[], content: CampaignContent): Promise<void> {
  if (rows.length === 0) return

  const key = `outbox-${createHash('sha256')
    .update(rows.map((row) => row.id).join(','))
    .digest('hex')}`
  const result = await sendBatch(
    rows.map((row) => ({
      to: row.to_email,
      ...renderEmail(content, {
        name: row.to_name,
        email: row.to_email,
        variables: row.variables ?? undefined,
      }),
    })),
    key,
  )

  if (result.ok) {
    await Promise.all(rows.map((row, index) => markSent(row, result.ids[index] ?? null)))
    return
  }

  if (result.permanent && rows.length > 1) {
    const middle = Math.ceil(rows.length / 2)
    await deliver(rows.slice(0, middle), content)
    await deliver(rows.slice(middle), content)
    return
  }

  await markFailure(rows, result)
}

async function runPool<T>(items: T[], concurrency: number, work: (item: T) => Promise<void>) {
  let next = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await work(item)
    }
  })
  await Promise.all(workers)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function nextRetryDelayMs(campaignId: string): Promise<number | null> {
  const { data } = await createServiceClient()
    .from('email_outbox')
    .select('next_attempt_at')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('next_attempt_at')
    .limit(1)
  const first = ((data as Row[] | null) ?? [])[0]
  if (!first) return null
  return Math.max(0, new Date(first.next_attempt_at as string).getTime() - Date.now())
}

/**
 * Delivers everything due for a campaign within `budgetMs`. Rows waiting on a retry that does not
 * fit the budget stay pending; call it again (resumeCampaign) to continue. Safe to run twice.
 */
export async function processCampaign(
  campaignId: string,
  options: { budgetMs?: number } = {},
): Promise<CampaignCounts | null> {
  const db = createServiceClient()
  const { data: campaign } = await db
    .from('email_campaigns')
    .select('id, subject, body, started_at')
    .eq('id', campaignId)
    .maybeSingle()
  if (!campaign) return null

  const content: CampaignContent = { subject: campaign.subject as string, body: campaign.body as string }
  const deadline = Date.now() + (options.budgetMs ?? DEFAULT_BUDGET_MS)

  await db
    .from('email_campaigns')
    .update({
      status: 'sending',
      completed_at: null,
      ...(campaign.started_at ? {} : { started_at: new Date().toISOString() }),
    })
    .eq('id', campaignId)
  await requeueStale(campaignId)

  try {
    while (Date.now() < deadline) {
      const claimed = await claimRows(campaignId, BATCH_SIZE * CONCURRENCY)

      if (claimed.length === 0) {
        const wait = await nextRetryDelayMs(campaignId)
        if (wait === null || wait > MAX_IDLE_WAIT_MS || Date.now() + wait >= deadline) break
        await sleep(wait + 50)
        continue
      }

      await runPool(chunked(claimed, BATCH_SIZE), CONCURRENCY, (batch) => deliver(batch, content))
    }
  } catch (err) {
    // Rows already claimed stay 'sending' and are re-queued as stale on the next run.
    console.error('[Email Campaign Error]', err)
  }

  return finalizeCampaign(campaignId)
}

/** Continue a campaign; optionally put permanently failed rows back in the queue first. */
export async function resumeCampaign(campaignId: string, retryFailed: boolean): Promise<CampaignCounts | null> {
  if (retryFailed) {
    await createServiceClient()
      .from('email_outbox')
      .update({ status: 'pending', attempts: 0, last_error: null, next_attempt_at: new Date().toISOString() })
      .eq('campaign_id', campaignId)
      .eq('status', 'failed')
  }
  return processCampaign(campaignId)
}
