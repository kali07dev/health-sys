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

interface HazardFormProps {
  onSuccess: (hazard: Hazard) => void
}

export default function HazardForm({ onSuccess }: HazardFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateHazardRequest>({
    type: 'unsafe_condition',
    riskLevel: 'medium',
    title: '',
    description: '',
    location: '',
    fullLocation: '',
    recommendedAction: '',
    reporterFullName: ''
  })

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
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Input
            id="location"
            type="text"
            placeholder="e.g., Building A, Floor 2"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            required
            maxLength={255}
          />
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
        <Input
          id="reporterFullName"
          type="text"
          placeholder="Your full name (optional)"
          value={formData.reporterFullName}
          onChange={(e) => handleInputChange('reporterFullName', e.target.value)}
        />
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button
          type="submit"
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
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
    </form>
  )
}