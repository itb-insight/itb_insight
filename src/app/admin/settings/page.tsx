import NotInMvp from "@/features/admin/components/NotInMvp/NotInMvp"

export default function AdminSettingsPage() {
  return (
    <NotInMvp
      title="Settings"
      purpose="Tracking configuration — sampling rates, rate-limit budgets, and event retention. These currently live in src/lib/analytics/config.ts and require a deploy to change."
    />
  )
}
