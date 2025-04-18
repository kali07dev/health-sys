import { ViewClosedIncidents } from "@/components/Incidents/view-closed-incidents"

export const metadata = {
  title: "Closed Incidents",
  description: "View all closed safety incidents in your organization",
}

export default function ClosedIncidentsPage() {
  return (
    <main className="min-h-screen bg-gray-50 ">
    {/* <main className="min-h-screen bg-gray-50 dark:bg-gray-900"> */}
      <ViewClosedIncidents />
    </main>
  )
}

