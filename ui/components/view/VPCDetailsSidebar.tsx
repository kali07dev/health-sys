"use client"

import {
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  TagIcon,
} from "@heroicons/react/24/outline"

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
}

interface VPCDetailsSidebarProps {
  vpc: VPC
  onClose: () => void
}

export const VPCDetailsSidebar = ({ vpc, onClose }: VPCDetailsSidebarProps) => {
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
        </div>
      </div>
    </div>
  )
}
