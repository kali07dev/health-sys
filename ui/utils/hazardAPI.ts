import axios from "axios";
import { Hazard, CreateHazardRequest, UpdateHazardRequest, HazardFilterParams, HazardListResponse } from "@/interfaces/hazards";
// import { apiClient } from './api-client'


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BASE_URL}/api/v1`;
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});


export const hazardAPI = {
  // Create a new hazard
  createHazard: async (data: CreateHazardRequest): Promise<Hazard> => {
    const response = await apiClient.post('/hazards', data)
    return response.data
  },

  // Get all hazards with filtering and pagination
  getAllHazardsFiltered: async (params: HazardFilterParams = {}): Promise<HazardListResponse> => {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString())
    if (params.type) searchParams.append('type', params.type)
    if (params.status) searchParams.append('status', params.status)
    if (params.riskLevel) searchParams.append('risk_level', params.riskLevel)
    if (params.search) searchParams.append('search', params.search)

    const response = await apiClient.get(`/hazards?${searchParams.toString()}`)
    return response.data
  },

  // Get a single hazard by ID
  getHazard: async (id: string): Promise<Hazard> => {
    const response = await apiClient.get(`/hazards/${id}`)
    return response.data
  },

  // Update an existing hazard
  updateHazard: async (id: string, data: UpdateHazardRequest): Promise<Hazard> => {
    const response = await apiClient.put(`/hazards/${id}`, data)
    return response.data
  },

  // Delete a hazard
  deleteHazard: async (id: string): Promise<void> => {
    await apiClient.delete(`/hazards/${id}`)
  },

  // Assign hazard to user
  assignHazard: async (id: string, userId: string): Promise<Hazard> => {
    const response = await apiClient.post(`/hazards/${id}/assign`, { userId })
    return response.data
  }
}