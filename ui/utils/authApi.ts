import axios, { AxiosInstance } from 'axios';

interface LoginResponse {
  token: string;
  user: User;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserData {
  email: string;
  password: string;
  name: string;
}

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', 
});

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

export const googleLogin = async (tokenId: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/google', { tokenId });
  return response.data;
};