import { fetchWithAuth, fetchWithAuthFormData } from "./userAPI"

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export interface VPCAttachment {
  id: string
  fileName: string
  fileType: string
  storagePath: string
  fileSize: number
  createdAt: string
  uploader: string
}

export interface UserBasicInfo {
  id: string
  firstName: string
  lastName: string
}

export interface VPC {
  id: string
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
  createdBy?: UserBasicInfo
  attachments?: VPCAttachment[]
}

export interface VPCListResponse {
  data: {
    items: VPC[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }
}

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

export const VPCAPI = {
  createVPC: async (data: Partial<VPC>, files?: File[]): Promise<VPC> => {
    try {
      // If there are no files, use the simple JSON method
      if (!files || files.length === 0) {
        return fetchWithAuth("/v1/vpcs", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
      }

      // Validate files before upload
      const fileErrors = validateFiles(files)
      if (fileErrors.length > 0) {
        throw new VPCApiError(
          'File validation failed',
          'INVALID_FILES',
          fileErrors
        )
      }

      // Prepare form data for submission with attachments
      const formDataToSend = new FormData();
      formDataToSend.append("vpcData", JSON.stringify(data));
      files.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      // Use the new dedicated function
      return fetchWithAuthFormData("/v1/vpcs/with-attachments", formDataToSend, "POST");
    } catch (error) {
      if (error instanceof VPCApiError) {
        throw error
      }
      throw new VPCApiError(
        'Failed to create VPC',
        'NETWORK_ERROR',
        error
      )
    }
  },

  createBulkVPCs: async (data: Partial<VPC>[]): Promise<VPC[]> => {
    return fetchWithAuth("/v1/vpcs/bulk", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  listAllVPCs: async (params: { page: number; pageSize: number; search?: string }): Promise<VPCListResponse> => {
    const query = new URLSearchParams()
    query.append("page", params.page.toString())
    query.append("pageSize", params.pageSize.toString())
    if (params.search) query.append("search", params.search)

    return fetchWithAuth(`/v1/vpcs?${query.toString()}`)
  },

  getVPC: async (id: string): Promise<VPC> => {
    return fetchWithAuth(`/v1/vpcs/${id}`)
  },

  getVPCByNumber: async (vpcNumber: string): Promise<VPC> => {
    return fetchWithAuth(`/v1/vpcs/number/${vpcNumber}`)
  },

  updateVPC: async (id: string, data: Partial<VPC>): Promise<VPC> => {
    return fetchWithAuth(`/v1/vpcs/${id}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  deleteVPC: async (id: string): Promise<{ message: string }> => {
    return fetchWithAuth(`/v1/vpcs/${id}`, {
      method: "DELETE",
    })
  },

  listByDepartment: async (department: string): Promise<VPC[]> => {
    return fetchWithAuth(`/v1/vpcs/department/${department}`)
  },

  listByVpcType: async (vpcType: string): Promise<VPC[]> => {
    return fetchWithAuth(`/v1/vpcs/type/${vpcType}`)
  },
}