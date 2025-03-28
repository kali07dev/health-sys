import axios, { AxiosInstance } from 'axios';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  token?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserData {
  email: string,
  password?: string,
  confirmPassword?: string,
  firstName?: string,
  lastName?: string,
  department?: string,
  position?: string,
  role?: string,
  startDate?: string,
  contactNumber?: string,
  officeLocation?: string,
  googleId?: string,
  name?: string,
}

interface GoogleSignupData {
  credential: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}
const AppURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${AppURL}/api`;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL, 
  withCredentials: true 
});

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
};

export const googleSignup = async (signupData: GoogleSignupData): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/google/signup', signupData);
  return response.data;
};

export const googleLogin = async (credential: string, email?: string, name?: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/google', { 
    credential, 
    email, 
    name 
  });
  return response.data;
};