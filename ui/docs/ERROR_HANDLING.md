# Error Handling System

## Overview

This system provides structured, user-friendly error handling for the Health System application. It categorizes errors into types that help users understand whether they can fix the issue themselves or need to contact support.

## Error Types

- **USER_INPUT**: Errors users can fix by changing their input (validation errors, missing fields)
- **USER_ACTIONABLE**: Errors users can fix by retrying or checking their connection  
- **AUTH_ERROR**: Authentication/permission errors
- **SYSTEM_ERROR**: System errors that users cannot fix

## Basic Usage

### Showing Error Toasts

```typescript
import { showErrorToast, showSuccessToast } from '@/lib/error-handling'

// For API errors with structured error codes
try {
  await submitForm(data)
  showSuccessToast("Form submitted successfully", "Your data has been saved")
} catch (error) {
  showErrorToast(error) // Automatically handles error context
}

// For custom validation errors
if (!email) {
  showErrorToast({ code: 'VALIDATION_ERROR' }, "Email is required")
}

// For password mismatch
if (password !== confirmPassword) {
  showErrorToast({ code: 'PASSWORDS_MISMATCH' })
}
```

### Form Validation Helpers

```typescript
import { validateRequiredFields, validatePasswordMatch, validateFileUpload } from '@/lib/form-validation'

// Validate required fields
const isValid = validateRequiredFields(formData, [
  { field: 'title', label: 'Title' },
  { field: 'description', label: 'Description' },
  { field: 'location', label: 'Location' }
])

// Validate password match
const passwordsMatch = validatePasswordMatch(password, confirmPassword)

// Validate file uploads
const filesValid = validateFileUpload(files, 5) // 5MB max
```

### API Error Classes

The API error classes (IncidentApiError, VPCApiError) now provide better error messages:

```typescript
// Before
throw new IncidentApiError('Failed to submit incident', 'UNKNOWN_ERROR')

// After  
throw new IncidentApiError('Unable to submit incident report. Please try again.', 'SERVER_ERROR')
```

## Error Configuration

Add new error types in `lib/error-config.ts`:

```typescript
"NEW_ERROR_CODE": {
  type: ErrorType.USER_INPUT,
  title: "Error Title",
  message: "Detailed message for users",
  suggestedAction: "What users should do to fix this"
}
```

## Toast Messages

The system automatically shows appropriate toast messages with:

- **Title**: Brief description of what went wrong
- **Message**: More detailed explanation  
- **Suggested Action**: What the user can do to fix it (with 💡 icon)
- **Appropriate Duration**: Longer for auth errors, shorter for system errors

## Migration Guide

### Replace Basic Toast Usage

```typescript
// Before
import { toast } from "react-hot-toast"
toast.error("Failed to load data")

// After
import { showErrorToast } from '@/lib/error-handling'
showErrorToast(error, "Unable to load your data")
```

### Update Try-Catch Blocks

```typescript
// Before
try {
  await api.call()
  toast.success("Success")
} catch {
  toast.error("Failed")
}

// After
try {
  await api.call()
  showSuccessToast("Operation completed", "Your changes have been saved")
} catch (error) {
  showErrorToast(error)
}
```

## Benefits

1. **Consistent Messaging**: All errors follow the same format and tone
2. **User Guidance**: Users know what they can do to fix issues
3. **Error Categorization**: Clear distinction between user vs system errors  
4. **Actionable Feedback**: Specific suggestions for resolution
5. **Maintainable**: Easy to update error messages in one place
6. **Accessible**: Clear, jargon-free language