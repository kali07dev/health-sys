// lib/api/vpc.ts
import { z } from 'zod'
import { getSession } from 'next-auth/react'

export interface VPCAttachment {
//   id: string
  fileName: string
  fileType: string
  storagePath: string
  fileSize: number
  createdAt: string
  uploader: string
}
export interface VPC {
//   id: string
  vpcNumber: string
  reportedBy: string
  reportedDate: string
  department: string
  description: string
  vpcType: string
  actionTaken: string
  incidentRelatesTo: string
  createdAt?: string
  updatedAt?: string
//   createdBy?: UserBasicInfo
  attachments?: VPCAttachment[]
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const vpcSchema = z.object({
  // vpcNumber: z.string(),
  reportedBy: z.string(),
  reportedDate: z.string().transform(str => new Date(str)),
  department: z.string(),
  description: z.string(),
  vpcType: z.string(),
  actionTaken: z.string(),
  incidentRelatesTo: z.string(),
})

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export class VPCApiError extends Error {
  code: string
  details?: unknown

  constructor(message: string, code: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
    this.name = 'VPCApiError'
  }
}

function validateFiles(files: File[]): string[] {
  const fileErrors: string[] = []
  files.forEach((file) => {
    if (file.size > MAX_FILE_SIZE) {
      fileErrors.push(`${file.name} exceeds the 5MB size limit`)
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      fileErrors.push(`${file.name} has an unsupported file type. Please use PDF, DOC, JPG, or PNG files`)
    }
  })
  return fileErrors
}

export async function submitVPC(formData: VPC, files: File[]) {
  try {
    // Get current session
    const session = await getSession()
    if (!session?.token) {
      throw new VPCApiError(
        'Authentication required',
        'AUTH_REQUIRED'
      )
    }

    // Validate VPC data
    const validatedData = vpcSchema.parse(formData)

    // Validate files
    const fileErrors = validateFiles(files)
    if (fileErrors.length > 0) {
      throw new VPCApiError(
        fileErrors.join('; '),
        'INVALID_FILES',
        fileErrors
      )
    }

    // Prepare form data for submission
    const formDataToSend = new FormData()
    formDataToSend.append('vpcData', JSON.stringify(validatedData))

    // Add files
    files.forEach((file) => {
      formDataToSend.append('attachments', file)
    })

    // Submit to backend with auth header
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${apiBaseUrl}/api/v1/vpcs/with-attachments`, {
      method: 'POST',
      body: formDataToSend,
      headers: {
        'Authorization': `Bearer ${session.token}`,
        // Remove explicit Content-Type to let browser set it with boundary
      }
    })

    if (response.status === 401) {
      throw new VPCApiError(
        'Your session has expired. Please sign in again.',
        'AUTH_EXPIRED'
      )
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new VPCApiError(
        errorData.message || 'Unable to submit VPC report. Please try again.',
        errorData.code || 'SERVER_ERROR',
        errorData.details
      )
    }

    return await response.json()

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Create user-friendly validation messages
      const validationMessages = error.errors.map(err => {
        const field = err.path.join('.')
        switch (err.code) {
          case 'invalid_type':
            return `${field} is required`
          case 'too_small':
            return `${field} is too short`
          case 'too_big':
            return `${field} is too long`
          case 'invalid_enum_value':
            return `${field} has an invalid value`
          default:
            return `${field}: ${err.message}`
        }
      })
      
      throw new VPCApiError(
        validationMessages.join('; '),
        'VALIDATION_ERROR',
        error.errors
      )
    }
    if (error instanceof VPCApiError) {
      throw error
    }
    throw new VPCApiError(
      'Unable to submit VPC report due to a connection issue. Please check your internet connection and try again.',
      'NETWORK_ERROR',
      error
    )
  }
}

export async function submitVPCWithoutAttachments(formData: VPC) {
  try {
    // Get current session
    const session = await getSession();
    if (!session?.token) {
      throw new VPCApiError(
        'Authentication required',
        'AUTH_REQUIRED'
      );
    }

    // Validate VPC data
    const validatedData = vpcSchema.parse(formData);

    // Submit to backend with auth header
    const response = await fetch(`${API_BASE_URL}/api/v1/vpcs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (response.status === 401) {
      throw new VPCApiError(
        'Your session has expired. Please sign in again.',
        'AUTH_EXPIRED'
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new VPCApiError(
        errorData.message || 'Unable to submit VPC report. Please try again.',
        errorData.code || 'SERVER_ERROR',
        errorData.details
      );
    }

    return await response.json();

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Create user-friendly validation messages
      const validationMessages = error.errors.map(err => {
        const field = err.path.join('.')
        switch (err.code) {
          case 'invalid_type':
            return `${field} is required`
          case 'too_small':
            return `${field} is too short`
          case 'too_big':
            return `${field} is too long`
          case 'invalid_enum_value':
            return `${field} has an invalid value`
          default:
            return `${field}: ${err.message}`
        }
      })
      
      throw new VPCApiError(
        validationMessages.join('; '),
        'VALIDATION_ERROR',
        error.errors
      );
    }
    if (error instanceof VPCApiError) {
      throw error;
    }
    throw new VPCApiError(
      'Unable to submit VPC report due to a connection issue. Please check your internet connection and try again.',
      'NETWORK_ERROR',
      error
    );
  }
}

interface API_RResponse {
  data: VPC
  message: string
  status: string
}
export async function getVPCById(id: string, authToken?: string): Promise<API_RResponse> {
  if (!authToken) {
    throw new VPCApiError('Authentication required', 'AUTH_REQUIRED');
  }
  const response = await fetch(`${API_BASE_URL}/api/v1/vpcs/${id}`, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch VPC')
  }

  return response.json()
}

export const updateVPC = async (id: string, vpcData: VPC, attachments?: File[]) => {
  const session = await getSession();
    if (!session?.token) {
      throw new VPCApiError(
        'Authentication required',
        'AUTH_REQUIRED'
      );
  }
  const formData = new FormData()
  
  // Add VPC data
  formData.append('vpcData', JSON.stringify(vpcData))
  
  // Add attachments if any
  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append('attachments', file)
    })
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/vpcs/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.token}`,
    },
    body: formData,
  })


  if (!response.ok) {
    throw new Error('Failed to update VPC')
  }

  return response.json()
}

export const updateVPCWithoutAttachments = async (id: string, vpcData: VPC) => {
  const session = await getSession();
    if (!session?.token) {
      throw new VPCApiError(
        'Authentication required',
        'AUTH_REQUIRED'
      );
  }
  const response = await fetch(`${API_BASE_URL}/api/v1/vpcs/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vpcData),
  })

  if (!response.ok) {
    throw new Error('Failed to update VPC')
  }

  return response.json()
}