// src/api/users.ts
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BASE_URL}/api/users`;

export const fetchUsers = async () => {
  const response = await axios.get(`${API_BASE_URL}`);
  return response.data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const response = await axios.put(`${API_BASE_URL}/${userId}/role`, { role });
  return response.data;
};