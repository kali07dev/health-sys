// utils/api.ts
import axios from 'axios';
// import { toast } from 'react-hot-toast';
import { useSession } from "next-auth/react";
import { getSession } from "next-auth/react";
import {
  Incident,
  IncidentAttachment,
  Investigation,
  Interview,
  CorrectiveAction,
  ActionEvidence,
  // User,
} from '@/interfaces/incidents';


interface IncidentResponse {
  incident: Incident;
  attachments: IncidentAttachment[];
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Response interceptor for error handling
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const incidentAPI = {

  updateCorrectiveAction: (actionId: string, data: Partial<CorrectiveAction>) => 
    api.put(`/actions/${actionId}`, data)
      .then(res => res.data)
      .catch(error => {
        console.error('Error updating corrective action:', error);
        throw error;
      }),
    
  uploadActionEvidence: async (actionId: string, formData: FormData) => {
        // Create a modified FormData that matches backend expectations
        const evidenceData = {
          actionID: actionId,
          fileType: "document",
          description: formData.get('description') || ''
        };
        
        // Add the JSON data
        formData.append('evidenceData', JSON.stringify(evidenceData));
        
        // Rename files to attachments as expected by backend
        const files = formData.getAll('files');
        formData.delete('files');
        files.forEach(file => {
          formData.append('attachments', file);
        });
        
        try {
      const res = await api.post(`/actions/${actionId}/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    }
  },

  closeIncident: (incidentID: string) => {
    api.post<Incident>(`incidents/${incidentID}/close`).then(res => res.data)
  },

  getIncident: (id: string) => 
    api.get<IncidentResponse>(`/incidents/${id}/view`).then(res => res.data),

  getAllIncidents: () => 
    api.get<{ data: Incident[]; total: number }>(`/incidents`).then((res) => res.data.data),

  getIncidentsByEmployee: (employeeId: string) => 
    api.get<Incident[]>(`/incidents/employee/${employeeId}`).then((res) => res.data),

  getCorrectiveActions: (id: string) =>
    api.get<CorrectiveAction[]>(`/incidents/${id}`).then(res => res.data),

  getCorrectiveActionsByIncidentID: (id: string) =>
    api.get<CorrectiveAction[]>(`/incidents/${id}/actions`).then(res => res.data),

  getCorrectiveActionsByUserID: (id: string) =>
    api.get<CorrectiveAction[]>(`/incidents/${id}/user`).then(res => res.data),


  assignInvestigator: (id: string, investigatorId: string) => 
    api.post<{ message: string }>(`/incidents/${id}/assign-investigator`, { investigatorId }).then(res => res.data),

  scheduleInterview: (id: string, data: Partial<Interview>) => 
    api.post<{ message: string }>(`/interview/schedule`, data).then(res => res.data),

  addFindings: (id: string, findings: Partial<Investigation>) => 
    api.post<{ message: string }>(`/incidents/${id}/findings`, findings).then(res => res.data),

  getInvestigation: (id: string) => 
    api.get<Investigation>(`/investigations/incident/${id}`).then(res => res.data),

  createInvestigation: (id: string, data: Partial<Investigation>) => 
    api.post<Investigation>(`/investigations`, data).then(res => res.data),

  assignPreventiveAction: (id: string, data: Partial<CorrectiveAction>) => 
    api.post<{ message: string }>(`/incidents/${id}/preventive-actions`, data).then(res => res.data),

  createCorrectiveAction: ( data: Partial<CorrectiveAction>) => 
    api.post<{ message: string }>(`/actions`, data).then(res => res.data),


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
  const { data: session } = useSession();
  
  const checkPermission = (requiredRole: string[]) => {
    return requiredRole.includes(session?.role as string);
  };
  return { checkPermission };
};