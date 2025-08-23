// lib/error-config.ts
"use client"

import { ErrorContext } from './error-handling'
import { ErrorType } from './error-types'

/**
 * Configuration for error messages and user guidance
 * This makes it easy to update error messages without changing multiple files
 */
export const ERROR_MESSAGES: Record<string, ErrorContext> = {
  // Validation errors (user can fix)
  "INVALID_FILES": {
    type: ErrorType.USER_INPUT,
    title: "File validation failed",
    message: "One or more files don't meet the requirements.",
    suggestedAction: "Ensure files are under 5MB and in supported formats (PDF, DOC, JPG, PNG)"
  },
    "VALIDATION_ERROR": {
    type: ErrorType.USER_INPUT,
    title: "Please check your input",
    message: "Some information is missing or incorrect. Please review the highlighted fields.",
    suggestedAction: "Check required fields and correct any validation errors"
  },
  "PASSWORDS_MISMATCH": {
    type: ErrorType.USER_INPUT,
    title: "Passwords don't match",
    message: "The password and confirmation password must be identical.",
    suggestedAction: "Please re-enter both passwords to make sure they match"
  },
  "INVALID_EMAIL": {
    type: ErrorType.USER_INPUT,
    title: "Invalid email address",
    message: "Please enter a valid email address.",
    suggestedAction: "Check the email format (example@domain.com)"
  },
  "INVALID_DATE_RANGE": {
    type: ErrorType.USER_INPUT,
    title: "Invalid date range",
    message: "The start date must be before the end date.",
    suggestedAction: "Please select a valid date range"
  },

  // Authentication errors
  "AUTH_REQUIRED": {
    type: ErrorType.AUTH_ERROR,
    title: "Please sign in",
    message: "You need to be signed in to perform this action.",
    suggestedAction: "Please sign in to your account and try again"
  },
  "AUTH_EXPIRED": {
    type: ErrorType.AUTH_ERROR,
    title: "Session expired", 
    message: "Your session has expired for security reasons.",
    suggestedAction: "Please sign in again to continue"
  },
  "INSUFFICIENT_PERMISSIONS": {
    type: ErrorType.AUTH_ERROR,
    title: "Access denied",
    message: "You don't have permission to perform this action.",
    suggestedAction: "Contact your administrator if you believe you should have access"
  },
  "INVALID_CREDENTIALS": {
    type: ErrorType.AUTH_ERROR,
    title: "Invalid credentials",
    message: "The email or password you entered is incorrect.",
    suggestedAction: "Please check your credentials and try again, or reset your password"
  },

  // Network/connectivity errors (user can retry)
  "NETWORK_ERROR": {
    type: ErrorType.USER_ACTIONABLE,
    title: "Connection problem",
    message: "Unable to connect to the server. This might be a temporary issue.",
    suggestedAction: "Check your internet connection and try again",
    retryable: true
  },
  "TIMEOUT_ERROR": {
    type: ErrorType.USER_ACTIONABLE,
    title: "Request timed out",
    message: "The request took too long to complete.",
    suggestedAction: "Please try again. If the problem persists, contact support",
    retryable: true
  },
  "RATE_LIMITED": {
    type: ErrorType.USER_ACTIONABLE,
    title: "Too many requests",
    message: "You've made too many requests. Please wait a moment.",
    suggestedAction: "Wait a few minutes before trying again",
    retryable: true
  },

  // System errors (user cannot fix)
  "SERVER_ERROR": {
    type: ErrorType.SYSTEM_ERROR,
    title: "Server error",
    message: "Something went wrong on our end. Our team has been notified.",
    suggestedAction: "Please try again later or contact support if urgent"
  },
  "DATABASE_ERROR": {
    type: ErrorType.SYSTEM_ERROR,
    title: "Database error",
    message: "We're experiencing database issues. Our team is working on it.",
    suggestedAction: "Please try again in a few minutes"
  },
  "UNKNOWN_ERROR": {
    type: ErrorType.SYSTEM_ERROR,
    title: "Unexpected error",
    message: "Something unexpected happened. Our team has been notified.",
    suggestedAction: "Please try again or contact support if the problem continues"
  },
  "MAINTENANCE_MODE": {
    type: ErrorType.SYSTEM_ERROR,
    title: "System maintenance",
    message: "The system is currently undergoing maintenance.",
    suggestedAction: "Please check back in a few minutes"
  },

  // Feature-specific errors
  "INCIDENT_SUBMIT_FAILED": {
    type: ErrorType.SYSTEM_ERROR,
    title: "Unable to submit incident",
    message: "There was a problem submitting your incident report.",
    suggestedAction: "Please try again or save your work and contact support"
  },
  "VPC_SUBMIT_FAILED": {
    type: ErrorType.SYSTEM_ERROR,
    title: "Unable to submit VPC report",
    message: "There was a problem submitting your VPC report.",
    suggestedAction: "Please try again or save your work and contact support"
  },
  "REPORT_GENERATION_FAILED": {
    type: ErrorType.SYSTEM_ERROR,
    title: "Report generation failed",
    message: "Unable to generate the requested report.",
    suggestedAction: "Please try again with different parameters or contact support"
  },
  "PROFILE_UPDATE_FAILED": {
    type: ErrorType.SYSTEM_ERROR,
    title: "Profile update failed",
    message: "Unable to update your profile information.",
    suggestedAction: "Please try again or contact support if the problem persists"
  }
}

/**
 * Default fallback error context
 */
export const DEFAULT_ERROR: ErrorContext = {
  type: ErrorType.SYSTEM_ERROR,
  title: "Something went wrong",
  message: "An unexpected error occurred. Please try again.",
  suggestedAction: "If the problem persists, please contact support"
}

/**
 * Patterns to infer error types from error messages
 */
export const ERROR_PATTERNS = [
  {
    pattern: /validation|required|invalid|missing/i,
    errorType: ErrorType.USER_INPUT,
    title: "Please check your input",
    suggestedAction: "Please review and correct the highlighted information"
  },
  {
    pattern: /unauthorized|forbidden|authentication|permission/i,
    errorType: ErrorType.AUTH_ERROR,
    title: "Authentication required",
    suggestedAction: "Please sign in and try again"
  },
  {
    pattern: /network|connection|timeout|offline/i,
    errorType: ErrorType.USER_ACTIONABLE,
    title: "Connection issue",
    suggestedAction: "Please check your connection and try again",
    retryable: true
  },
  {
    pattern: /server|database|internal|system/i,
    errorType: ErrorType.SYSTEM_ERROR,
    title: "System error",
    suggestedAction: "Please try again later or contact support"
  }
]