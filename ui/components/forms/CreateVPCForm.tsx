"use client"

import type React from "react"

import { submitVPC, submitVPCWithoutAttachments } from "@/lib/api/vpc"
import DepartmentDropdown from "@/components/DepartmentDropdown"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, Upload, FileText, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface CreateVPCFormProps {
  userId: string
}

export default function CreateVPCForm({ userId }: CreateVPCFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evidenceExpanded, setEvidenceExpanded] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const vpcData = {
        ...formData,
        reportedDate: new Date().toISOString(),
      }

      // Call the createVPC function with files if there are any
      const response = 
      files.length > 0 ? await submitVPC(vpcData, files) : await submitVPCWithoutAttachments(vpcData) 
        // await VPCAPI.createVPC(vpcData, files.length > 0 ? files : undefined)
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
              <Label htmlFor="vpc-type-safe" className="cursor-pointer">
                Safe
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unsafe" id="vpc-type-unsafe" />
              <Label htmlFor="vpc-type-unsafe" className="cursor-pointer">
                Unsafe
              </Label>
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
        <Textarea
          id="actionTaken"
          name="actionTaken"
          value={formData.actionTaken}
          onChange={handleChange}
          rows={3}
          required
        />
      </div>

      {/* Evidence section */}
      <div className="border rounded-lg overflow-hidden">
        <div
          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
          onClick={() => setEvidenceExpanded(!evidenceExpanded)}
        >
          <h3 className="text-sm font-medium text-gray-700">Evidence & Attachments</h3>
          <button type="button" className="p-1 rounded-full hover:bg-gray-200">
            {evidenceExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>

        {evidenceExpanded && (
          <div className="p-4 border-t">
            {files.length > 0 ? (
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={index} className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">Size: {(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* File Preview for images */}
                    {file.type.startsWith("image/") && (
                      <div className="mt-2">
                        <div className="w-full h-auto rounded-lg border border-gray-200 overflow-hidden">
                          <Image
                            src={URL.createObjectURL(file) || "/placeholder.svg"}
                            alt={file.name}
                            className="w-full h-auto object-cover rounded-md"
                            style={{ maxHeight: "200px" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={handleAddMoreFiles} className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add More Files
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p>No evidence uploaded yet</p>

                <div className="mt-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-4 bg-red-50 text-red-600 rounded-md hover:bg-red-100 flex items-center justify-center mx-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Evidence
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
          {isSubmitting ? "Creating..." : "Create VPC"}
        </Button>
      </div>
    </form>
  )
}
