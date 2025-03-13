// utils/api.ts
import axios from 'axios';
import { useSession } from "next-auth/react";
import {
  Investigation,
  Interview,
  ActionEvidence,
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
    // const message = error.response?.data?.message || 'An error occurred';
    // toast.error(message);
    console.log(error)
    return Promise.reject(error);
  }
);

export const InvestigationAPI = {
  closeInvestigation: (id: string) => 
    api.post<Investigation>(`/investigations/${id}/close`).then(res => res.data),

  assignInvestigator: (id: string, investigatorId: string) => 
    api.post<{ message: string }>(`/incidents/${id}/assign-investigator`, { investigatorId }).then(res => res.data),

  scheduleInterview: (id: string, data: Partial<Interview>) => 
    api.post<{ message: string }>(`/interview/schedule`, data).then(res => res.data),

  addFindings: (id: string, findings: Partial<Investigation>) => 
    api.put< Investigation>(`/investigations/${id}`, findings).then(res => res.data),

  getInvestigation: (id: string) => 
    api.get<Investigation>(`/investigations/incident/${id}`).then(res => res.data),

  getInvestigationByEmployee: (id: string) => 
    api.get<Investigation[]>(`/investigations/${id}/employee`).then(res => res.data),

  createInvestigation: (id: string, data: Partial<Investigation>) => 
    api.post<Investigation>(`/investigations`, data).then(res => res.data),

  uploadCompletionProof: (actionId: string, formData: FormData) => 
    api.post<ActionEvidence>(`/corrective-actions/${actionId}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data),

  provideFeedback: (actionId: string, feedback: { feedback: string, status: string }) => 
    api.post<{ message: string }>(`/corrective-actions/${actionId}/feedback`, feedback).then(res => res.data),

  // closeInvestigation: (id: string) => 
  //   api.post<{ message: string }>(`/incidents/${id}/close-investigation`).then(res => res.data),
};

export const useAuthorization = () => {
  const { data: session } = useSession();
  const checkPermission = (requiredRole: string[]) => {
    return requiredRole.includes(session?.role as string);
  };
  return { checkPermission };
};