// interfaces/dashboard.ts
export interface DashboardFilters {
  timeRange?: string;      // week, month, quarter, year
  department?: string;
  incidentType?: string;
  severityLevel?: string;
  startDate?: string;
  endDate?: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface TrendAnalysis {
  timePeriod: string;
  incidentTrend: TimeSeriesPoint[] | null;
  resolutionTrend: TimeSeriesPoint[] | null;
  severityTrend: TimeSeriesPoint[] | null;
}

export interface HazardSummary {
  type: string;
  frequency: number;
  averageSeverity: number;
  lastReportedAt: string;
  affectedDepartments: string[];
}

export interface IncidentMetrics {
  totalIncidents: number;
  resolvedIncidents: number;
  unresolvedIncidents: number;
  criticalIncidents: number;
  resolutionRate: number;
  averageResolutionTime: number;
  incidentsByType: Record<string, number> | null;
  incidentsBySeverity: Record<string, number> | null;
}

export interface DepartmentMetrics {
  departmentName: string;
  incidentCount: number;
  resolvedCount: number;
  unresolvedCount: number;
  resolutionRate: number;
  criticalIncidents: number;
}

export interface Incident {
  ID: string;
  ReferenceNumber: string;
  Type: string;
  SeverityLevel: string;
  Status: string;
  Title: string;
  Description: string;
  Location: string;
  OccurredAt: string;
  ReportedBy: string;
  AssignedTo: string | null;
  ImmediateActionsTaken: string;
  CreatedAt: string;
  UpdatedAt: string;
  ClosedAt: string;
  // Add other incident fields as needed
}

export interface AdminDashboardResponse {
  systemMetrics: IncidentMetrics;
  departmentMetrics: DepartmentMetrics[];
  recentIncidents: Incident[];
  topHazards: HazardSummary[] | null;
  trendAnalysis: TrendAnalysis;
}

