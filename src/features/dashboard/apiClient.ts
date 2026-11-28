import { createClient } from "@/lib/supabase/client"

export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: string; message: string } }

// Calls an authenticated API route with the current user's access token.
// Returns { needsAuth: true } when there is no session so the caller can redirect to /login.
// `serverDate` is the response's Date header (ms), used by the offline queue to correct the
// phone's clock. `signal` aborts the request (timeouts).
export async function postWithAuth<T>(
  path: string,
  body: Record<string, unknown>,
  options: { signal?: AbortSignal } = {},
): Promise<{ needsAuth: true } | { needsAuth: false; ok: boolean; status: number; serverDate: number | null; payload: ApiEnvelope<T> }> {
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
    signal: options.signal,
  })

  const payload = (await response.json()) as ApiEnvelope<T>
  const date = Date.parse(response.headers.get("date") ?? "")
  return { needsAuth: false, ok: response.ok, status: response.status, serverDate: Number.isFinite(date) ? date : null, payload }
}

// Same contract as postWithAuth, for GET routes.
export async function getWithAuth<T>(
  path: string,
): Promise<{ needsAuth: true } | { needsAuth: false; ok: boolean; payload: ApiEnvelope<T> }> {
  const supabase = createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    return { needsAuth: true }
  }

  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  const payload = (await response.json()) as ApiEnvelope<T>
  return { needsAuth: false, ok: response.ok, payload }
}
