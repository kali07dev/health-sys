// src/app/reports/vpc-preview/page.tsx
import { Suspense } from 'react';
import VPCReportViewer from './VPCReportViewer';
import LoadingVPCReport from './loading'; // Your loading component
import type { VPCReport } from './types'; // Adjust path if types.ts is elsewhere

// Sample data simulation - In a real app, fetch this from an API or database
const sampleVPCReportData: VPCReport = {
  id: "vpc-12345",
  vpcNumber: "VPC-2025-0042",
  reportedDate: "2025-05-04T10:30:00Z",
  department: "Operations",
  description: "Observed a potential trip hazard in the warehouse corridor. A pallet was placed in the walkway without proper marking or barriers.",
  vpcType: "unsafe",
  actionTaken: "1. Immediately moved the pallet to the designated storage area\n2. Placed caution tape around the area\n3. Notified warehouse supervisor\n4. Scheduled safety briefing for all warehouse staff",
  incidentRelatesTo: "Workplace Hazard",
  reporter: {
    name: "Jane Smith",
    position: "Warehouse Coordinator",
    employeeNumber: "EMP-4532"
  },
  creator: {
    name: "Robert Johnson",
    role: "Safety Officer",
    employeeNumber: "EMP-2156"
  },
  attachments: [
    {
      fileName: "hazard-photo-1.jpg",
      fileType: "image/jpeg",
      fileSize: 1245678,
      uploadedBy: "EMP-4532",
      url: "/attachments/hazard-photo-1.jpg" // Example URL
    },
    {
      fileName: "incident-form.pdf",
      fileType: "application/pdf",
      fileSize: 325890,
      uploadedBy: "EMP-2156",
      url: "/attachments/incident-form.pdf" // Example URL
    },
    {
      fileName: "witness-statement.docx",
      fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 45000,
      uploadedBy: "EMP-4532",
      url: "/attachments/witness-statement.docx" // Example URL
    }
  ],
  stats: {
    departmentTotal: 28,
    departmentSafe: 19,
    departmentUnsafe: 9,
    last90Days: 12,
    categories: {
      "Workplace Hazard": 14,
      "Equipment Issue": 8,
      "Process Improvement": 6
    }
  },
  escalationPath: [
    { level: 1, name: "Maria Garcia", position: "Warehouse Manager" },
    { level: 2, name: "Thomas Lee", position: "Operations Director" }
  ]
};

async function getVPCReportData(reportId: string): Promise<VPCReport> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real application, you would fetch data based on reportId:
  // const res = await fetch(`https://your-api.com/reports/vpc/${reportId}`);
  // if (!res.ok) {
  //   throw new Error('Failed to fetch VPC report data');
  // }
  // const data: VPCReport = await res.json();
  // return data;

  // For now, return sample data, pretending reportId was used
  console.log(`Fetching data for reportId (simulated): ${reportId}`);
  return sampleVPCReportData;
}

// This is the main component for the page
// It's a Server Component, so it can be async
async function ReportDataFetcher() {
  // You might get the reportId from params if this was a dynamic route e.g. /reports/vpc-preview/[id]/page.tsx
  // For this example, we'll use a static ID for the simulation.
  const reportId = "vpc-12345"; 
  const reportData = await getVPCReportData(reportId);

  return <VPCReportViewer report={reportData} />;
}


export default function VPCReportPage() {
  return (
    <div className="bg-gray-100 py-8 min-h-screen">
      <Suspense fallback={<LoadingVPCReport />}>
        <ReportDataFetcher />
      </Suspense>
    </div>
  );
}