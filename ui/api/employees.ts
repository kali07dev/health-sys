// src/api/employees.ts
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE_URL = `${BASE_URL}/api/v1/employees`;

export const searchEmployees = async (query: string) => {
  const response = await axios.get(`${API_BASE_URL}/search`, { params: { query } });
  return response.data;
};