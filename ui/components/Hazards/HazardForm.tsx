"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { hazardAPI } from "@/utils/hazardAPI"
import type { Hazard, CreateHazardRequest } from "@/interfaces/hazards"
import { SearchEmployee, Employee } from "@/components/SearchAllEmployees"


interface HazardFormProps {
  onSuccess: (hazard: Hazard) => void
}

export default function HazardForm({ onSuccess }: HazardFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [reporterFullName, setreporterFullName] = useState("")
  // const [showLateReportingReason, setShowLateReportingReason] = useState(false)
  // const [lateReportingReason, setLateReportingReason] = useState("")
  const [formData, setFormData] = useState<CreateHazardRequest>({
    type: 'unsafe_condition',
    riskLevel: 'medium',
    title: '',
    description: '',
    location: '',
    fullLocation: '',
    recommendedAction: '',
    reporterFullName: reporterFullName
  })

  const handleEmployeeSelect = (employee: Employee) => {
    const employeeFullName = `${employee.firstName} ${employee.lastName}`
    setSelectedEmployee(employee)
    setreporterFullName(employeeFullName)
  }
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const hazard = await hazardAPI.createHazard(formData)
      toast.success("Hazard reported successfully!")
      onSuccess(hazard)
    } catch (error) {
      console.error("Failed to create hazard:", error)
      toast.error("Failed to report hazard. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateHazardRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6 p-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-700">Hazard Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select hazard type" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="unsafe_act">Unsafe Act</SelectItem>
                  <SelectItem value="unsafe_condition">Unsafe Condition</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskLevel" className="text-gray-700">Risk Level *</Label>
              <Select 
                value={formData.riskLevel} 
                onValueChange={(value) => handleInputChange('riskLevel', value)}
              >
                <SelectTrigger id="riskLevel">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="extreme">Extreme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-700">Hazard Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Brief description of the hazard"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              maxLength={255}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-700">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of the hazard..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={4}
              className="w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-700">Location *</Label>
              <Select value={formData.location} onValueChange={(value) => handleSelectChange("location", value)}>
                <SelectTrigger className="h-12 text-base bg-white text-black">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="balaka">Balaka</SelectItem>
                  <SelectItem value="lunzu">lunzu</SelectItem>
                  <SelectItem value="makata">Makata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullLocation" className="text-gray-700">Full Location Details *</Label>
              <Input
                id="fullLocation"
                type="text"
                placeholder="Complete address or detailed location"
                value={formData.fullLocation}
                onChange={(e) => handleInputChange('fullLocation', e.target.value)}
                required
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendedAction" className="text-gray-700">Recommended Action</Label>
            <Textarea
              id="recommendedAction"
              placeholder="Suggest actions to address this hazard..."
              value={formData.recommendedAction}
              onChange={(e) => handleInputChange('recommendedAction', e.target.value)}
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporterFullName" className="text-gray-700">Reporter Name</Label>
            <SearchEmployee onSelect={handleEmployeeSelect} />
              {selectedEmployee && (
                <div className="mt-2 text-sm text-gray-500">
                  Selected: {`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} ({selectedEmployee.position})
                </div>
              )}
          </div>

          {/* Add some bottom padding to ensure the submit button area is accessible */}
          <div className="pb-20"></div>
        </form>
      </div>

      {/* Fixed submit button at the bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reporting...
              </>
            ) : (
              "Report Hazard"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}