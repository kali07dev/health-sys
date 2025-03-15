// lib/api/incidents.ts
import { z } from 'zod'
import { getSession } from 'next-auth/react'
import { IncidentFormData } from '@/interfaces/incidents'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const incidentSchema = z.object({
  type: z.enum(['injury', 'near_miss', 'property_damage', 'environmental', 'security']),
  severityLevel: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().max(255),
  description: z.string(),
  location: z.string().max(255),
  occurredAt: z.string().transform(str => new Date(str)),
  immediateActionsTaken: z.string().optional(),
  reportedBy: z.string(),
  witnesses: z.array(
    z.object({
      name: z.string(),
      contact: z.string()
    })
  ).optional(),
  environmentalConditions: z.record(z.unknown()).optional(),
  equipmentInvolved: z.record(z.unknown()).optional(),
})

export class IncidentApiError extends Error {
  code: string
  details?: unknown

  constructor(message: string, code: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
  }
}

function validateFiles(files: File[]): string[] {
  const fileErrors: string[] = []
  files.forEach((file) => {
    if (file.size > MAX_FILE_SIZE) {
      fileErrors.push(`File ${file.name} exceeds maximum size of 5MB`)
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      fileErrors.push(`File ${file.name} has unsupported type ${file.type}`)
    }
  })
  return fileErrors
}

export async function submitIncident(formData: IncidentFormData, files: File[]) {
  try {
    // Get current session
    const session = await getSession()
    if (!session?.token) {
      throw new IncidentApiError(
        'Authentication required',
        'AUTH_REQUIRED'
      )
    }

    // Validate incident data
    const validatedData = incidentSchema.parse(formData)

    // Validate files
    const fileErrors = validateFiles(files)
    if (fileErrors.length > 0) {
      throw new IncidentApiError(
        'File validation failed',
        'INVALID_FILES',
        fileErrors
      )
    }

    // Prepare form data for submission
    const formDataToSend = new FormData()
    formDataToSend.append('incidentData', JSON.stringify(validatedData))

    // Add files
    files.forEach((file) => {
      formDataToSend.append('attachments', file)
    })

    // Submit to backend with auth header
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${apiBaseUrl}/api/v1/incidents/with-attachments`, {
      method: 'POST',
      body: formDataToSend,
      headers: {
        'Authorization': `Bearer ${session.token}`,
        // Remove explicit Content-Type to let browser set it with boundary
      }
    })
    console.log(response)

    if (response.status === 401) {
      throw new IncidentApiError(
        'Authentication expired',
        'AUTH_EXPIRED'
      )
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new IncidentApiError(
        errorData.message || 'Failed to submit incident',
        errorData.code || 'UNKNOWN_ERROR',
        errorData.details
      )
    }

    return await response.json()

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new IncidentApiError(
        'Validation error',
        'VALIDATION_ERROR',
        error.errors
      )
    }
    if (error instanceof IncidentApiError) {
      throw error
    }
    throw new IncidentApiError(
      'Failed to submit incident',
      'NETWORK_ERROR',
      error
    )
  }
}

export async function submitIncidentWithoutAttachments(formData: IncidentFormData) {
  try {
    // Get current session
    const session = await getSession();
    if (!session?.token) {
      throw new IncidentApiError(
        'Authentication required',
        'AUTH_REQUIRED'
      );
    }

    // Validate incident data
    const validatedData = incidentSchema.parse(formData);

    // Submit to backend with auth header
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBaseUrl}/api/v1/incidents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json', // Explicitly set for JSON payload
      },
      body: JSON.stringify(validatedData), // Send as JSON
    });

    if (response.status === 401) {
      throw new IncidentApiError(
        'Authentication expired',
        'AUTH_EXPIRED'
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new IncidentApiError(
        errorData.message || 'Failed to submit incident',
        errorData.code || 'UNKNOWN_ERROR',
        errorData.details
      );
    }

    return await response.json();

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new IncidentApiError(
        'Validation error',
        'VALIDATION_ERROR',
        error.errors
      );
    }
    if (error instanceof IncidentApiError) {
      throw error;
    }
    throw new IncidentApiError(
      'Failed to submit incident',
      'NETWORK_ERROR',
      error
    );
  }
}