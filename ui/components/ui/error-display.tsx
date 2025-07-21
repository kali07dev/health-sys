// components/ui/error-display.tsx
"use client"

import React from 'react'
import { AlertCircle, RefreshCw, WifiOff, ShieldAlert } from 'lucide-react'
import { ErrorType, getErrorContext } from '@/lib/error-handling'

interface ErrorDisplayProps {
  error: any
  customMessage?: string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({ error, customMessage, onRetry, className = '' }: ErrorDisplayProps) {
  const context = getErrorContext(error?.code, customMessage || error?.message)

  const getIcon = () => {
    switch (context.type) {
      case ErrorType.USER_INPUT:
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case ErrorType.AUTH_ERROR:
        return <ShieldAlert className="h-5 w-5 text-red-500" />
      case ErrorType.USER_ACTIONABLE:
        return <WifiOff className="h-5 w-5 text-blue-500" />
      case ErrorType.SYSTEM_ERROR:
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getBorderColor = () => {
    switch (context.type) {
      case ErrorType.USER_INPUT:
        return 'border-orange-200 bg-orange-50'
      case ErrorType.AUTH_ERROR:
        return 'border-red-200 bg-red-50'
      case ErrorType.USER_ACTIONABLE:
        return 'border-blue-200 bg-blue-50'
      case ErrorType.SYSTEM_ERROR:
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className={`rounded-md border p-4 ${getBorderColor()} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            {context.title}
          </h3>
          <div className="mt-1 text-sm text-gray-700">
            {context.message}
          </div>
          {context.suggestedAction && (
            <div className="mt-2 text-sm text-gray-600 italic">
              💡 {context.suggestedAction}
            </div>
          )}
          {context.retryable && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FormErrorProps {
  error?: string | null
  className?: string
}

export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null

  return (
    <div className={`mt-1 text-sm text-red-600 ${className}`}>
      {error}
    </div>
  )
}

interface InlineErrorProps {
  message: string
  className?: string
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
  return (
    <div className={`flex items-center text-sm text-red-600 ${className}`}>
      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
      {message}
    </div>
  )
}