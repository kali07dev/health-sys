// lib/api/reports.ts
import axios from 'axios';

export interface ReportRequest {
  reportType: 'safety_performance' | 'incident_trends' | 'location_analysis' | 'compliance_report';
  startDate: string;
  endDate: string;
  department?: string;
  location?: string;
  employeeID?: string;
  format: 'pdf' | 'excel';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const reportsApi = {
  generateReport: async (request: ReportRequest) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/reports/generate`, request, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  downloadReport: async (request: ReportRequest) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/reports/download`, request, {
        responseType: 'blob',
        withCredentials: true,
      });
      
      const fileName = `${request.reportType}_${request.startDate}_${request.endDate}.${request.format}`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      throw error;
    }
  }
};