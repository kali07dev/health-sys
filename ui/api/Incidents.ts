// api/incidents.ts
import axios, { AxiosInstance } from 'axios'
import type { Incident, CreateIncidentRequest } from '../interfaces/incidents'

const api: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const createIncident = async (
  incidentData: CreateIncidentRequest,
  files?: File[]
): Promise<Incident> => {
  const formData = new FormData()
  formData.append('incidentData', JSON.stringify(incidentData))

  if (files?.length) {
    files.forEach(file => {
      formData.append('attachments', file)
    })
  }

  const response = await api.post('/incidents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const getIncident = async (id: string): Promise<Incident> => {
  const response = await api.get(`/incidents/${id}`)
  return response.data
}

export const getIncidents = async (): Promise<Incident[]> => {
  const response = await api.get('/incidents')
  return response.data
}

export const updateIncident = async (
  id: string,
  data: Partial<CreateIncidentRequest>
): Promise<Incident> => {
  const response = await api.patch(`/incidents/${id}`, data)
  return response.data
}

export const deleteIncident = async (id: string): Promise<void> => {
  await api.delete(`/incidents/${id}`)
}