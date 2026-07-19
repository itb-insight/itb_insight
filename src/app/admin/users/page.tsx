import NotInMvp from "@/features/admin/components/NotInMvp/NotInMvp"

export default function AdminUsersPage() {
  return (
    <NotInMvp
      title="Users"
      purpose="Account listing, role assignment, and the 'stakeholder' role that grants a division lead visibility across all divisions rather than only their own tag. Blocked on real authentication."
    />
  )
}
