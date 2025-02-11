import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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
  reportedBy: z.string().uuid(),
  witnesses: z.array(
    z.object({
      name: z.string(),
      contact: z.string()
    })
  ).optional(),
  environmentalConditions: z.record(z.unknown()).optional(),
  equipmentInvolved: z.record(z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const incidentDataStr = formData.get('incidentData')
    
    if (!incidentDataStr || typeof incidentDataStr !== 'string') {
      return NextResponse.json(
        { 
          error: {
            message: 'Invalid incident data',
            code: 'INVALID_DATA'
          }
        },
        { status: 400 }
      )
    }

    const incidentData = JSON.parse(incidentDataStr)
    const validatedData = incidentSchema.parse(incidentData)
    const files = formData.getAll('attachments')
    
    // Validate files
    const fileErrors: string[] = []
    files.forEach((file: any) => {
      if (file.size > MAX_FILE_SIZE) {
        fileErrors.push(`File ${file.name} exceeds maximum size of 5MB`)
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        fileErrors.push(`File ${file.name} has unsupported type ${file.type}`)
      }
    })

    if (fileErrors.length > 0) {
      return NextResponse.json(
        { 
          error: {
            message: 'File validation failed',
            code: 'INVALID_FILES',
            details: fileErrors
          }
        },
        { status: 400 }
      )
    }

    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8000'
    const response = await handleIncidentWithAttachments(validatedData, files, apiBaseUrl)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error processing incident:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: error.errors
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: {
          message: 'Internal server error',
          code: 'UNKNOWN_ERROR'
        }
      },
      { status: 500 }
    )
  }
}

async function handleIncidentWithAttachments(
  data: z.infer<typeof incidentSchema>,
  files: FormDataEntryValue[],
  apiBaseUrl: string
) {
  const formData = new FormData()
  formData.append('incidentData', JSON.stringify(data))

  files.forEach((file) => {
    if (file instanceof File) {
      formData.append('attachments', file)
    }
  })

  const response = await fetch(`${apiBaseUrl}/api/v1/incidents/with-attachments`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create incident')
  }

  return await response.json()
}