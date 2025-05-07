"use client"

import type React from "react"

import { VPCAPI } from "@/utils/vpcAPI"
import DepartmentDropdown from "@/components/DepartmentDropdown"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateVPCFormProps {
  userId: string
}

export default function CreateVPCForm({ userId }: CreateVPCFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    vpcNumber: "",
    reportedBy: "",
    department: "",
    description: "",
    vpcType: "",
    actionTaken: "",
    incidentRelatesTo: "",
  })
  console.log("User ID:", userId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await VPCAPI.createVPC({
        ...formData,
        reportedDate: new Date().toISOString(),
        //   userId,
      })
      console.log("VPC created:", response)

      router.push("/vpc")
      router.refresh()
    } catch (err) {
      console.error(err)
      setError("An error occurred while creating the VPC. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="vpcNumber">VPC Number</Label>
          <Input id="vpcNumber" name="vpcNumber" value={formData.vpcNumber} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportedBy">Reported By</Label>
          <Input id="reportedBy" name="reportedBy" value={formData.reportedBy} onChange={handleChange} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <DepartmentDropdown
            value={formData.department}
            onChange={(value) => handleSelectChange("department", value)}
            placeholder="Select Department"
          />
        </div>

        <div className="space-y-2">
            <Label htmlFor="vpcType">VPC Type</Label>
            
            <RadioGroup 
                id="vpcType" 
                value={formData.vpcType} 
                onValueChange={(value) => handleSelectChange("vpcType", value)}
                className="flex gap-6 pt-2"
                required
            >
                <div className="flex items-center space-x-2">
                <RadioGroupItem value="safe" id="vpc-type-safe" />
                <Label htmlFor="vpc-type-safe" className="cursor-pointer">Safe</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                <RadioGroupItem value="unsafe" id="vpc-type-unsafe" />
                <Label htmlFor="vpc-type-unsafe" className="cursor-pointer">Unsafe</Label>
                </div>
            </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="incidentRelatesTo">Related Incident</Label>
          <Input
            id="incidentRelatesTo"
            name="incidentRelatesTo"
            value={formData.incidentRelatesTo}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="actionTaken">Action Taken</Label>
        <Textarea id="actionTaken" name="actionTaken" value={formData.actionTaken} onChange={handleChange} rows={3} required/>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
          {isSubmitting ? "Creating..." : "Create VPC"}
        </Button>
      </div>
    </form>
  )
}
