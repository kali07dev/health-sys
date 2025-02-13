"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Incident } from "@/interfaces/incidents"
import IncidentForm from "./IncidentForm"
import IncidentDetails  from "./IncidentDetails"

interface IncidentsTableProps {
  incidents: Incident[]
}

export const IncidentsTable = ({ incidents }: IncidentsTableProps) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const userRole = "test"

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident)
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    toast({
      title: "Success",
      description: "Incident has been created successfully.",
      type: "success"
    })
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Incidents</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all incidents in your organization including their reference number, type, severity, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            Report New Incident
          </Button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Reference Number
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {incident.referenceNumber}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{incident.type}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <Badge variant={incident.severityLevel === "high" ? "critical" : "secondary"}>
                          {incident.severityLevel}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <Badge
                          variant={
                            incident.status === "closed"
                              ? "default"
                              : incident.status === "investigating"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {incident.status}
                        </Badge>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Button
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewIncident(incident)}
                        >
                          View
                          <span className="sr-only">, {incident.referenceNumber}</span>
                        </Button>
                        {userRole !== "employee" && (
                          <Link
                            href={`/incidents/${incident.id}/review`}
                            className="ml-4 text-red-600 hover:text-red-900"
                          >
                            Review
                            <span className="sr-only">, {incident.referenceNumber}</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* View Incident Slide-over */}
      <Sheet open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Incident Details</SheetTitle>
          </SheetHeader>
          {selectedIncident && <IncidentDetails incident={selectedIncident} />}
        </SheetContent>
      </Sheet>

      {/* Create Incident Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Report New Incident</SheetTitle>
          </SheetHeader>
          <IncidentForm onSuccess={handleCreateSuccess} />
        </SheetContent>
      </Sheet>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  )
}

