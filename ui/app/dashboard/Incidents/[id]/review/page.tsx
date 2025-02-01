import type React from "react"
import { notFound } from "next/navigation"
import IncidentReview from "../../../../../components/Incidents/IncidentReview"
import { generateDummyIncidents, type Incident } from "../../../../../utils/dummyData"
import { getUserRole } from "../../../../../utils/auth"

const fetchIncident = async (id: string): Promise<Incident | undefined> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const incidents = generateDummyIncidents(10)
  return incidents.find((incident) => incident.id === id)
}

interface IncidentReviewPageProps {
  params: { id: string }
}

const IncidentReviewPage: React.FC<IncidentReviewPageProps> = async ({ params }) => {
  const incident = await fetchIncident(params.id)
  const userRole = getUserRole()

  if (!incident) {
    notFound()
  }

  if (userRole === "employee") {
    // Redirect to incident details page if the user is a regular employee
    return {
      redirect: {
        destination: `/incidents/${params.id}`,
        permanent: false,
      },
    }
  }

  return (
    
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <IncidentReview incident={incident} />
        </div>
      </div>
    
  )
}

export default IncidentReviewPage

