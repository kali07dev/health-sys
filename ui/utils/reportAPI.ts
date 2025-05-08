// src/utils/reportAPI.ts
import { fetchWithAuth, AuthApiError as GenericAuthApiError } from "./authRep"; // Assuming userAPI.ts contains fetchWithAuth
import type { ReportGenerationParams, ApiErrorResponse } from "./reports";

// Re-define or extend AuthApiError if ReportApiError needs specific properties
export class ReportApiError extends Error {
  status: number;
  data?: ApiErrorResponse; // Your specific error structure for reports

  constructor(message: string, status: number, data?: ApiErrorResponse) {
    super(message);
    this.name = "ReportApiError";
    this.status = status;
    this.data = data;
  }
}

export const ReportAPI = {
  generateReport: async (params: ReportGenerationParams): Promise<Blob> => {
    const query = new URLSearchParams();
    // Only append dates if they are provided
    if (params.startDate) query.append("start_date", params.startDate);
    if (params.endDate) query.append("end_date", params.endDate);
    
    query.append("role", params.userRole);
    // query.append("format", params.outputFormat); // Not needed if using specific format endpoint
    query.append("stats", params.includeStats.toString());

    // Using specific format endpoints as they are clearer
    const endpoint = `/v1/vpcs/reports/${params.vpcId}/${params.outputFormat}?${query.toString()}`;
    // If using the generic endpoint:
    // query.append("format", params.outputFormat);
    // const endpoint = `/v1/vpcs/reports/${params.vpcId}?${query.toString()}`;


    try {
      // Call fetchWithAuth expecting a blob (raw Response object)
      const response = (await fetchWithAuth(
        endpoint,
        { method: "GET" },
        true // expectBlob is true
      )) as Response; // Cast the 'any' return to 'Response'

      if (!response.ok) {
        // If the response is not OK, try to parse it as JSON for an error message
        let errorJson: ApiErrorResponse | undefined;
        try {
          errorJson = await response.json();
        } catch (e) {
          // If parsing JSON fails, it means the error response wasn't JSON
          console.warn("Error response from server was not valid JSON.", e);
        }
        throw new ReportApiError(
          errorJson?.error || `Report generation failed: ${response.statusText}`,
          response.status,
          errorJson
        );
      }

      // If response is OK, get the blob
      const blob = await response.blob();
      if (blob.size === 0) {
          throw new ReportApiError(
            "Generated report file is empty. Please check server logs or report parameters.",
            response.status // or a custom status/code
          );
      }
      return blob;

    } catch (error) {
      if (error instanceof ReportApiError) {
        throw error;
      }
      // Handle errors from fetchWithAuth itself (e.g. network error before response)
      if (error instanceof GenericAuthApiError) { // If fetchWithAuth throws its own custom error
         console.error("Authentication or Network error in generateReport:", error.message, error.data);
         throw new ReportApiError(
          error.message || "A network or authentication error occurred.",
          error.status || 0, // GenericAuthApiError should have a status
          { error: error.message, details: error.data }
        );
      }
      
      console.error("Unexpected error in generateReport:", error);
      // Fallback for other unexpected errors
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      throw new ReportApiError(errorMessage, 0);
    }
  },
};