// src/api/employees.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/employees';

export const searchEmployees = async (query: string) => {
  const response = await axios.get(`${BASE_URL}/search`, { params: { query } });
  return response.data;
};