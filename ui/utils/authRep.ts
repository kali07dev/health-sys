// src/utils/userAPI.ts (or your API utility file)
import { getSession } from "next-auth/react"; // For client-side session
// import { getServerSession } from "next-auth/next"; // For server-side session (if needed, but more complex here)
// import { authOptions } from "@/app/api/auth/auth-options"; // For server-side session

const app_url = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const BASE_URL = `${app_url}/api`;

export class AuthApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.data = data;
  }
}


export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  expectBlob: boolean = false // Added to indicate if a blob is expected
): Promise<unknown> { // Returns 'any' because it can be JSON or Response
  const session = await getSession(); // Client-side session

  const headers: Record<string, string> = {
    // 'Content-Type': 'application/json', // Don't set default Content-Type here, let options override or be absent for GET
    ...(options.headers as Record<string, string>),
  };
  
  // Set Content-Type to application/json by default if there's a body and no Content-Type is already set
  if (options.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }


  if (session?.token) { // Adjust if your session structure for token is different
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    // credentials: 'include', // Usually not needed with Bearer tokens unless for specific cookie scenarios
  });

  if (expectBlob) {
    // For blob responses, we return the raw response object.
    // The caller will check response.ok and handle .blob()
    return response;
  }

  // For JSON responses:
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // If response is not JSON, use statusText
      errorData = { message: response.statusText || 'An unknown error occurred' };
    }
    console.error(`API Error (${response.status}) for ${endpoint}:`, errorData);
    throw new AuthApiError(
      errorData.message || errorData.error || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  // Handle empty responses (e.g., 204 No Content)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }

  return response.json();
}


// Example of fetchWithAuthFormData if you need it (based on your previous code)
export async function fetchWithAuthFormData(
  endpoint: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST" // Typically POST or PUT for FormData
): Promise<unknown> {
  const session = await getSession();
  const headers: Record<string, string> = {}; // FormData sets its own Content-Type with boundary

  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: method,
    headers,
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      errorData = { message: response.statusText || 'An unknown error occurred' };
    }
    console.error(`API Error (${response.status}) for FormData ${endpoint}:`, errorData);
    throw new AuthApiError(
      errorData.message || errorData.error || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }
  return response.json();
}