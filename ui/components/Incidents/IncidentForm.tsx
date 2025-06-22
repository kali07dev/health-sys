"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import type { ChangeEvent, FormEvent } from "react"

import { submitIncident, IncidentApiError, submitIncidentWithoutAttachments } from "@/lib/api/incidents"
import type { IncidentFormData, Incident } from "@/interfaces/incidents"
import { SearchEmployee, Employee } from "@/components/SearchAllEmployees"

import { AlertCircle, Upload, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format, isAfter, isBefore, startOfDay } from "date-fns"

interface ValidationError {
  field: string
  message: string
}

interface FormError {
  message: string
  validationErrors?: ValidationError[]
  fileErrors?: string[]
}

interface IncidentFormProps {
  onSuccess?: (newIncident: Incident) => void
}

const IncidentForm = ({ onSuccess }: IncidentFormProps) => {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [reporterFullName, setreporterFullName] = useState("")
  const [showLateReportingReason, setShowLateReportingReason] = useState(false)
  const [lateReportingReason, setLateReportingReason] = useState("")

  const [formData, setFormData] = useState<IncidentFormData>({
    type: "injury",
    severityLevel: "low",
    title: "",
    description: "",
    location: "",
    fulllocation:"",
    occurredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    immediateActionsTaken: "",
    reportedBy: session?.user?.id || "",
    injuryType: "",
    reporterFullName: reporterFullName,
    userIncidentID: "",
  })

  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<FormError | null>(null)
  const [dateError, setDateError] = useState<string>("")

  // Effect to validate date when lateReportingReason changes
  useEffect(() => {
    if (showLateReportingReason && !lateReportingReason) {
      setDateError("Please provide a reason for late reporting")
    } else if (showLateReportingReason && lateReportingReason) {
      setDateError("")
    }
  }, [lateReportingReason, showLateReportingReason])

  if (status === "unauthenticated") {
    router.push("/auth/login")
    return null
  }

  // Function to check if date requires late reporting reason
  const checkDateRequirements = (dateValue: string) => {
    if (!dateValue) return

    const selectedDate = new Date(dateValue)
    const today = startOfDay(new Date())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Clear any existing date errors
    setDateError("")

    // Check if date is in the future
    if (isAfter(startOfDay(selectedDate), today)) {
      setDateError("Incident date cannot be in the future")
      setShowLateReportingReason(false)
      setLateReportingReason("")
      return
    }

    // Check if date is before yesterday (more than 1 day ago)
    if (isBefore(startOfDay(selectedDate), yesterday)) {
      setShowLateReportingReason(true)
      if (!lateReportingReason) {
        setDateError("Please provide a reason for late reporting")
      }
    } else {
      setShowLateReportingReason(false)
      setLateReportingReason("")
    }
  }

  const handleEmployeeSelect = (employee: Employee) => {
    const employeeFullName = `${employee.firstName} ${employee.lastName}`
    setSelectedEmployee(employee)
    setreporterFullName(employeeFullName)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Special handling for date field
    if (name === "occurredAt") {
      checkDateRequirements(value)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleLateReportingReasonChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setLateReportingReason(e.target.value)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validate date before submission
    if (dateError) {
      setError({ message: "Please resolve the date validation error before submitting" })
      return
    }

    // Additional validation for late reporting reason
    if (showLateReportingReason && !lateReportingReason.trim()) {
      setError({ message: "Please provide a reason for late reporting" })
      return
    }

    setIsSubmitting(true)
    setError(null)
    formData.reporterFullName = reporterFullName

    // Add late reporting reason to form data if applicable
    const submissionData = {
      ...formData,
      lateReportingReason: showLateReportingReason ? lateReportingReason : undefined
    }

    try {
      const newIncident =
        files.length > 0 ? await submitIncident(submissionData, files) : await submitIncidentWithoutAttachments(submissionData)

      if (onSuccess) {
        onSuccess(newIncident)
      }
    } catch (err) {
      if (err instanceof IncidentApiError) {
        handleError(err)
      } else {
        setError({ message: "An unexpected error occurred" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleError = (err: IncidentApiError) => {
    switch (err.code) {
      case "AUTH_REQUIRED":
      case "AUTH_EXPIRED":
        router.push("/auth/login")
        break
      case "VALIDATION_ERROR":
        if (
          Array.isArray(err.details) &&
          err.details.every((detail) => typeof detail === "object" && "field" in detail && "message" in detail)
        ) {
          setError({
            message: "Please correct the following errors:",
            validationErrors: err.details as ValidationError[],
          })
        }
        break
      case "INVALID_FILES":
        if (Array.isArray(err.details) && err.details.every((detail) => typeof detail === "string")) {
          setError({
            message: "File upload errors:",
            fileErrors: err.details,
          })
        } else {
          setError({
            message: "Invalid file error format",
          })
        }
        break
      case "NETWORK_ERROR":
        setError({
          message: "Network error. Please check your connection and try again.",
        })
        break
      default:
        setError({
          message: err.message || "An unexpected error occurred",
        })
    }
  }

  return (
    <div className="flex flex-col h-full pb-6">
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-100">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <p className="font-medium text-red-800">{error.message}</p>
            {error.validationErrors && (
              <ul className="mt-2 text-sm text-red-700">
                {error.validationErrors.map((err: ValidationError, index: number) => (
                  <li key={index} className="text-red-700">{`${err.field}: ${err.message}`}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {dateError && (
        <Alert variant="destructive" className="mb-4 bg-red-100">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription>
            <p className="font-medium text-red-800">{dateError}</p>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto pr-1">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base">
              Title
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief title of the incident"
              className="h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-base">
                Type
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger className="h-12 text-base bg-white text-black">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="injury">Injury</SelectItem>
                  <SelectItem value="near_miss">Near Miss</SelectItem>
                  <SelectItem value="property_damage">Property Damage</SelectItem>
                  <SelectItem value="environmental">Environmental</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "injury" && (
              <div className="space-y-2">
                <Label htmlFor="injuryType" className="text-base">
                  Injury Type
                </Label>
                <Select value={formData.injuryType} onValueChange={(value) => handleSelectChange("injuryType", value)}>
                  <SelectTrigger className="h-12 text-base bg-white text-black">
                    <SelectValue placeholder="Select injury type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value="injury-fa">Injury-FA</SelectItem>
                    <SelectItem value="injury-lti">Injury-LTI</SelectItem>
                    <SelectItem value="injury-mwd">Injury-MWD</SelectItem>
                    <SelectItem value="injury-fai">Injury-FAI</SelectItem>
                    <SelectItem value="injury-mti">Injury-MTI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="severityLevel" className="text-base">
                Severity Level
              </Label>
              <Select
                value={formData.severityLevel}
                onValueChange={(value) => handleSelectChange("severityLevel", value)}
              >
                <SelectTrigger className="h-12 text-base bg-white text-black">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base">
                Location
              </Label>
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
              <Textarea
                id="fulllocation"
                name="fulllocation"
                value={formData.fulllocation}
                onChange={handleInputChange}
                placeholder="Specific location of where it happened"
                rows={4}
                className="resize-none text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occurredAt" className="text-base">
                Date and Time
              </Label>
              <Input
                id="occurredAt"
                name="occurredAt"
                type="datetime-local"
                value={formData.occurredAt}
                onChange={handleInputChange}
                className={`h-12 text-base ${dateError ? 'border-red-500' : ''}`}
                max={format(new Date(), "yyyy-MM-dd'T'HH:mm")} // Prevent future dates in the input
              />
            </div>
          </div>

          {/* Late Reporting Reason Field */}
          {showLateReportingReason && (
            <div className="space-y-2">
              <Label htmlFor="lateReportingReason" className="text-base text-orange-600">
                Reason for Late Reporting <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="lateReportingReason"
                name="lateReportingReason"
                value={lateReportingReason}
                onChange={handleLateReportingReasonChange}
                placeholder="Please explain why this incident is being reported late"
                rows={3}
                className="resize-none text-base border-orange-300 focus:border-orange-500"
                required
              />
              <p className="text-sm text-orange-600">
                This incident occurred more than one day ago. Please provide a reason for the delayed reporting.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed description of what happened"
              rows={4}
              className="resize-none text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="immediateActionsTaken" className="text-base">
              Immediate Actions Taken
            </Label>
            <Textarea
              id="immediateActionsTaken"
              name="immediateActionsTaken"
              value={formData.immediateActionsTaken}
              onChange={handleInputChange}
              placeholder="Actions taken to address the incident"
              rows={4}
              className="resize-none text-base"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reporterFullName" className="text-base">
                Reporter&apos;s Full Name
              </Label>
              <SearchEmployee onSelect={handleEmployeeSelect} />
              {selectedEmployee && (
                <div className="mt-2 text-sm text-gray-500">
                  Selected: {`${selectedEmployee.firstName} ${selectedEmployee.lastName}`} ({selectedEmployee.position})
                </div>
              )}
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="userIncidentID" className="text-base">
                Incident ID
              </Label>
              <Input
                id="userIncidentID"
                name="userIncidentID"
                value={formData.userIncidentID}
                onChange={handleInputChange}
                placeholder="Enter the Incident ID if available"
                className="h-12 text-base"
              />
            </div> */}
          </div>

          <div className="space-y-3">
            <Label className="text-base">Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 hover:border-red-400 rounded-lg p-4 transition-colors">
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <Upload className="h-10 w-10 text-gray-400" />
                <Label htmlFor="file-upload" className="cursor-pointer text-red-600 hover:text-red-500 font-medium">
                  Upload files
                </Label>
                <Input id="file-upload" type="file" multiple onChange={handleFileChange} className="hidden" />
                <p className="text-sm text-gray-500 text-center">
                  Maximum file size: 5MB
                  <br />
                  Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between py-3 px-4 bg-white">
                    <span className="text-sm font-medium text-gray-800 truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(index)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || !!dateError}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
            size="lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Incident Report"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default IncidentForm