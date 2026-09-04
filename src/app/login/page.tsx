// src/app/login/page.tsx
import { Suspense } from "react"

import LoginHifi from "@/features/auth/LoginHifi/LoginHifi"
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi"

export default function LoginPage() {
  // LoginHifi reads `useSearchParams()`, which must sit under a Suspense boundary.
  return (
    <Suspense>
      <NavbarHifi />
      <LoginHifi />
      <FooterHifi />
    </Suspense>
  )
}