// components/investigations/edit-investigation-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Investigation } from "@/interfaces/investigation"

interface EditInvestigationFormProps {
  investigation: Investigation
  onSuccess: () => void
}

export const EditInvestigationForm = ({ investigation, onSuccess }: EditInvestigationFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Investigation>({
    defaultValues: investigation
  })
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data: Investigation) => {
    setIsLoading(true)
    try {
      // Here you would typically make an API call to update the investigation
      // For example: await updateInvestigation(data)
      console.log("Updating investigation:", data)
      onSuccess()
    } catch (error) {
      console.error("Failed to update investigation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="root_cause" className="block text-sm font-medium text-gray-700">Root Cause</label>
        <Textarea id="root_cause" {...register("root_cause", { required: true })} className="mt-1" />
        {errors.root_cause && <span className="text-red-500 text-sm">This field is required</span>}
      </div>

      <div>
        <label htmlFor="findings" className="block text-sm font-medium text-gray-700">Findings</label>
        <Textarea id="findings" {...register("findings", { required: true })} className="mt-1" />
        {errors.findings && <span className="text-red-500 text-sm">This field is required</span>}
      </div>

      <div>
        <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700">Recommendations</label>
        <Textarea id="recommendations" {...register("recommendations", { required: true })} className="mt-1" />
        {errors.recommendations && <span className="text-red-500 text-sm">This field is required</span>}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
        <Select {...register("status", { required: true })}>
          <option value="in_progress">In Progress</option>
          <option value="pending_review">Pending Review</option>
          <option value="completed">Completed</option>
          <option value="reopened">Reopened</option>
        </Select>
        {errors.status && <span className="text-red-500 text-sm">This field is required</span>}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Investigation"}
      </Button>
    </form>
  )
}