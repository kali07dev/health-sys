// services/api.ts
import { getSession } from "next-auth/react";
export type ProfileUpdateRequest = {
  ID: string;
  FirstName: string;
  LastName: string;
  EmergencyContact: Record<string, string>;
  ContactNumber: string;
  Password: string;
  ConfirmPassword: string;
  UserID: string;
};
const app_url = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const BASE_URL = `${app_url}/api`;

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
  async updateUser(userId: string, userData: { 
    email: string, 
    firstName: string, 
    lastName: string, 
    department: string, 
    position: string, 
    contactNumber: string 
  }) {
    return fetchWithAuth(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  async updateUserStatus(userId: string, status: boolean) {
    return fetchWithAuth(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async getUserProfile() {
    return fetchWithAuth('/v1/profile/employee');
  },

  async updateUserProfile(data: Partial<ProfileUpdateRequest>) {
    return fetchWithAuth('/v1/employees/profile/update', {
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
  async bulkcreateUserWithEmployee(data: unknown) {
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
export interface UserRow {
  email: string;
  firstName: string;  // Note: backend uses firstname (lowercase 'n')
  lastName: string;   // Note: backend uses lastname (lowercase 'n')
  department: string;
  position: string;
  contactNumber: string;
  // Additional required fields
  password: string;
  confirmPassword: string;
  // employeeNumber: string;
  role: 'admin' | 'safety_officer' | 'manager' | 'employee';
  startDate: Date;
  officeLocation: string;
  // Optional fields
  reportingManagerId?: string;
  endDate?: Date;
  isSafetyOfficer?: boolean;
  emergencyContact?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  IsActive: boolean;
  employee?: {
    FirstName: string;
    LastName: string;
    Department: string;
    Position: string;
    ContactNumber: string;
    officeLocation: string;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
}