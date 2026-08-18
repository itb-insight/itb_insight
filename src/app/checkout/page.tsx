import type { Metadata } from "next"
import CheckoutPreview from "@/features/checkout/CheckoutPreview"

export const metadata: Metadata = {
  title: "Checkout Preview | ITB Insight 2026",
  description: "Pratinjau pendaftaran kompetisi ITB Insight 2026.",
}

export default function CheckoutPage() {
  return <CheckoutPreview />
}
