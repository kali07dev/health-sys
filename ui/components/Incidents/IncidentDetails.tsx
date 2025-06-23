"use client"

import { useState } from "react"
import type { Incident } from "@/interfaces/incidents"
import type { IncidentAttachment } from "@/interfaces/incidents"
import { AttachmentsList } from "./AttachmentsList"
import { EditIncidentModal } from "./EditIncidentModal" // Import the modal component

interface IncidentDetailsProps {
  incident: Incident
  attachments?: IncidentAttachment[]
  isAuthorized?: boolean
}

const DetailItem: React.FC<{
  label: string
  value: string | React.ReactNode
  className?: string
}> = ({ label, value, className = "" }) => {
  return (
    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-red-600">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 ${className}`}>{value}</dd>
    </div>
  )
}

const IncidentDetails: React.FC<IncidentDetailsProps> = ({ incident, attachments, isAuthorized }) => {
  const [currentIncident, setCurrentIncident] = useState<Incident>(incident)

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg w-full max-w-full mx-auto border border-red-100">
      <div className="px-4 py-5 sm:px-6 bg-red-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-red-800">Incident Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 break-words">
            {currentIncident.referenceNumber}
          </p>
        </div>
        {isAuthorized && (
          <EditIncidentModal 
            incident={currentIncident} 
            onUpdate={(updatedIncident) => setCurrentIncident(updatedIncident)} 
          />
        )}
      </div>
      <div className="border-t border-red-200 px-4 py-5 sm:p-0">
        <dl className="divide-y divide-red-100 text-black">
          <DetailItem label="Type" value={currentIncident.type} />
          {currentIncident.type === 'injury' && currentIncident.injuryType && (
            <DetailItem label="Injury Type" value={currentIncident.injuryType} />
          )}
          <DetailItem label="Severity Level" value={currentIncident.severityLevel} />
          <DetailItem label="Status" value={currentIncident.status} />
          <DetailItem label="Title" value={currentIncident.title} />
          <DetailItem 
            label="Description" 
            value={currentIncident.description} 
            className="whitespace-pre-wrap break-words" 
          />
          <DetailItem label="Location" value={currentIncident.location} />
          <DetailItem label="Full Location" value={currentIncident.fulllocation} />
          <DetailItem 
            label="Occurred At" 
            value={new Date(currentIncident.occurredAt).toLocaleString()} 
          />
          {currentIncident.lateReason && (
            <DetailItem label="Late Reporting Reasons" value={currentIncident.lateReason} />
          )}
          <DetailItem label="Reported By Account" value={currentIncident.reportedBy} />
          <DetailItem label="Reported For" value={currentIncident.userReported} />

          {currentIncident.assignedTo && (
            <DetailItem label="Assigned To" value={currentIncident.assignedTo} />
          )}

          {currentIncident.immediateActionsTaken && (
            <DetailItem
              label="Immediate Actions Taken"
              value={currentIncident.immediateActionsTaken}
              className="whitespace-pre-wrap break-words"
            />
          )}

          {isAuthorized && (
            <DetailItem 
              label="Authorized Content" 
              value="This content is only visible to authorized users." 
            />
          )}
        </dl>
        <div className="py-4 px-4 sm:px-6">
          <AttachmentsList attachments={attachments ?? []} />
        </div>
      </div>
    </div>
  )
}

export default IncidentDetails