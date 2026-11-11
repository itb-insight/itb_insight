import { createServiceClient } from '@/lib/supabase/server'
import { type AuditLog } from '@/lib/types/database'

export type RecordAuditParams = {
  userId?: string | null
  action: string
  targetTable?: string | null
  recordId?: string | null
  metadata?: Record<string, unknown>
  ipAddress?: string | null
}

export async function recordAuditLog(params: RecordAuditParams): Promise<AuditLog | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Audit Log Local]', params)
    }
    return null
  }

  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: params.userId || null,
        action: params.action,
        target_table: params.targetTable || null,
        record_id: params.recordId || null,
        metadata: params.metadata || {},
        ip_address: params.ipAddress || null,
      })
      .select()
      .single()

    if (error) {
      console.warn('[Audit Log Error]', error.message)
      return null
    }

    return data as AuditLog
  } catch (err) {
    console.warn('[Audit Log Exception]', err)
    return null
  }
}
