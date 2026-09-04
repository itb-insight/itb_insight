// src/app/signup/page.tsx
import SignUpHifi from "@/features/auth/SignUpHifi/SignUpHifi"
import NavbarHifi from "@/shared/components/Navbar/NavbarHifi/NavbarHifi"
import FooterHifi from "@/shared/components/Footer/FooterHifi/FooterHifi"

export default function SignUpPage() {
  return (
    <>
      <NavbarHifi />
      <SignUpHifi />
      <FooterHifi />
    </>
  )
}