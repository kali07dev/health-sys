import { fetchWithAuth } from './userAPI';

// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// const API_BASE_URL = `${BASE_URL}/api/v1`;

export interface VPC {
  id: string
  vpcNumber: string
  reportedBy: string
  reportedDate: string
  department: string
  description: string
  vpcType: string
  actionTaken: string
  incidentRelatesTo: string
}

export interface VPCListResponse {
  data :{
    items: VPC[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export const VPCAPI = {
  createVPC: async (data: Partial<VPC>): Promise<VPC> => {
    return fetchWithAuth('/v1/vpcs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  createBulkVPCs: async (data: Partial<VPC>[]): Promise<VPC[]> => {
    return fetchWithAuth('/v1/vpcs/bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  listAllVPCs: async (params: { page: number, pageSize: number, search?: string }): Promise<VPCListResponse> => {
    const query = new URLSearchParams();
    query.append('page', params.page.toString());
    query.append('pageSize', params.pageSize.toString());
    if (params.search) query.append('search', params.search);
    
    return fetchWithAuth(`/v1/vpcs?${query.toString()}`);
  },

  getVPC: async (id: string): Promise<VPC> => {
    return fetchWithAuth(`/v1/vpcs/${id}`);
  },

  getVPCByNumber: async (vpcNumber: string): Promise<VPC> => {
    return fetchWithAuth(`/v1/vpcs/number/${vpcNumber}`);
  },

  updateVPC: async (id: string, data: Partial<VPC>): Promise<VPC> => {
    return fetchWithAuth(`/v1/vpcs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteVPC: async (id: string): Promise<{ message: string }> => {
    return fetchWithAuth(`/v1/vpcs/${id}`, {
      method: 'DELETE'
    });
  },

  listByDepartment: async (department: string): Promise<VPC[]> => {
    return fetchWithAuth(`/v1/vpcs/department/${department}`);
  },

  listByVpcType: async (vpcType: string): Promise<VPC[]> => {
    return fetchWithAuth(`/v1/vpcs/type/${vpcType}`);
  },
};