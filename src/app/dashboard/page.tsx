import HomePage from "@/features/home/HomePage"

// The countdown corrects itself against the server's clock, so the timestamp handed to
// it has to be the time of this request — not whenever the page was last built.
export const dynamic = "force-dynamic"

export default function DashboardPage() {
  return <HomePage serverNow={Date.now()} />
}
