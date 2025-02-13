// src/api/users.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/users';

export const fetchUsers = async () => {
  const response = await axios.get(`${BASE_URL}`);
  return response.data;
};

export const updateUserRole = async (userId: string, role: string) => {
  const response = await axios.put(`${BASE_URL}/${userId}/role`, { role });
  return response.data;
};