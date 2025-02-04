// src/api/investigation.ts
import { Investigation } from '@/interfaces/investigation';
import axios from 'axios';

const API_URL = '/api/investigations'; // Replace with your backend API URL

export const fetchAllInvestigations = async (
  status?: string,
  limit?: number,
  offset?: number
): Promise<Investigation[]> => {
  const params: Record<string, any> = {};
  if (status) params.status = status;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;

  const response = await axios.get(API_URL, { params });
  return response.data;
};

export const fetchInvestigationById = async (id: string): Promise<Investigation> => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createInvestigation = async (data: Partial<Investigation>): Promise<Investigation> => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

export const updateInvestigation = async (
  id: string,
  data: Partial<Investigation>
): Promise<Investigation> => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const deleteInvestigation = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};