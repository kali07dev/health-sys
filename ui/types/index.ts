// types/index.ts
export interface IncidentTrendsData {
    commonHazards: {
      type: string;
      frequency: number;
      riskScore: number;
    }[];
    trendsByMonth: {
      month: string;
      incidentCount: number;
      severityScore: number;
      resolvedCount: number;
      newHazards: number;
    }[];
    riskPatterns: {
      category: string;
      frequency: number;
      severity: string;
      departments: string[];
      rootCauses: string[];
    }[];
    recurringIssues: {
      description: string;
      frequency: number;
      lastOccurred: string;
      status: string;
      priority: string;
      locations: string[];
    }[];
  }