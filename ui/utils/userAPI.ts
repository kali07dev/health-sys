// services/api.ts
import { getSession } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

export const userService = {
  async updateUserRole(userId: string, role: string) {
    return fetchWithAuth(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async getUserProfile() {
    return fetchWithAuth('/users/profile');
  },

  async updateUserProfile(data: Partial<EmployeeUpdateData>) {
    return fetchWithAuth('/users/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async createUserWithEmployee(data: Partial<EmployeeUpdateData>) {
    return fetchWithAuth('/auth/signup/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async bulkcreateUserWithEmployee(data: Partial<userRows>) {
    return fetchWithAuth('/auth/signup/employees/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAllUsers() {
    return fetchWithAuth('/v1/users/employees');
  }
};

// Types
export interface EmployeeUpdateData {
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  contactNumber: string;
  officeLocation: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}
export interface  userRows {
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  contactNumber: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  employee?: {
    firstName: string;
    lastName: string;
    department: string;
    position: string;
    contactNumber: string;
    officeLocation: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
}