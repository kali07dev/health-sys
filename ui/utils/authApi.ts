// import { useAuthStore } from '@/stores/authStore';
// import { create } from 'zustand'
import axios, { AxiosInstance } from 'axios';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserData {
  email: string,
  password: string,
  confirmPassword: string, // Add confirm password field
  // employeeNumber: string,
  firstName: string,
  lastName: string,
  department: string,
  position: string,
  role: string, // Always set to "employee"
  startDate: string,
  contactNumber: string,
  officeLocation: string,
}

const AppURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${AppURL}/api`;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL, 
  withCredentials: true 
});
// // Add response interceptor to handle 401 errors
// api.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response?.status === 401) {
//       // Clear user store and redirect to login
//       useAuthStore.getState().setUser(null)
//       window.location.href = '/login'
//     }
//     return Promise.reject(error)
//   }
// )

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);
export const login = async (
  email: string, 
  password: string
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
};

export const signUp = async (userData: UserData): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/signup', userData);
  return response.data;
};

export const Users = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/user');
  return response.data;
}

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
  // Access store directly without hook
  // useAuthStore.getState().setUser(null);
};
// export const googleLogin = async (tokenId: string): Promise<LoginResponse> => {
//   const response = await api.post<LoginResponse>('/auth/google', { tokenId });
//   return response.data;
// };
export const googleLogin = async (credential: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/google', { credential });
    return response.data;
};