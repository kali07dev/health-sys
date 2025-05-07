"use client"

import { useState } from "react"
import {
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  TagIcon,
} from "@heroicons/react/24/outline"
import { ChevronDown, ChevronUp, FileText } from "lucide-react"
import Image from "next/image"

interface VPCAttachment {
  id: string
  fileName: string
  fileType: string
  storagePath: string
  fileSize: number
  createdAt: string
  uploader: string
}

interface VPC {
  id: string
  vpcNumber: string
  reportedBy: string
  reportedDate: string
  department: string
  description: string
  vpcType: string
  actionTaken: string
  incidentRelatesTo: string
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    id: string
    firstName: string
    lastName: string
  }
  attachments?: VPCAttachment[]
}

interface VPCDetailsSidebarProps {
  vpc: VPC
  onClose: () => void
}

export const VPCDetailsSidebar = ({ vpc, onClose }: VPCDetailsSidebarProps) => {
  const [evidenceExpanded, setEvidenceExpanded] = useState(true)

  const getVpcTypeColor = (vpcType: string) => {
    switch (vpcType.toLowerCase()) {
      case "hazard":
        return "bg-yellow-100 text-yellow-800"
      case "incident":
        return "bg-red-100 text-red-800"
      case "near miss":
        return "bg-orange-100 text-orange-800"
      case "improvement":
        return "bg-green-100 text-green-800"
      case "safe":
        return "bg-green-100 text-green-800"
      case "unsafe":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const BE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 z-40 overflow-hidden flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto animate-slide-left">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">VPC Details</h2>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVpcTypeColor(vpc.vpcType)}`}>
              {vpc.vpcType}
            </span>

            <div className="flex items-center text-sm text-gray-500">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatDate(vpc.reportedDate)}</span>
            </div>
          </div>

          <div className="mb-6 flex flex-col space-y-2">
            <h3 className="text-lg font-bold text-gray-900">VPC Number: {vpc.vpcNumber}</h3>

            <div className="flex items-center text-sm text-gray-600">
              <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
              <span>ID: {vpc.id}</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-2">
              <UserCircleIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Reported By</span>
            </div>
            <p className="text-sm text-gray-600 ml-7">{vpc.reportedBy}</p>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-2">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Department</span>
            </div>
            <p className="text-sm text-gray-600 ml-7">{vpc.department}</p>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">Description</span>
            </div>
            <p className="text-sm text-gray-600 ml-7">{vpc.description || "No description available."}</p>
          </div>

          {vpc.actionTaken && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">Action Taken</span>
              </div>
              <p className="text-sm text-gray-600 ml-7">{vpc.actionTaken}</p>
            </div>
          )}

          {vpc.incidentRelatesTo && (
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">Related Incident</span>
              </div>
              <p className="text-sm text-gray-600 ml-7">{vpc.incidentRelatesTo}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="text-sm text-gray-500 mt-2">
              <span className="font-medium">Reported Date:</span> {formatDate(vpc.reportedDate)}
            </div>
          </div>

          {/* Evidence section */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <div
              className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
              onClick={() => setEvidenceExpanded(!evidenceExpanded)}
            >
              <h3 className="text-sm font-medium text-gray-700">Evidence & Attachments</h3>
              <button className="p-1 rounded-full hover:bg-gray-200">
                {evidenceExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>

            {evidenceExpanded && (
              <div className="p-4 border-t">
                {vpc.attachments && vpc.attachments.length > 0 ? (
                  <div className="space-y-4">
                    {vpc.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">Uploaded by {attachment.uploader}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(attachment.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        {/* File Preview */}
                        <div className="mt-2">
                          {/* Check file extension instead of fileType */}
                          {attachment.fileName.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) ? (
                            <div className="w-full h-auto rounded-lg border border-gray-200 overflow-hidden">
                              <Image
                                src={`${BE_URL}/${attachment.storagePath}`}
                                alt={attachment.fileName}
                                width={0}
                                height={0}
                                sizes="100vw"
                                className="w-full h-auto object-cover rounded-md"
                                style={{ width: "100%", height: "auto" }}
                              />
                            </div>
                          ) : (
                            <a
                              href={`${BE_URL}/${attachment.storagePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Preview File
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p>No evidence uploaded yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
