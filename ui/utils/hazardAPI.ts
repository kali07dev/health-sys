import axios from "axios";
import { Hazard, CreateHazardRequest, UpdateHazardRequest, HazardFilterParams, HazardListResponse } from "@/interfaces/hazards";
// import { getSession } from "next-auth/react";
import { authOptions } from "@/app/api/auth/auth-options";
import { getServerSession } from "next-auth";


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BASE_URL}/api/v1`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await getServerSession(authOptions);
    
    
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    } else {
      console.warn('No token found in session');
    }
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return config;
  }
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token might be invalid or expired');
      console.error('Response:', error.response.data);
    }
    return Promise.reject(error);
  }
);

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