import { createServiceClient } from '@/lib/supabase/server'
import { type Partner, type PartnershipInquiry } from '@/lib/types/database'
import { recordAuditLog } from '@/lib/audit'

export async function getPartners(): Promise<Record<string, Partner[]>> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  const grouped: Record<string, Partner[]> = {
    diamond: [],
    gold: [],
    silver: [],
    bronze: [],
    media_partner: [],
  }

  if (error || !data) {
    return grouped
  }

  data.forEach((p) => {
    if (grouped[p.tier]) {
      grouped[p.tier].push(p as Partner)
    }
  })

  return grouped
}

export type SubmitInquiryParams = {
  cooperationType: 'sponsorship' | 'media_partner' | 'other'
  institutionName: string
  contactPerson: string
  jobTitle?: string | null
  industry?: string | null
  scale?: string | null
  email: string
  phone?: string | null
  description: string
}

export type SubmitInquiryResult =
  | {
      ok: true
      inquiry: PartnershipInquiry
    }
  | {
      ok: false
      code: 'INVALID_INPUT' | 'DATABASE_ERROR'
      message: string
    }

export async function submitPartnershipInquiry(params: SubmitInquiryParams): Promise<SubmitInquiryResult> {
  const { cooperationType, institutionName, contactPerson, jobTitle, industry, scale, email, phone, description } =
    params

  if (!institutionName || !contactPerson || !email || !description) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Mohon lengkapi seluruh field wajib.' }
  }

  if (!email.includes('@')) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Format email tidak valid.' }
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('partnership_inquiries')
    .insert({
      cooperation_type: cooperationType,
      institution_name: institutionName.trim(),
      contact_person: contactPerson.trim(),
      job_title: jobTitle?.trim() || null,
      industry: industry?.trim() || null,
      scale: scale?.trim() || null,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      description: description.trim(),
      status: 'pending',
    })
    .select()
    .single()

  if (error || !data) {
    return { ok: false, code: 'DATABASE_ERROR', message: 'Gagal mengirim pengajuan kemitraan.' }
  }

  await recordAuditLog({
    action: 'PARTNERSHIP_INQUIRY_SUBMITTED',
    targetTable: 'partnership_inquiries',
    recordId: data.id,
    metadata: { institutionName, cooperationType, email },
  })

  return { ok: true, inquiry: data as PartnershipInquiry }
}
