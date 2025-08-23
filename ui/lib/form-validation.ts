// lib/form-validation.ts
"use client"

import { showErrorToast } from './error-handling'

/**
 * Validates required form fields and shows user-friendly error messages
 */
export function validateRequiredFields(
  data: Record<string, unknown>, 
  requiredFields: Array<{ field: string; label: string }>
): boolean {
  const missingFields = requiredFields.filter(({ field }) => {
    const value = data[field]
    return !value || (typeof value === 'string' && value.trim() === '')
  })

  if (missingFields.length > 0) {
    const fieldLabels = missingFields.map(({ label }) => label).join(', ')
    showErrorToast(
      { code: 'VALIDATION_ERROR' },
      `Please fill in the following required fields: ${fieldLabels}`
    )
    return false
  }

  return true
}

/**
 * Validates password confirmation
 */
export function validatePasswordMatch(password: string, confirmPassword: string): boolean {
  if (password !== confirmPassword) {
    showErrorToast({ code: 'PASSWORDS_MISMATCH' })
    return false
  }
  return true
}

/**
 * Validates file upload requirements  
 */
export function validateFileUpload(files: File[], maxSizeMB: number = 5): boolean {
  const maxSize = maxSizeMB * 1024 * 1024
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  const errors: string[] = []
  
  files.forEach(file => {
    if (file.size > maxSize) {
      errors.push(`${file.name} exceeds ${maxSizeMB}MB limit`)
    }
    if (!allowedTypes.includes(file.type)) {
      errors.push(`${file.name} is not a supported file type`)
    }
  })

  if (errors.length > 0) {
    showErrorToast({ code: 'INVALID_FILES' }, errors.join('; '))
    return false
  }

  return true
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    showErrorToast(
      { code: 'VALIDATION_ERROR' },
      'Please enter a valid email address'
    )
    return false
  }
  
  return true
}

/**
 * Validates date range (start date must be before end date)
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) {
    showErrorToast(
      { code: 'VALIDATION_ERROR' },
      'Please select both start and end dates'
    )
    return false
  }

  if (new Date(startDate) >= new Date(endDate)) {
    showErrorToast(
      { code: 'VALIDATION_ERROR' },
      'Start date must be before end date'
    )
    return false
  }

  return true
}