// src/app/reports/vpc/[vpcId]/preview/page.tsx
import { Suspense } from 'react';
// import { Download, FileType as FileTypeIcon, Printer, Settings, AlertTriangle, Info } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { ReportAPI, ReportApiError } from '@/utils/reportAPI'; // Adjust path
// import { ReportGenerationParams, UserRole, ReportFormat } from '@/types/reports'; // Adjust path
// import { getSession } from 'next-auth/react'; // For client-side component accessing session
import ReportPreviewClientContent from './ReportPreviewClientContent';
import { UserRole } from '@/utils/reports';


interface PageProps {
  params: Promise <{
    vpcId: string;
  }>;
}

async function fetchReportPreviewHtml(vpcId: string, userRole: UserRole = "employee", includeStats: boolean = true): Promise<string> {
  // This function runs on the server.
  // We need a server-side way to get the auth token if your API is protected.
  // For simplicity here, assuming the preview endpoint might be less strict or using a shared secret,
  // OR you'd pass the token from a server component context.
  // The Go backend for PREVIEW might not need full user auth if it's just presenting data.
  
  // For a protected preview, you'd need to use getServerSession and pass the token
  // to a server-side fetch utility.

  const query = new URLSearchParams();
  query.append("role", userRole);
  query.append("stats", includeStats.toString());

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 
  const previewEndpoint = `${BASE_URL}/api/v1/vpcs/reports/${vpcId}/preview?${query.toString()}`;
  console.log("Preview endpoint:", previewEndpoint); // Debugging line

  try {
    const response = await fetch(previewEndpoint, {
      method: "GET",
      headers: {
        // If your preview endpoint is protected, add Authorization header here
        // 'Authorization': `Bearer ${YOUR_SERVER_SIDE_TOKEN_OR_API_KEY}`,
      },
      cache: 'no-store', // Ensure fresh preview
    });
    console.log("Preview response:", response); // Debugging line

    if (!response.ok) {
      let errorText = `Failed to load report preview: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorText = errorJson.error || errorText;
      } catch  {/* ignore */}
      throw new Error(errorText);
    }
    return response.text(); // HTML content
  } catch (error) {
    console.error("Error fetching report preview:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error fetching preview.";
    // Return an error message as HTML to be displayed
    return `<div class="p-4 bg-red-100 text-red-700 rounded-md flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle mr-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>Error: ${errorMessage}</div>`;
  }
}


// Server Component for the page
export default async function VPCReportPreviewPage({ params }: PageProps) {
  const { vpcId } = await params;

  // Fetch initial session data on the server if needed for initial role/stats config
  // const session = await getServerSession(authOptions);
  // const initialUserRole = session?.role as UserRole || 'employee';
  // const initialIncludeStats = true; // Default

  // For this example, we'll fetch a default preview.
  // The client component will handle re-fetching with different options.
  const previewHtml = await fetchReportPreviewHtml(vpcId);

  return (
    <div className="min-h-screen bg-slate-100">
      <Suspense fallback={<PreviewLoadingSkeleton />}>
         <ReportPreviewClientContent
            vpcId={vpcId}
            initialPreviewHtml={previewHtml}
            // Pass initialUserRole and initialIncludeStats if fetched on server
         />
      </Suspense>
    </div>
  );
}

function PreviewLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 shadow-lg rounded-lg animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-3">
          <div className="h-40 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}