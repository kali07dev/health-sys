// app/(main)/error-demo/page.tsx
"use client"

import React, { useState } from 'react'
import { showErrorToast, showSuccessToast, showInfoToast } from '@/lib/error-handling'
import { validateRequiredFields, validatePasswordMatch, validateFileUpload } from '@/lib/form-validation'
import { ErrorDisplay, FormError, InlineError } from '@/components/ui/error-display'

export default function ErrorDemoPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    description: ''
  })
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (!formData.description) newErrors.description = 'Description is required'

    // Password match validation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const demonstrateErrors = {
    validation: () => showErrorToast({ code: 'VALIDATION_ERROR' }, 'Please fill in all required fields'),
    authExpired: () => showErrorToast({ code: 'AUTH_EXPIRED' }),
    networkError: () => showErrorToast({ code: 'NETWORK_ERROR' }),
    serverError: () => showErrorToast({ code: 'SERVER_ERROR' }),
    fileError: () => showErrorToast({ code: 'INVALID_FILES' }, 'file.exe exceeds the 5MB size limit'),
    customError: () => showErrorToast(null, 'This is a custom error message that will be categorized automatically'),
    success: () => showSuccessToast('Operation completed successfully', 'Your data has been saved'),
    info: () => showInfoToast('System maintenance scheduled', 'The system will be down for 30 minutes tonight')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showErrorToast({ code: 'VALIDATION_ERROR' }, 'Please fix the errors below')
      return
    }

    if (files.length > 0 && !validateFileUpload(files)) {
      return
    }

    showSuccessToast('Form submitted successfully', 'All validations passed!')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Error Handling System Demo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Demo Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Toast Error Examples</h2>
          <div className="space-y-3">
            <button
              onClick={demonstrateErrors.validation}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Validation Error (User Input)
            </button>
            <button
              onClick={demonstrateErrors.authExpired}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Authentication Error
            </button>
            <button
              onClick={demonstrateErrors.networkError}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Network Error (Retryable)
            </button>
            <button
              onClick={demonstrateErrors.serverError}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              System Error
            </button>
            <button
              onClick={demonstrateErrors.fileError}
              className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              File Validation Error
            </button>
            <button
              onClick={demonstrateErrors.customError}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Auto-categorized Error
            </button>
            <button
              onClick={demonstrateErrors.success}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Success Message
            </button>
            <button
              onClick={demonstrateErrors.info}
              className="w-full px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500"
            >
              Info Message
            </button>
          </div>
        </div>

        {/* Demo Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Form Validation Demo</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <FormError error={errors.email} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <FormError error={errors.password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <FormError error={errors.confirmPassword} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <FormError error={errors.description} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments (Max 5MB each)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {files.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {files.length} file(s) selected
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Submit Form
            </button>
          </form>
        </div>
      </div>

      {/* Error Display Examples */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Error Display Components</h2>
        
        <ErrorDisplay 
          error={{ code: 'NETWORK_ERROR' }}
          onRetry={() => showInfoToast('Retrying...')}
        />
        
        <ErrorDisplay 
          error={{ code: 'AUTH_EXPIRED' }}
          customMessage="Your session expired while editing this form"
        />

        <div className="p-4 bg-gray-50 rounded">
          <InlineError message="This field is required" />
        </div>
      </div>

      {/* Documentation */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">How It Works</h2>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>Error Categories:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium">USER_INPUT</span> - User can fix by changing input (orange)</li>
            <li><span className="font-medium">AUTH_ERROR</span> - Authentication/permission issues (red)</li>
            <li><span className="font-medium">USER_ACTIONABLE</span> - User can retry or check connection (blue)</li>
            <li><span className="font-medium">SYSTEM_ERROR</span> - System issues user cannot fix (red)</li>
          </ul>
          <p className="mt-4">
            Each error shows a clear title, detailed message, and actionable guidance with a 💡 icon.
            Retryable errors show a "Try Again" button, and toast duration varies by error type.
          </p>
        </div>
      </div>
    </div>
  )
}