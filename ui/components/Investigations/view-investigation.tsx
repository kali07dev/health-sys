// components/investigations/view-investigation.tsx
import { Investigation } from "@/interfaces/investigation"

interface ViewInvestigationProps {
  investigation: Investigation
}

export const ViewInvestigation = ({ investigation }: ViewInvestigationProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Investigation Details</h3>
        <p className="text-sm text-gray-500">ID: {investigation.id}</p>
      </div>

      <div>
        <h4 className="font-medium">Incident ID</h4>
        <p>{investigation.incident_id}</p>
      </div>

      <div>
        <h4 className="font-medium">Lead Investigator ID</h4>
        <p>{investigation.lead_investigator_id}</p>
      </div>

      <div>
        <h4 className="font-medium">Root Cause</h4>
        <p>{investigation.root_cause}</p>
      </div>

      <div>
        <h4 className="font-medium">Findings</h4>
        <p>{investigation.findings}</p>
      </div>

      <div>
        <h4 className="font-medium">Recommendations</h4>
        <p>{investigation.recommendations}</p>
      </div>

      <div>
        <h4 className="font-medium">Status</h4>
        <p>{investigation.status}</p>
      </div>

      <div>
        <h4 className="font-medium">Started At</h4>
        <p>{new Date(investigation.started_at).toLocaleString()}</p>
      </div>

      {investigation.completed_at && (
        <div>
          <h4 className="font-medium">Completed At</h4>
          <p>{new Date(investigation.completed_at).toLocaleString()}</p>
        </div>
      )}
    </div>
  )
}