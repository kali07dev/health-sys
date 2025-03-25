import { ViewEmployeeClosedIncidents } from "@/components/Incidents/view-employee-closed-incidents"
import { notFound } from "next/navigation"

interface EmployeeClosedIncidentsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Employee Closed Incidents",
  description: "View all closed safety incidents for a specific employee",
}

export default async function EmployeeClosedIncidentsPage({ params }: EmployeeClosedIncidentsPageProps) {
  // Validate id parameter
  const { id } = await params;
  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ViewEmployeeClosedIncidents employeeId={id} />
    </main>
  )
}
