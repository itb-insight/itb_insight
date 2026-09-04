// src/app/login/page.tsx
import { Suspense } from "react"

import LoginHifi from "@/features/auth/LoginHifi/LoginHifi"

export default function LoginPage() {
  // LoginHifi reads `useSearchParams()`, which must sit under a Suspense boundary.
  return (
    <Suspense>
      <LoginHifi />
    </Suspense>
  )
}