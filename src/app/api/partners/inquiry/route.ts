import { type NextRequest } from 'next/server'

import { apiError, apiSuccess } from '@/lib/api-response'
import { submitPartnershipInquiry } from '@/lib/partners'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cooperationType, institutionName, contactPerson, jobTitle, industry, scale, email, phone, description } =
      body

    if (!institutionName || !contactPerson || !email || !description) {
      return apiError(
        'INVALID_INPUT',
        'Parameter institutionName, contactPerson, email, dan description wajib diisi.',
        400,
      )
    }

    const result = await submitPartnershipInquiry({
      cooperationType: cooperationType || 'sponsorship',
      institutionName,
      contactPerson,
      jobTitle,
      industry,
      scale,
      email,
      phone,
      description,
    })

    if (!result.ok) {
      return apiError(result.code, result.message, 400)
    }

    return apiSuccess({
      message: 'Pengajuan kemitraan Anda telah diterima. Tim kami akan segera menghubungi Anda.',
      inquiryId: result.inquiry.id,
    })
  } catch (err) {
    console.error('[API Partnership Inquiry Error]', err)
    return apiError('SERVER_ERROR', 'Terjadi kesalahan saat memproses formulir kemitraan.', 500)
  }
}
