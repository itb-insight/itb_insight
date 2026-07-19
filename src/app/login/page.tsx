// src/app/login/page.tsx
import { Suspense } from "react"

import Login from "@/features/auth/Login/Login"

export default function LoginPage() {
  // Login reads `useSearchParams()`, which must sit under a Suspense boundary.
  return (
    <Suspense>
      <Login />
    </Suspense>
  )
}