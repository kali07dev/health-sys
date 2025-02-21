// departmentAPI.ts
import { fetchWithAuth } from "./userAPI";

export interface Department {
    ID: string;
    Name: string;
}


export const departmentService = {
  async getDepartments() {
      return fetchWithAuth('/v1/departments');
    },
  
    async updateDepartment(data: Partial<Department>) {
      return fetchWithAuth('/v1/departments/update', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async createDepartment(data: Partial<Department>) {
        return fetchWithAuth('/v1/departments', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
}
