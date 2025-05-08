// src/types/reports.ts

export type UserRole = "admin" | "safety_officer" | "manager" | "employee";
export type ReportFormat = "pdf" | "html";

export interface ReportGenerationParams {
  vpcId: string; // This seems specific to a single VPC report
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  userRole: UserRole;
  outputFormat: ReportFormat;
  includeStats: boolean;
}

// If you intend to generate reports for ALL VPCs or a filtered list (not just one ID)
// the params might look different, e.g., no vpcId, but other filters.
// For now, I'm basing it on your Go handler which takes a vpcID.

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}