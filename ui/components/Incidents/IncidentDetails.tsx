"use client"

import type React from "react"
import type { Incident } from "../../utils/dummyData"
import { IncidentAttachment } from "@/interfaces/incidents";
import { AttachmentsList } from "./AttachmentsList";

interface IncidentDetailsProps {
  incident: Incident;
  attachments?: IncidentAttachment[];
  isAuthorized?: boolean;
}

const IncidentDetails: React.FC<IncidentDetailsProps> = ({ 
  incident, 
  attachments, 
  isAuthorized 
})=> {
  return (
    <div className="bg-white shadow overflow-hidden rounded-lg w-full max-w-full mx-auto">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Incident Details</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 break-words">{incident.referenceNumber}</p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="divide-y divide-gray-200">
          <DetailItem label="Type" value={incident.type} />
          <DetailItem label="Severity Level" value={incident.severityLevel} />
          <DetailItem label="Status" value={incident.status} />
          <DetailItem label="Title" value={incident.title} />
          <DetailItem 
            label="Description" 
            value={incident.description} 
            className="whitespace-pre-wrap break-words"
          />
          <DetailItem label="Location" value={incident.location} />
          <DetailItem 
            label="Occurred At" 
            value={new Date(incident.occurredAt).toLocaleString()} 
          />
          <DetailItem label="Reported By" value={incident.reportedBy} />
          
          {incident.assignedTo && (
            <DetailItem label="Assigned To" value={incident.assignedTo} />
          )}
          
          {incident.immediateActionsTaken && (
            <DetailItem 
              label="Immediate Actions Taken" 
              value={incident.immediateActionsTaken} 
              className="whitespace-pre-wrap break-words"
            />
          )}
          
          {/* Example of conditional rendering based on isAuthorized */}
          {isAuthorized && (
            <DetailItem 
              label="Authorized Content" 
              value="This content is only visible to authorized users." 
            />
          )}
        </dl>
        <AttachmentsList attachments={attachments ?? []} />
      </div>
    </div>
  );
};

// Helper component for detail items to improve responsiveness and reduce repetition
const DetailItem: React.FC<{
  label: string;
  value: string | React.ReactNode;
  className?: string;
}> = ({ label, value, className = "" }) => {
  return (
    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 ${className}`}>
        {value}
      </dd>
    </div>
  );
};

export default IncidentDetails;