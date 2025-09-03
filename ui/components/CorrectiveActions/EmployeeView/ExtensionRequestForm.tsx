"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { Loader2, Calendar, AlertCircle } from "lucide-react"
import { incidentAPI } from "@/utils/api"
import { useTranslations } from 'next-intl'

interface ExtensionRequestFormProps {
  actionId: string
  currentDueDate: string
  onCancel: () => void
  onSubmitSuccess: () => void
}

export default function ExtensionRequestForm({ 
  actionId, 
  currentDueDate, 
  onCancel, 
  onSubmitSuccess 
}: ExtensionRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newDueDate, setNewDueDate] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('correctiveActions')

  // Set minimum date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newDueDate) {
      setError("Please select a new due date")
      return
    }

    if (!reason.trim()) {
      setError("Please provide a reason for the extension request")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      await incidentAPI.requestExtension(actionId, {
        newDueDate: new Date(newDueDate).toISOString(),
        reason
      })
      
      toast.success(t('messages.extensionRequested'))
      onSubmitSuccess()
    } catch (err) {
      console.error(err)
      setError("Failed to submit extension request. Please try again.")
      toast.error(t('messages.requestFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Request Due Date Extension</h3>
        <p className="text-sm text-gray-600">
          Current due date: {new Date(currentDueDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 p-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newDueDate" className="block text-sm font-medium text-gray-700 mb-1">
            New Due Date
          </label>
          <input 
            type="date"
            id="newDueDate"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            min={minDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Extension
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            placeholder="Please explain why you need an extension..."
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Request Extension
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}