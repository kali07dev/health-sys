// components/IncidentForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import type { ChangeEvent, FormEvent } from "react"
import { submitIncident, IncidentApiError } from "@/lib/api/incidents"
import type { IncidentFormData } from "@/interfaces/incidents"

interface ValidationError {
  field: string
  message: string
}

const IncidentForm = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState<IncidentFormData>({
    type: "injury",
    severityLevel: "low",
    title: "",
    description: "",
    location: "",
    occurredAt: "",
    immediateActionsTaken: "",
    reportedBy: session?.user?.id || "",
  })
  
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<{
    message: string;
    validationErrors?: ValidationError[];
    fileErrors?: string[];
  } | null>(null)

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push('/login')
    return null
  }

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to Array for easier manipulation
      const fileArray = Array.from(e.target.files)
      setFiles(fileArray)
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await submitIncident(formData, files)
      router.push("/incidents")
    } catch (err) {
      if (err instanceof IncidentApiError) {
        switch (err.code) {
          case 'AUTH_REQUIRED':
          case 'AUTH_EXPIRED':
            router.push('/login')
            break
          case 'VALIDATION_ERROR':
            setError({
              message: 'Please correct the following errors:',
              validationErrors: err.details
            })
            break
          case 'INVALID_FILES':
            setError({
              message: 'File upload errors:',
              fileErrors: err.details
            })
            break
          case 'NETWORK_ERROR':
            setError({
              message: 'Network error. Please check your connection and try again.'
            })
            break
          default:
            setError({
              message: err.message || 'An unexpected error occurred'
            })
        }
      } else {
        setError({
          message: 'An unexpected error occurred'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
      {/* ... existing form fields ... */}
      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Existing form fields */}
            <div className="sm:col-span-3">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="injury">Injury</option>
                <option value="near_miss">Near Miss</option>
                <option value="property_damage">Property Damage</option>
                <option value="environmental">Environmental</option>
                <option value="security">Security</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="severityLevel" className="block text-sm font-medium text-gray-700">
                Severity Level
              </label>
              <select
                id="severityLevel"
                name="severityLevel"
                value={formData.severityLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                required
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                name="location"
                id="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="occurredAt" className="block text-sm font-medium text-gray-700">
                Date and Time of Incident
              </label>
              <input
                type="datetime-local"
                name="occurredAt"
                id="occurredAt"
                required
                value={formData.occurredAt}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="immediateActionsTaken" className="block text-sm font-medium text-gray-700">
                Immediate Actions Taken
              </label>
              <textarea
                id="immediateActionsTaken"
                name="immediateActionsTaken"
                rows={3}
                value={formData.immediateActionsTaken}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

      {/* Enhanced file upload section */}
      <div className="sm:col-span-6">
        <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
          Attachments
        </label>
        <input
          type="file"
          id="attachments"
          name="attachments"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
        <p className="mt-1 text-sm text-gray-500">
          Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX
        </p>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-600">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced error display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <p className="text-sm font-medium text-red-800">{error.message}</p>
          {error.validationErrors && (
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {error.validationErrors.map((err, index) => (
                <li key={index} className="text-sm text-red-700">
                  {err.field}: {err.message}
                </li>
              ))}
            </ul>
          )}
          {error.fileErrors && (
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {error.fileErrors.map((err, index) => (
                <li key={index} className="text-sm text-red-700">
                  {err}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ... submit buttons ... */}
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="button"
            // onClick={() => router.push("/incidents")}
            disabled={isSubmitting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default IncidentForm