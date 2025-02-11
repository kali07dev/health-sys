// components/Incidents/IncidentsTable.tsx
"use client"

import Link from "next/link"
// import { useAuthStore } from "@/stores/authStore"
import type { Incident } from "@/interfaces/incidents"

interface IncidentsTableProps {
  incidents: Incident[]
}

export const IncidentsTable = ({ incidents }: IncidentsTableProps) => {
  // const user = useAuthStore((state) => state.user)
  const userRole = 'test'

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Incidents {userRole}</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all incidents in your organization including their reference number, 
            type, severity, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/dashboard/incidents/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent 
                     bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Report New Incident
          </Link>
        </div>
      </div>
      
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
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{incident.severityLevel}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{incident.status}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link 
                          href={`/incidents/${incident.id}`} 
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                          <span className="sr-only">, {incident.referenceNumber}</span>
                        </Link>
                        {userRole !== 'employee' && (
                          <Link
                            href={`/incidents/${incident.id}/review`}
                            className="ml-4 text-indigo-600 hover:text-indigo-900"
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
    </div>
  )
}