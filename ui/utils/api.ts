// utils/api.ts
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useSession } from "next-auth/react"


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

export const incidentAPI = {
  getIncident: (id: string) => api.get(`/incidents/${id}`),
  assignInvestigator: (id: string, investigatorId: string) => 
    api.post(`/incidents/${id}/assign-investigator`, { investigatorId }),
  scheduleInterview: (id: string, data: any) => 
    api.post(`/incidents/${id}/schedule-interview`, data),
  addFindings: (id: string, findings: any) => 
    api.post(`/incidents/${id}/findings`, findings),
  getInvestigation: (id: string) => 
    api.get(`/incidents/${id}/investigation`),
  assignPreventiveAction: (id: string, data: any) => 
    api.post(`/incidents/${id}/preventive-actions`, data),
  uploadCompletionProof: (actionId: string, formData: FormData) => 
    api.post(`/corrective-actions/${actionId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  provideFeedback: (actionId: string, feedback: any) => 
    api.post(`/corrective-actions/${actionId}/feedback`, feedback),
  closeInvestigation: (id: string) => 
    api.post(`/incidents/${id}/close-investigation`),
};

export const useAuthorization = () => {
  const checkPermission = (requiredRole: string[]) => {
    // Get session from your session management system
    // const session = {} // Replace with your session management
    const { data: session, status } = useSession()
    
    return requiredRole.includes(session?.role as string);
  };

  return { checkPermission };
};