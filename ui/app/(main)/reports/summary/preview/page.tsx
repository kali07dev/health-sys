/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(main)/reports/summary/preview/page.tsx
import { Suspense } from 'react';
import ReportSummaryPreviewClientContent from './ReportSummaryPreviewClientContent';
import type { UserRole } from '@/utils/reports';
import type { Metadata } from 'next';

// Type-safe parameter interface for your application
interface PageProps {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  params: Promise <{
    // If you had path parameters, they would go here
  }>;
  searchParams: Promise <{ [key: string]: string | string[] | undefined }>;
}

// Parameters interface for the report itself
interface ReportParams {
  startDate?: string;
  endDate?: string;
  userRole?: UserRole;
  includeStats?: string;
  department?: string;
  vpcType?: string;
  aggregation?: string;
}

// Helper to safely extract single value from search params
function getFirstValue(param: string | string[] | undefined): string | undefined {
  return Array.isArray(param) ? param[0] : param;
}

// Convert Next.js searchParams to your application's expected format
function parseSearchParams(
  params: { [key: string]: string | string[] | undefined }
): ReportParams {
  return {
    startDate: getFirstValue(params.startDate),
    endDate: getFirstValue(params.endDate),
    userRole: getFirstValue(params.userRole) as UserRole | undefined,
    includeStats: getFirstValue(params.includeStats),
    department: getFirstValue(params.department),
    vpcType: getFirstValue(params.vpcType),
    aggregation: getFirstValue(params.aggregation),
  };
}

// Generate metadata function
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const params = parseSearchParams(resolvedSearchParams);
  
  return {
    title: `VPC Summary Report Preview | ${params.startDate || 'Current Period'}`,
    description: `Preview of VPC summary report for ${params.startDate || 'current period'}`,
  };
}

// Fetch report preview HTML
async function fetchSummaryReportPreviewHtml(params: ReportParams): Promise<string> {
  const query = new URLSearchParams();
  
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  query.set("userRole", params.userRole || "employee");
  query.set("includeStats", params.includeStats || "true");
  if (params.department) query.set("department", params.department);
  if (params.vpcType) query.set("vpcType", params.vpcType);
  if (params.aggregation) query.set("aggregation", params.aggregation);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 
  const previewEndpoint = `${BASE_URL}/api/v1/vpc/reports/summary/preview?${query.toString()}`;
  console.log("Preview endpoint:", previewEndpoint); // Debugging line
  
  try {
    const response = await fetch(previewEndpoint, {
      method: "GET",
      headers: { /* Auth headers if needed */ },
      cache: 'no-store',
    });
    console.log("Preview response:", response); // Debugging line


    if (!response.ok) {
      throw new Error(`Failed to fetch preview: ${response.statusText}`);
    }
    return response.text();
  } catch (error) {
    console.error("Error fetching preview:", error);
    return `<div class="error">Error loading preview</div>`;
  }
}

// Main page component
export default async function SummaryReportPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const parsedParams = parseSearchParams(await searchParams);
  const initialPreviewHtml = await fetchSummaryReportPreviewHtml(parsedParams);

  return (
    <div className="min-h-screen bg-slate-100">
      <Suspense fallback={<SummaryPreviewLoadingSkeleton />}>
        <ReportSummaryPreviewClientContent
          initialPreviewHtml={initialPreviewHtml}
          initialParams={parsedParams}
        />
      </Suspense>
    </div>
  );
}

// Loading skeleton component
function SummaryPreviewLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 shadow-lg rounded-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}