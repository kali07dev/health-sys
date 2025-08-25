export interface Hazard {
  id: string
  referenceNumber: string
  type: string
  riskLevel: string
  status: string
  title: string
  description: string
  location: string
  fullLocation: string
  recommendedAction?: string
  reportedBy: string
  userReported: string
  userHazardID?: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  closedAt?: string
}

export interface CreateHazardRequest {
  type: 'unsafe_act' | 'unsafe_condition' | 'environmental'
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  title: string
  description: string
  location: string
  fullLocation: string
  recommendedAction?: string
  reporterFullName?: string
  assignedTo?: string
}

export interface UpdateHazardRequest {
  type?: 'unsafe_act' | 'unsafe_condition' | 'environmental'
  riskLevel?: 'low' | 'medium' | 'high' | 'extreme'
  status?: 'new' | 'assessing' | 'action_required' | 'resolved' | 'closed'
  title?: string
  description?: string
  location?: string
  fullLocation?: string
  recommendedAction?: string
  userHazardID?: string
  reporterFullName?: string
}

export interface HazardFilterParams {
  page?: number
  pageSize?: number
  type?: string
  status?: string
  riskLevel?: string
  search?: string
}

export interface HazardListResponse {
  data: Hazard[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
