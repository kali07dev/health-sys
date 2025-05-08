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

  // ========== ORIGINAL FUNCTIONALITY PRESERVED ==========
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

      const response = 
        files.length > 0 
          ? await submitVPC(vpcData, files) 
          : await submitVPCWithoutAttachments(vpcData)
      console.log("VPC created successfully:", response)
      router.push("/vpc")
      router.refresh()
    } catch (err) {
      console.error(err)
      setError("An error occurred while creating the VPC. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ========== PREMIUM UI ENHANCEMENTS ==========
  return (
    <div className="max-w-4xl mx-auto bg-white p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-black mb-1">Safety Observation Report</h1>
        <p className="font-normal text-gray-600">Document workplace conditions with precision</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <Alert variant="destructive" className="border border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Core Details Section */}
        <div className="border-b border-gray-100 pb-8">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-600 mb-6">Core Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vpcNumber" className="text-xs font-medium uppercase tracking-wide text-gray-700">
                VPC Number
              </Label>
              <Input
                id="vpcNumber"
                name="vpcNumber"
                value={formData.vpcNumber}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportedBy" className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Reported By
              </Label>
              <Input
                id="reportedBy"
                name="reportedBy"
                value={formData.reportedBy}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Department
              </Label>
              <DepartmentDropdown
                value={formData.department}
                onChange={(value) => handleSelectChange("department", value)}
                placeholder="Select Department"
                className="border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-gray-700">VPC Type</Label>
              <RadioGroup
                value={formData.vpcType}
                onValueChange={(value) => handleSelectChange("vpcType", value)}
                className="flex gap-6 pt-2"
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="safe" 
                    id="vpc-type-safe" 
                    className="text-black border-gray-400 focus:ring-black"
                  />
                  <Label htmlFor="vpc-type-safe" className="cursor-pointer text-gray-800">
                    Safe
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="unsafe" 
                    id="vpc-type-unsafe" 
                    className="text-black border-gray-400 focus:ring-black"
                  />
                  <Label htmlFor="vpc-type-unsafe" className="cursor-pointer text-gray-800">
                    Unsafe
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        {/* Incident Details Section */}
        <div className="border-b border-gray-100 pb-8">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-600 mb-6">Incident Details</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="incidentRelatesTo" className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Related Incident
              </Label>
              <Input
                id="incidentRelatesTo"
                name="incidentRelatesTo"
                value={formData.incidentRelatesTo}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
                className="border-gray-300 focus:border-black focus:ring-1 focus:ring-black min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actionTaken" className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Action Taken
              </Label>
              <Textarea
                id="actionTaken"
                name="actionTaken"
                value={formData.actionTaken}
                onChange={handleChange}
                rows={3}
                required
                className="border-gray-300 focus:border-black focus:ring-1 focus:ring-black min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Evidence Section - Fully Functional */}
        <div>
          <div 
            className="flex justify-between items-center cursor-pointer mb-4"
            onClick={() => setEvidenceExpanded(!evidenceExpanded)}
          >
            <h3 className="text-xs font-medium uppercase tracking-wide text-gray-600">
              Evidence & Attachments ({files.length})
            </h3>
            <button type="button" className="p-1 text-gray-500 hover:text-black">
              {evidenceExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {evidenceExpanded && (
            <div className="space-y-4">
              {files.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div key={index} className="border border-gray-100 p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-black">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {file.type.startsWith("image/") && (
                          <div className="mt-3 ml-8">
                            <div className="relative w-full h-40 border border-gray-100 overflow-hidden">
                              <Image
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      multiple 
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddMoreFiles}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-black"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add More Files
                    </Button>
                  </div>
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-200 p-8 text-center">
                  <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No evidence documentation attached</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    multiple 
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-black"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Evidence
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100">
        <Button type="submit" 
        disabled={isSubmitting} 
        className="bg-red-600 hover:bg-red-700 text-white">
          {isSubmitting ? "Creating..." : "Create VPC"}
        </Button>
        </div>
      </form>
    </div>
  )
}