import { createClient } from "@/lib/supabase/client"

export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: string; message: string } }

// Calls an authenticated API route with the current user's access token.
// Returns { needsAuth: true } when there is no session so the caller can redirect to /login.
export async function postWithAuth<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<{ needsAuth: true } | { needsAuth: false; ok: boolean; payload: ApiEnvelope<T> }> {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    return { needsAuth: true }
  }

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const payload = (await response.json()) as ApiEnvelope<T>
  return { needsAuth: false, ok: response.ok, payload }
}
