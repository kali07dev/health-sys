// app/api/incident-trends/route.ts
import { NextResponse } from "next/server";
import { IncidentTrendsData } from "@/types"; // Define this type based on your backend response

export async function GET() {
  // Simulate fetching data from your backend
  const data: IncidentTrendsData = {
    commonHazards: [
      { type: "Slip and Fall", frequency: 12, riskScore: 3.5 },
      { type: "Fire Hazard", frequency: 8, riskScore: 4.2 },
    ],
    trendsByMonth: [
      { month: "2023-10-01", incidentCount: 15, severityScore: 3.1, resolvedCount: 10, newHazards: 2 },
      { month: "2023-11-01", incidentCount: 20, severityScore: 3.8, resolvedCount: 15, newHazards: 3 },
    ],
    riskPatterns: [
      { category: "Electrical", frequency: 5, severity: "High", departments: ["Maintenance"], rootCauses: ["Faulty Wiring"] },
    ],
    recurringIssues: [
      { description: "Broken Equipment", frequency: 3, lastOccurred: "2023-11-15", status: "Open", priority: "Medium", locations: ["Warehouse A"] },
    ],
  };

  return NextResponse.json(data);
}