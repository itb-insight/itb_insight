// Account sign-up. Moved here from /register, which now holds the competition
// registration form from feat/registration-form.
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