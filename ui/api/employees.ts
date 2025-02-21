// src/api/employees.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/v1/employees';

export const searchEmployees = async (query: string) => {
  const response = await axios.get(`${BASE_URL}/search`, { params: { query } });
  return response.data;
};