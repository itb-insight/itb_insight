import NotInMvp from "@/features/admin/components/NotInMvp/NotInMvp"

export default function AdminEventsPage() {
  return (
    <NotInMvp
      title="Events"
      purpose="Event scheduling and QR check-in management. The check-in rate shown on the dashboard is sourced from here once the registrations table is live."
    />
  )
}
