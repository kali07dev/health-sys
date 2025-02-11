// src/lib/api-client.ts
import axios from "axios";
import { cookies } from "next/headers";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Add request interceptor to attach cookies for server components
api.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") {
    const cookieStore = cookies();
    const token = (await cookieStore).get("auth-token")?.value;
    if (token) {
      config.headers.Cookie = `auth-token=${token}`;
    }
  }
  return config;
});

// Response interceptor remains similar
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;