// lib/error-handling.ts
"use client"

import { toast } from "react-hot-toast"
import { ERROR_MESSAGES, DEFAULT_ERROR, ERROR_PATTERNS } from './error-config'

// Error types that help categorize errors for users
export enum ErrorType {
  // User can fix these errors by changing their input
  USER_INPUT = "USER_INPUT",
  // User can fix these by retrying or checking their connection
  USER_ACTIONABLE = "USER_ACTIONABLE", 
  // System errors that user cannot fix
  SYSTEM_ERROR = "SYSTEM_ERROR",
  // Authentication/permission errors
  AUTH_ERROR = "AUTH_ERROR"
}

// Error categories with user-friendly messaging
export interface ErrorContext {
  type: ErrorType
  title: string
  message: string
  suggestedAction?: string
  retryable?: boolean
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
export function showErrorToast(error: any, customMessage?: string) {
  let errorCode: string | undefined
  let errorMessage: string | undefined

  // Extract error information from different error types
  if (error?.code) {
    errorCode = error.code
    errorMessage = error.message || customMessage
  } else if (error?.response?.data) {
    errorCode = error.response.data.code
    errorMessage = error.response.data.message || customMessage
  } else if (typeof error === "string") {
    errorMessage = error
  } else if (error?.message) {
    errorMessage = error.message
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
export function isRetryableError(error: any): boolean {
  const errorCode = error?.code || error?.response?.data?.code
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode].retryable || false
  }
  return false
}