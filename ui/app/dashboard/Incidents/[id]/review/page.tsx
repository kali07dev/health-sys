import React from "react"
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

const IncidentReviewPage: React.FC<IncidentReviewPageProps> = ({ params }) => {
  const [incident, setIncident] = React.useState<Incident | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      const fetchedIncident = await fetchIncident(params.id);
      setIncident(fetchedIncident);
      setLoading(false);

      if (!fetchedIncident) {
        notFound();
      }

      const userRole = getUserRole();
      if (userRole === "employee") {
        window.location.href = `/incidents/${params.id}`;
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {incident && <IncidentReview incident={incident} />}
      </div>
    </div>
  );
};

export default IncidentReviewPage

