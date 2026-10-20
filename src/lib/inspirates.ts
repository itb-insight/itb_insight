import { createServiceClient } from '@/lib/supabase/server'
import { type InspiratesRecord } from '@/lib/types/database'
import { recordAuditLog } from '@/lib/audit'

export type CreateInspiratesRecordParams = {
  schoolName: string
  activityDate: string
  participantCount: number
  disseminationMembers: string[]
  notes?: string | null
  createdBy?: string | null
}

export async function createInspiratesRecord(params: CreateInspiratesRecordParams) {
  const { schoolName, activityDate, participantCount, disseminationMembers, notes, createdBy } = params

  if (!schoolName || participantCount < 0) {
    return { ok: false as const, message: 'Data tidak lengkap atau jumlah peserta tidak valid.' }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('inspirates_records')
    .insert({
      school_name: schoolName.trim(),
      activity_date: activityDate,
      participant_count: participantCount,
      dissemination_members: disseminationMembers,
      notes: notes?.trim() || null,
      created_by: createdBy || null,
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false as const, message: 'Gagal menyimpan rekap Inspirates.' }
  }

  await recordAuditLog({
    userId: createdBy,
    action: 'INSPIRATES_RECORD_CREATED',
    targetTable: 'inspirates_records',
    recordId: data.id,
    metadata: { schoolName, participantCount },
  })

  return { ok: true as const, record: data as InspiratesRecord }
}

export async function getInspiratesRecords() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('inspirates_records')
    .select('*')
    .order('activity_date', { ascending: false })

  if (error || !data) {
    return { records: [], totalSchools: 0, totalParticipants: 0 }
  }

  const totalParticipants = data.reduce((acc, r) => acc + (r.participant_count || 0), 0)
  const uniqueSchools = new Set(data.map((r) => r.school_name.toLowerCase())).size

  return {
    records: data as InspiratesRecord[],
    totalSchools: uniqueSchools,
    totalParticipants,
  }
}
