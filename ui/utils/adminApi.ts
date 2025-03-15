// utils/dashboardAPI.ts
import axios from 'axios';
import { AdminDashboardResponse, DashboardFilters } from '@/interfaces/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const dashboardAPI = {
  getAdminDashboard: async (filters?: DashboardFilters): Promise<AdminDashboardResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    const response = await api.get<AdminDashboardResponse>(`/api/v1/dashboard/admin${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  getEmployeeDashboard: async (employeeId: string, timeRange: string = 'month') => {
    const response = await api.get(`/api/v1/dashboard/employee/${employeeId}?timeRange=${timeRange}`);
    return response.data;
  }
};