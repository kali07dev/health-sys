// app/incidents/page.tsx
import { Suspense } from "react"
import { generateDummyIncidents } from "@/utils/dummyData"
import { IncidentsTable } from "@/components/Incidents/landing"
import { TableSkeleton } from "@/components/skeletons/TableSkeleton"

const fetchIncidents = async () => {
  // Simulate API call with error handling
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return generateDummyIncidents(10)
  } catch (error) {
    console.error("Failed to fetch incidents:", error)
    return []
  }
}

export default async function IncidentsPage() {
  const incidents = await fetchIncidents()

  return (
    <Suspense fallback={<TableSkeleton />}>
      <IncidentsTable incidents={incidents} />
    </Suspense>
  )
}