"use client"

import type React from "react"
import { submitVPC, submitVPCWithoutAttachments } from "@/lib/api/vpc"
import DepartmentDropdown from "@/components/DepartmentDropdown"
import { SearchEmployee, Employee } from '@/components/SearchAllEmployees'; 

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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [reportedBy, setreportedBy] = useState('');
  

  const [formData, setFormData] = useState({
    vpcNumber: "",
    reportedBy: reportedBy,
    department: "",
    description: "",
    vpcType: "",
    actionTaken: "",
    incidentRelatesTo: "",
  })
  console.log("User ID:", userId)

  const handleEmployeeSelect = (employee: Employee) => {
      const employeeFullName = `${employee.firstName} ${employee.lastName}`;
      setSelectedEmployee(employee); // Store the selected employee's details
      setreportedBy(employeeFullName);
  };
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
        reportedBy: reportedBy,
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
              <Label className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Reported By
              </Label>
              <SearchEmployee onSelect={handleEmployeeSelect} />
                            {selectedEmployee && (
                               <div className="mt-2 text-sm text-gray-500">
                                  Selected: {`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} ({selectedEmployee.position})
                                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Department
              </Label>
              <DepartmentDropdown
                className="bg-white text-black border-gray-300 focus:border-black focus:ring-1 focus:ring-black
                          dark:bg-white dark:text-black dark:border-gray-300 dark:focus:border-black"
                value={formData.department}
                onChange={(value) => handleSelectChange("department", value)}
                placeholder="Select Department"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-gray-700">
                VPC Type
              </Label>
              <RadioGroup
                value={formData.vpcType}
                onValueChange={(value) => handleSelectChange("vpcType", value)}
                className="grid grid-cols-2 gap-4 pt-2"
                required
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="safe-act" 
                    id="vpc-type-safe-act" 
                    className="text-black border-gray-400 focus:ring-black
                               dark:text-black dark:border-gray-400 dark:focus:ring-black"
                  />
                  <Label htmlFor="vpc-type-safe-act" className="cursor-pointer text-gray-800 dark:text-gray-800">
                    Safe Act
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="safe-condition" 
                    id="vpc-type-safe-condition" 
                    className="text-black border-gray-400 focus:ring-black
                               dark:text-black dark:border-gray-400 dark:focus:ring-black"
                  />
                  <Label htmlFor="vpc-type-safe-condition" className="cursor-pointer text-gray-800 dark:text-gray-800">
                    Safe Condition
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="safe-behavior" 
                    id="vpc-type-safe-behavior" 
                    className="text-black border-gray-400 focus:ring-black
                               dark:text-black dark:border-gray-400 dark:focus:ring-black"
                  />
                  <Label htmlFor="vpc-type-safe-behavior" className="cursor-pointer text-gray-800 dark:text-gray-800">
                    Safe Behavior
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="unsafe-act" 
                    id="vpc-type-unsafe-act" 
                    className="text-black border-gray-400 focus:ring-black
                               dark:text-black dark:border-gray-400 dark:focus:ring-black"
                  />
                  <Label htmlFor="vpc-type-unsafe-act" className="cursor-pointer text-gray-800 dark:text-gray-800">
                    Unsafe Act
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="unsafe-condition" 
                    id="vpc-type-unsafe-condition" 
                    className="text-black border-gray-400 focus:ring-black
                               dark:text-black dark:border-gray-400 dark:focus:ring-black"
                  />
                  <Label htmlFor="vpc-type-unsafe-condition" className="cursor-pointer text-gray-800 dark:text-gray-800">
                    Unsafe Condition
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="unsafe-behavior" 
                    id="vpc-type-unsafe-behavior" 
                    className="text-black border-gray-400 focus:ring-black
                               dark:text-black dark:border-gray-400 dark:focus:ring-black"
                  />
                  <Label htmlFor="vpc-type-unsafe-behavior" className="cursor-pointer text-gray-800 dark:text-gray-800">
                    Unsafe Behavior
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
              <Label className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Related Incident
              </Label>
              <Input
                className="bg-white text-black border-gray-300 focus:border-black focus:ring-1 focus:ring-black
                           dark:bg-white dark:text-black dark:border-gray-300 dark:focus:border-black"
                id="incidentRelatesTo"
                name="incidentRelatesTo"
                value={formData.incidentRelatesTo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Description
              </Label>
              <Textarea
                className="bg-white text-black border-gray-300 focus:border-black focus:ring-1 focus:ring-black
                          dark:bg-white dark:text-black dark:border-gray-300 dark:focus:border-black"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-gray-700">
                Action Taken
              </Label>
              <Textarea
                className="bg-white text-black border-gray-300 focus:border-black focus:ring-1 focus:ring-black
                          dark:bg-white dark:text-black dark:border-gray-300 dark:focus:border-black"
                id="actionTaken"
                name="actionTaken"
                value={formData.actionTaken}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>
          </div>
        </div>

        {/* Evidence Section */}
        <div>
          <div 
            className="flex justify-between items-center cursor-pointer mb-4"
            onClick={() => setEvidenceExpanded(!evidenceExpanded)}
          >
            <h3 className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-600">
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
                      <div key={index} className="border border-gray-100 p-3 bg-white dark:bg-white">
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
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-black
                                 dark:border-gray-300 dark:text-gray-700 dark:hover:bg-gray-50 dark:hover:text-black"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add More Files
                    </Button>
                  </div>
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-200 p-8 text-center bg-white dark:bg-white">
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-black
                               dark:border-gray-300 dark:text-gray-700 dark:hover:bg-gray-50 dark:hover:text-black"
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
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 text-white hover:bg-red-700 px-6 py-3 rounded-full
                      dark:bg-red-500 dark:text-white dark:hover:bg-red-600"
          >
            {isSubmitting ? "Submitting..." : "Submit Safety Report"}
          </Button>
        </div>
      </form>
    </div>
  )
}