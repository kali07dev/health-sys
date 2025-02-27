"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Incident } from "@/interfaces/incidents";
import IncidentForm from "./IncidentForm";
import IncidentDetails from "./IncidentDetails";
import { toast } from "react-hot-toast";

interface IncidentsTableProps {
  incidents: Incident[];
  userRole: string;
}

export const IncidentsTable = ({ incidents: initialIncidents, userRole }: IncidentsTableProps) => {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const handleCreateSuccess = (newIncident: Incident) => {
    setIncidents([...incidents, newIncident]); // Add the new incident to the list
    setIsCreateModalOpen(false);
    toast.success("Incident Successfully Created");
  };

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

      {/* Check if incidents array is empty */}
      {incidents.length === 0 ? (
        <div
          className="mt-8 flex justify-center items-center p-6 border-2 border-dotted border-blue-500 rounded-lg bg-blue-100 text-blue-700"
          style={{ height: "200px" }}
        >
          <p className="text-2xl font-bold text-center">No Incidents Are Currently Reported</p>
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Reference Number
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                        Type
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Severity</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">
                        Status
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {incidents.map((incident) => (
                      <tr key={incident.id} className="flex flex-col sm:table-row">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {incident.referenceNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                          {incident.type}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Badge
                            variant={
                              incident.severityLevel === "critical"
                                ? "critical"
                                : incident.severityLevel === "high"
                                ? "high"
                                : incident.severityLevel === "medium"
                                ? "medium"
                                : "low"
                            }
                          >
                            {incident.severityLevel}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                          <Badge
                            variant={
                              incident.status === "closed"
                                ? "closed"
                                : incident.status === "resolved"
                                ? "resolved"
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
      )}

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
  );
};