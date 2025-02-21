import type React from "react"
import { notFound } from "next/navigation"
import IncidentDetails from "@/components/Incidents/IncidentDetails"
import { generateDummyIncidents, type Incident } from "@/utils/dummyData"
import { incidentAPI } from '@/utils/api';

const fetchIncident = async (id: string): Promise<Incident | undefined> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const incidents = generateDummyIncidents(10)
  return incidents.find((incident) => incident.id === id)
}

interface IncidentPageProps {
  params: { id: string }
}

const IncidentPage: React.FC<IncidentPageProps> = async ({ params }) => {
  const incident = await fetchIncident(params.id)

  if (!incident) {
    notFound()
  }

  return (
    
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <IncidentDetails incident={incident} isAuthorized={true} />
        </div>
      </div>
  )
}

export default IncidentPage

