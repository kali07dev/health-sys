// lib/error-handling.ts
"use client"

import { toast } from "react-hot-toast"
import { ERROR_MESSAGES, DEFAULT_ERROR, ERROR_PATTERNS } from './error-config'
import { ErrorType } from './error-types'

// Error categories with user-friendly messaging
export interface ErrorContext {
  type: ErrorType
  title: string
  message: string
  suggestedAction?: string
  retryable?: boolean
}

// Interface for error objects that can be passed to error handling functions
export interface AppError {
  code?: string
  message?: string
  response?: {
    data?: {
      code?: string
      message?: string
    }
  }
}

/**
 * Gets user-friendly error context from error code or message
 */
export function getErrorContext(errorCode?: string, customMessage?: string): ErrorContext {
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    const context = ERROR_MESSAGES[errorCode]
    return customMessage ? { ...context, message: customMessage } : context
  }
  
  // Try to infer error type from common patterns
  if (customMessage) {
    const lowerMessage = customMessage.toLowerCase()
    
    for (const pattern of ERROR_PATTERNS) {
      if (pattern.pattern.test(lowerMessage)) {
        return {
          type: pattern.errorType,
          title: pattern.title,
          message: customMessage,
          suggestedAction: pattern.suggestedAction,
          retryable: pattern.retryable
        }
      }
    }
  }
  
  return {
    ...DEFAULT_ERROR,
    message: customMessage || DEFAULT_ERROR.message
  }
}

/**
 * Displays an error toast with appropriate styling and messaging
 */
export function showErrorToast(error: unknown, customMessage?: string) {
  let errorCode: string | undefined
  let errorMessage: string | undefined

  // Extract error information from different error types
  if (typeof error === "object" && error !== null && "code" in error) {
    const err = error as { code?: string; message?: string }
    errorCode = err.code
    errorMessage = err.message || customMessage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } else if (typeof error === "object" && error !== null && "response" in error && (error as any).response?.data) {
    const err = error as { response?: { data?: { code?: string; message?: string } } }
    errorCode = err.response?.data?.code
    errorMessage = err.response?.data?.message || customMessage
  } else if (typeof error === "string") {
    errorMessage = error
  } else if (typeof error === "object" && error !== null && "message" in error) {
    const err = error as { message?: string }
    errorMessage = err.message
  }

  const context = getErrorContext(errorCode, errorMessage)
  
  // Create toast content with action if available
  const toastContent = context.suggestedAction 
    ? `${context.title}\n${context.message}\n💡 ${context.suggestedAction}`
    : `${context.title}\n${context.message}`

  // Show toast with appropriate styling based on error type
  switch (context.type) {
    case ErrorType.USER_INPUT:
      toast.error(toastContent, { duration: 6000 })
      break
    case ErrorType.AUTH_ERROR:
      toast.error(toastContent, { duration: 8000 })
      break
    case ErrorType.USER_ACTIONABLE:
      toast.error(toastContent, { duration: 7000 })
      break
    case ErrorType.SYSTEM_ERROR:
      toast.error(toastContent, { duration: 5000 })
      break
    default:
      toast.error(toastContent, { duration: 5000 })
  }

  return context
}

/**
 * Displays a success toast with consistent styling
 */
export function showSuccessToast(message: string, details?: string) {
  const toastContent = details 
    ? `${message}\n${details}`
    : message

  toast.success(toastContent, { duration: 4000 })
}

/**
 * Displays an info toast with consistent styling  
 */
export function showInfoToast(message: string, details?: string) {
  const toastContent = details 
    ? `${message}\n${details}`
    : message

  toast(toastContent, { duration: 4000 })
}

/**
 * Helper to determine if an error suggests a retry action
 */
export function isRetryableError(error: unknown): boolean {
  let errorCode: string | undefined
  if (typeof error === "object" && error !== null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ("code" in error && typeof (error as any).code === "string") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorCode = (error as any).code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if ("response" in error && (error as any).response?.data?.code) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorCode = (error as any).response.data.code
    }
  }

  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode].retryable || false
  }
  return false
}