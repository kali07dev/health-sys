"use client"

import type React from "react"
import type { Incident } from "@/interfaces/incidents"
import type { IncidentAttachment } from "@/interfaces/incidents"
import { AttachmentsList } from "./AttachmentsList"

interface IncidentDetailsProps {
  incident: Incident
  attachments?: IncidentAttachment[]
  isAuthorized?: boolean
}

const IncidentDetails: React.FC<IncidentDetailsProps> = ({ incident, attachments, isAuthorized }) => {
  return (
    // <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg w-full max-w-full mx-auto border border-red-100 dark:border-red-900">
    <div className="bg-white shadow overflow-hidden rounded-lg w-full max-w-full mx-auto border border-red-100 dark:border-red-900">
      {/* <div className="px-4 py-5 sm:px-6 bg-red-50 dark:bg-red-950/30"> */}
      <div className="px-4 py-5 sm:px-6 bg-red-50">
        <h3 className="text-lg leading-6 font-medium text-red-800 dark:text-red-300">Incident Details</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400 break-words">
          {incident.referenceNumber}
        </p>
      </div>
      <div className="border-t border-red-200 dark:border-red-800 px-4 py-5 sm:p-0">
        <dl className="divide-y divide-red-100 dark:divide-red-900 text-black">
          <DetailItem label="Type" value={incident.type} />
          <DetailItem label="Severity Level" value={incident.severityLevel} />
          <DetailItem label="Status" value={incident.status} />
          <DetailItem label="Title" value={incident.title} />
          <DetailItem label="Description" value={incident.description} className="whitespace-pre-wrap break-words" />
          <DetailItem label="Location" value={incident.location} />
          <DetailItem label="Occurred At" value={new Date(incident.occurredAt).toLocaleString()} />
          <DetailItem label="Reported By Account" value={incident.reportedBy} />
          <DetailItem label="Reported For" value={incident.userReported} />

          {incident.assignedTo && <DetailItem label="Assigned To" value={incident.assignedTo} />}

          {incident.immediateActionsTaken && (
            <DetailItem
              label="Immediate Actions Taken"
              value={incident.immediateActionsTaken}
              className="whitespace-pre-wrap break-words"
            />
          )}

          {/* Example of conditional rendering based on isAuthorized */}
          {isAuthorized && (
            <DetailItem label="Authorized Content" value="This content is only visible to authorized users." />
          )}
        </dl>
        <div className="py-4 px-4 sm:px-6">
          <AttachmentsList attachments={attachments ?? []} />
        </div>
      </div>
    </div>
  )
}

// Helper component for detail items to improve responsiveness and reduce repetition
const DetailItem: React.FC<{
  label: string
  value: string | React.ReactNode
  className?: string
}> = ({ label, value, className = "" }) => {
  return (
    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
      <dt className="text-sm font-medium text-red-600 dark:text-red-400">{label}</dt>
      <dd className={`mt-1 text-sm text-gray-900 dark:text-black sm:mt-0 sm:col-span-2 ${className}`}>{value}</dd>
    </div>
  )
}

export default IncidentDetails

