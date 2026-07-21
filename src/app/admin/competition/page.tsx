import NotInMvp from "@/features/admin/components/NotInMvp/NotInMvp"

export default function AdminCompetitionPage() {
  return (
    <NotInMvp
      title="Competition"
      purpose="Competition CRUD and per-competition registration settings. The funnel panel reads competition_id from this data once it exists."
    />
  )
}
