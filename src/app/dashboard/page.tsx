import DashboardHome from "@/features/dashboard/DashboardHome"
import { getRegistrations } from "@/lib/registrations"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const registrations = await getRegistrations()
  return <DashboardHome registrations={registrations} />
}
