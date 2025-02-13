// components/investigations/investigations-table.tsx
"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Investigation } from "@/interfaces/investigation"
import { CreateInvestigationForm } from "./create-investigation-form"
import { ViewInvestigation } from "./view-investigation"
import { EditInvestigationForm } from "./edit-investigation-form"

interface InvestigationsTableProps {
  investigations: Investigation[]
}

export const InvestigationsTable = ({ investigations }: InvestigationsTableProps) => {
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { toast } = useToast()

  const handleViewInvestigation = (investigation: Investigation) => {
    setSelectedInvestigation(investigation)
  }

  const handleEditInvestigation = (investigation: Investigation) => {
    setSelectedInvestigation(investigation)
    setIsEditModalOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    toast({
      title: "Success",
      description: "Investigation has been created successfully.",
    })
  }

  const handleEditSuccess = () => {
    setIsEditModalOpen(false)
    toast({
      title: "Success",
      description: "Investigation has been updated successfully.",
    })
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Investigations</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all investigations including their status, lead investigator, and dates.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create New Investigation
          </Button>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Lead Investigator</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Started At</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Completed At</th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {investigations.map((investigation) => (
                  <tr key={investigation.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{investigation.id}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <Badge 
                        variant={
                          investigation.status === 'completed' ? 'default' :
                          investigation.status === 'in_progress' ? 'secondary' :
                          investigation.status === 'pending_review' ? 'warning' : 'outline'
                        }
                      >
                        {investigation.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{investigation.lead_investigator_id}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(investigation.started_at).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{investigation.completed_at ? new Date(investigation.completed_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Button
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        onClick={() => handleViewInvestigation(investigation)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleEditInvestigation(investigation)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Investigation Slide-over */}
      <Sheet open={!!selectedInvestigation && !isEditModalOpen} onOpenChange={() => setSelectedInvestigation(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Investigation Details</SheetTitle>
          </SheetHeader>
          {selectedInvestigation && <ViewInvestigation investigation={selectedInvestigation} />}
        </SheetContent>
      </Sheet>

      {/* Create Investigation Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create New Investigation</SheetTitle>
          </SheetHeader>
          <CreateInvestigationForm onSuccess={handleCreateSuccess} />
        </SheetContent>
      </Sheet>

      {/* Edit Investigation Modal */}
      <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Investigation</SheetTitle>
          </SheetHeader>
          {selectedInvestigation && (
            <EditInvestigationForm 
              investigation={selectedInvestigation} 
              onSuccess={handleEditSuccess} 
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}