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
  vpcNumber: z.string(),
  reportedBy: z.string(),
  reportedDate: z.string().transform(str => new Date(str)),
  department: z.string(),
  description: z.string(),
  vpcType: z.enum(['safe', 'unsafe']),
  actionTaken: z.string(),
  incidentRelatesTo: z.string(),
})

export class VPCApiError extends Error {
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
        'File validation failed',
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
        'Authentication expired',
        'AUTH_EXPIRED'
      )
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new VPCApiError(
        errorData.message || 'Failed to submit VPC',
        errorData.code || 'UNKNOWN_ERROR',
        errorData.details
      )
    }

    return await response.json()

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new VPCApiError(
        'Validation error',
        'VALIDATION_ERROR',
        error.errors
      )
    }
    if (error instanceof VPCApiError) {
      throw error
    }
    throw new VPCApiError(
      'Failed to submit VPC',
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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBaseUrl}/api/v1/vpcs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (response.status === 401) {
      throw new VPCApiError(
        'Authentication expired',
        'AUTH_EXPIRED'
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new VPCApiError(
        errorData.message || 'Failed to submit VPC',
        errorData.code || 'UNKNOWN_ERROR',
        errorData.details
      );
    }

    return await response.json();

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new VPCApiError(
        'Validation error',
        'VALIDATION_ERROR',
        error.errors
      );
    }
    if (error instanceof VPCApiError) {
      throw error;
    }
    throw new VPCApiError(
      'Failed to submit VPC',
      'NETWORK_ERROR',
      error
    );
  }
}