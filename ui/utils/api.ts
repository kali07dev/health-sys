// utils/api.ts
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useSession } from "next-auth/react";
import {
  Incident,
  Investigation,
  Interview,
  CorrectiveAction,
  ActionEvidence,
  User,
} from '@/interfaces/incidents';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    // toast.error(message);
    console.log(error)
    return Promise.reject(error);
  }
);

export const incidentAPI = {
  getIncident: (id: string) => 
    api.get<Incident>(`/incidents/${id}/view`).then(res => res.data),

  getAllIncidents: () => 
    api.get<{ data: Incident[]; total: number }>(`/incidents`).then((res) => res.data.data),

  getCorrectiveActions: (id: string) =>
    api.get<CorrectiveAction[]>(`/incidents/${id}`).then(res => res.data),

  getCorrectiveActionsByIncidentID: (id: string) =>
    api.get<CorrectiveAction[]>(`/incidents/${id}/actions`).then(res => res.data),


  assignInvestigator: (id: string, investigatorId: string) => 
    api.post<{ message: string }>(`/incidents/${id}/assign-investigator`, { investigatorId }).then(res => res.data),

  scheduleInterview: (id: string, data: Partial<Interview>) => 
    api.post<{ message: string }>(`/incidents/${id}/schedule-interview`, data).then(res => res.data),

  addFindings: (id: string, findings: Partial<Investigation>) => 
    api.post<{ message: string }>(`/incidents/${id}/findings`, findings).then(res => res.data),

  getInvestigation: (id: string) => 
    api.get<Investigation>(`/incidents/${id}/investigation`).then(res => res.data),

  assignPreventiveAction: (id: string, data: Partial<CorrectiveAction>) => 
    api.post<{ message: string }>(`/incidents/${id}/preventive-actions`, data).then(res => res.data),

  uploadCompletionProof: (actionId: string, formData: FormData) => 
    api.post<ActionEvidence>(`/corrective-actions/${actionId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),

  provideFeedback: (actionId: string, feedback: { feedback: string, status: string }) => 
    api.post<{ message: string }>(`/corrective-actions/${actionId}/feedback`, feedback).then(res => res.data),

  closeInvestigation: (id: string) => 
    api.post<{ message: string }>(`/incidents/${id}/close-investigation`).then(res => res.data),
};

export const useAuthorization = () => {
  const checkPermission = (requiredRole: string[]) => {
    const { data: session } = useSession();
    return requiredRole.includes(session?.role as string);
  };
  return { checkPermission };
};