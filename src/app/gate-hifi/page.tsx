import { notFound } from "next/navigation"
import GatePreview from "./GatePreview"

export const metadata = {
  title: "Scanner Gate (hi-fi) | ITB Insight",
  description: "Preview sementara halaman scanner QR dan modal feedback.",
}

export default function GateHifiPage() {
  // Preview/dev page: not served in production (tests/guardrails/dev-routes.test.ts).
  if (process.env.NODE_ENV === "production") notFound()
  return <GatePreview />
}
