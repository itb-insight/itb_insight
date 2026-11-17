import { apiError } from '@/lib/api-response'

// Disabled until the partnership form ships in the UI. Before re-enabling: validate the body with
// zod (types + max lengths), add a rate limit and Turnstile (see src/app/api/feedback/[slug]),
// then call submitPartnershipInquiry from src/lib/partners.ts.
export async function POST() {
  return apiError('NOT_AVAILABLE', 'Formulir kemitraan belum dibuka.', 404)
}
