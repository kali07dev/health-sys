"use client"

import { format, formatDistance } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, User, AlertTriangle, Target } from "lucide-react"
import type { Hazard } from "@/interfaces/hazards"

interface HazardDetailsProps {
  hazard: Hazard
}

export default function HazardDetails({ hazard }: HazardDetailsProps) {
  const formatHazardType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true })
    } catch {
      return "Unknown time"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch {
      return "Invalid date"
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "extreme":
        return "bg-red-600 hover:bg-red-700"
      case "high":
        return "bg-orange-500 hover:bg-orange-600"
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "low":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-600 hover:bg-blue-700"
      case "assessing":
        return "bg-purple-600 hover:bg-purple-700"
      case "action_required":
        return "bg-red-600 hover:bg-red-700"
      case "resolved":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "closed":
        return "bg-green-600 hover:bg-green-700"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{hazard.title}</h2>
          <div className="flex gap-2">
            <Badge className={getRiskLevelColor(hazard.riskLevel)}>
              {hazard.riskLevel.toUpperCase()}
            </Badge>
            <Badge className={getStatusColor(hazard.status)}>
              {hazard.status
                .replace("_", " ")
                .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1))}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {hazard.userHazardID || hazard.referenceNumber}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {getTimeAgo(hazard.createdAt)}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-gray-900">Hazard Type</span>
          </div>
          <p className="text-gray-700 ml-7">{formatHazardType(hazard.type)}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <span className="font-medium text-gray-900">Location</span>
          </div>
          <div className="ml-7 space-y-1">
            <p className="text-gray-700">{hazard.location}</p>
            <p className="text-sm text-gray-500">{hazard.fullLocation}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Description</h3>
        <p className="text-gray-700 leading-relaxed">{hazard.description}</p>
      </div>

      {/* Recommended Action */}
      {hazard.recommendedAction && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            <span className="font-medium text-gray-900">Recommended Action</span>
          </div>
          <p className="text-gray-700 leading-relaxed ml-7">{hazard.recommendedAction}</p>
        </div>
      )}

      {/* Reporter Information */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Reporter Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Reported by:</span>
            <span className="text-sm font-medium text-gray-900">{hazard.userReported}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Date reported:</span>
            <span className="text-sm text-gray-700">{formatDate(hazard.createdAt)}</span>
          </div>
          {hazard.assignedTo && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Assigned to:</span>
              <span className="text-sm font-medium text-gray-900">{hazard.assignedTo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Created</p>
              <p className="text-xs text-gray-500">{formatDate(hazard.createdAt)}</p>
            </div>
            <Badge variant="outline">Initial Report</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Last Updated</p>
              <p className="text-xs text-gray-500">{formatDate(hazard.updatedAt)}</p>
            </div>
            <Badge variant="outline">Modified</Badge>
          </div>

          {hazard.closedAt && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Closed</p>
                <p className="text-xs text-gray-500">{formatDate(hazard.closedAt)}</p>
              </div>
              <Badge className="bg-green-600">Resolved</Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}