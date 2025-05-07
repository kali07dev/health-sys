"use client"

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

interface VPCCardProps {
  vpc: VPC
  onClick: () => void
}

export const VPCCard = ({ vpc, onClick }: VPCCardProps) => {
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

  // Format date with more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-100 overflow-hidden"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getVpcTypeColor(vpc.vpcType)}`}>
            {vpc.vpcType}
          </span>
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">Reported: {formatDate(vpc.reportedDate)}</span>
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900 truncate mb-2">VPC: {vpc.vpcNumber}</h3>

        <p className="text-sm text-gray-500 line-clamp-3 mb-4">{vpc.description || "No description available."}</p>

        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
          <div>
            <span className="font-medium">Reported By:</span>
            <span className="ml-1 truncate block">{vpc.reportedBy}</span>
          </div>
          <div>
            <span className="font-medium">Department:</span>
            <span className="ml-1 truncate block">{vpc.department}</span>
          </div>
          <div>
            <span className="font-medium">Action Taken:</span>
            <span className="ml-1 truncate block">{vpc.actionTaken || "None"}</span>
          </div>
          <div>
            <span className="font-medium">Related To:</span>
            <span className="ml-1 truncate block">{vpc.incidentRelatesTo || "N/A"}</span>
          </div>
        </div>
      </div>
      <div className="h-2 w-full bg-red-500"></div>
    </div>
  )
}
