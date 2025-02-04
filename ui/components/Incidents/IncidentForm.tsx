"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ChangeEvent, FormEvent } from "react"

interface IncidentFormData {
  type: string
  severityLevel: string
  title: string
  description: string
  location: string
  occurredAt: string
  immediateActionsTaken: string
  reportedBy: string // This would typically come from auth context
  witnesses?: { name: string; contact: string }[]
  environmentalConditions?: Record<string, unknown>
  equipmentInvolved?: Record<string, unknown>
}

const IncidentForm = () => {
  const router = useRouter()
  const [formData, setFormData] = useState<IncidentFormData>({
    type: "injury",
    severityLevel: "low",
    title: "",
    description: "",
    location: "",
    occurredAt: "",
    immediateActionsTaken: "",
    reportedBy: "user-uuid", // This should come from your auth context
  })
  
  const [files, setFiles] = useState<FileList | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formDataToSend = new FormData()

      // Add incident data as JSON string
      formDataToSend.append('incidentData', JSON.stringify(formData))

      // Add files if any
      if (files) {
        Array.from(files).forEach(file => {
          formDataToSend.append('attachments', file)
        })
      }

      const response = await fetch('/api/incidents', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        throw new Error('Failed to submit incident')
      }

      router.push("/incidents")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Report New Incident</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please provide all the necessary details about the incident.
            </p>
          </div>

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

            {/* New file upload field */}
            <div className="sm:col-span-6">
              <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">
                Attachments
              </label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                multiple
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload any relevant photos, documents, or files
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/incidents")}
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

