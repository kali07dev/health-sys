// src/app/reports/vpc/[vpcId]/preview/ReportPreviewClientContent.tsx
"use client";

import { useState, useEffect } from "react";
import { Download, Settings, Loader2, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ReportAPI, ReportApiError } from "@/utils/reportAPI";
import type { ReportGenerationParams, UserRole, ReportFormat } from "@/utils/reports"; 
import { useSession } from "next-auth/react"; // For current user's role

interface ReportPreviewClientContentProps {
  vpcId: string;
  initialPreviewHtml: string;
  // initialUserRole: UserRole;
  // initialIncludeStats: boolean;
}

// Simplified options for preview page controls
const userRolesOptions: { value: UserRole; label: string }[] = [
  { value: "employee", label: "Employee View" },
  { value: "manager", label: "Manager View" },
  { value: "safety_officer", label: "Safety Officer View" },
  { value: "admin", label: "Admin View" },
];

const reportFormatsOptions: { value: ReportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "html", label: "HTML" },
];


export default function ReportPreviewClientContent({
  vpcId,
  initialPreviewHtml,
}: ReportPreviewClientContentProps) {
  const { data: session } = useSession();
  const currentUserRole = (session?.role as UserRole) || "employee"; // Get current user's role

  const [previewHtml, setPreviewHtml] = useState(initialPreviewHtml);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  
  // State for report generation options (can be adjusted by user on this page)
  const [selectedUserRole, setSelectedUserRole] = useState<UserRole>(currentUserRole);
  const [includeStats, setIncludeStats] = useState<boolean>(true);
  const [selectedDownloadFormat, setSelectedDownloadFormat] = useState<ReportFormat>("pdf");

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Filter roles based on current user's permissions (simplified for client)
  const availableUserRoles = userRolesOptions.filter(role =>
    currentUserRole === 'admin' ? true : (
        currentUserRole === 'safety_officer' ? !['admin'].includes(role.value) : (
            currentUserRole === 'manager' ? !['admin', 'safety_officer'].includes(role.value) : (
                role.value === 'employee'
            )
        )
    )
  );
  
  useEffect(() => {
    // If the current user's role changes and is not available in selected, reset it
    if (!availableUserRoles.find(r => r.value === selectedUserRole)) {
        setSelectedUserRole(currentUserRole); // Default to their own role or the first available
    }
  }, [currentUserRole, availableUserRoles, selectedUserRole]);


  const fetchAndUpdatePreview = async (role: UserRole, stats: boolean) => {
    setIsFetchingPreview(true);
    setDownloadError(null); // Clear previous errors
    // This uses a client-side fetch that would hit the new /preview endpoint
    // The actual fetchReportPreviewHtml function from page.tsx cannot be called directly here.
    // We need a client-side equivalent or just make the fetch call.
    const query = new URLSearchParams();
    query.append("role", role);
    query.append("stats", stats.toString());
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 
    const previewEndpoint = `${BASE_URL}/api/v1/vpcs/reports/${vpcId}/preview?${query.toString()}`;
    console.log("Preview endpoint:", previewEndpoint); // Debugging line

    try {
        const response = await fetch(previewEndpoint, {
            method: "GET",
            headers: { /* Add Auth if needed for client-side preview fetch */ },
        });
        console.log("Preview response:", response); // Debugging line
        if (!response.ok) {
            let errorText = `Failed to update preview: ${response.statusText}`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            try { const errorJson = await response.json(); errorText = errorJson.error || errorText; } catch (e) {/*ignore*/}
            throw new Error(errorText);
        }
        const html = await response.text();
        setPreviewHtml(html);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error updating preview.";
        setPreviewHtml(`<div class="p-4 bg-red-100 text-red-700 rounded-md flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle mr-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>Error: ${errorMessage}</div>`);
    } finally {
        setIsFetchingPreview(false);
    }
  };
  
  const handleOptionChange = () => {
      // Debounce or delay this if needed, or trigger on a button click
      fetchAndUpdatePreview(selectedUserRole, includeStats);
  };


  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    const params: ReportGenerationParams = {
      vpcId,
      userRole: selectedUserRole,
      outputFormat: selectedDownloadFormat,
      includeStats: includeStats,
      // startDate and endDate are not part of single VPC report options in current design
    };

    try {
      const blob = await ReportAPI.generateReport(params);
      const filename = `vpc-report-${params.vpcId}-${new Date().toISOString().split('T')[0]}.${params.outputFormat}`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof ReportApiError) {
        setDownloadError(err.data?.error || err.message || "Failed to download report.");
      } else {
        setDownloadError("An unexpected error occurred during download.");
      }
      console.error("Report download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* Sticky Header with Controls */}
      <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">
              Report Preview: 
              {/* <span className="text-red-600">{vpcId}</span> */}
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptions(!showOptions)}
                className="text-slate-700 border-slate-300 hover:bg-slate-200"
                title="Report Options"
              >
                <Settings size={16} className="mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Options</span>
              </Button>
              <Select value={selectedDownloadFormat} onValueChange={(v) => setSelectedDownloadFormat(v as ReportFormat)}>
                  <SelectTrigger className="w-[100px] sm:w-[120px] bg-white text-black text-sm h-9">
                      <SelectValue placeholder="Format"/>
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                      {reportFormatsOptions.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[100px] sm:min-w-[120px] h-9"
              >
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={16} className="mr-0 sm:mr-2" />}
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
          {showOptions && (
            <div className="py-3 px-1 border-t border-slate-200 bg-slate-100 rounded-b-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end max-w-3xl mx-auto">
                <div>
                  <Label htmlFor="previewUserRole" className="text-xs font-medium text-slate-600 mb-1">View As Role</Label>
                  <Select value={selectedUserRole} onValueChange={(v) => setSelectedUserRole(v as UserRole)}>
                    <SelectTrigger id="previewUserRole" className="w-full bg-white text-sm h-9">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      {availableUserRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:pt-5 gap-2">
                    <Label htmlFor="previewIncludeStats" className="text-xs font-medium text-slate-600">Include Stats</Label>
                    <Switch id="previewIncludeStats" checked={includeStats} onCheckedChange={setIncludeStats} className="data-[state=checked]:bg-red-600" />
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleOptionChange}
                    disabled={isFetchingPreview}
                    className="text-red-600 hover:bg-red-100 h-9 mt-2 sm:mt-0"
                >
                    {isFetchingPreview ? <Loader2 size={18} className="animate-spin mr-2"/> : <RefreshCw size={16} className="mr-2" />}
                    Update Preview
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Preview Content Area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {downloadError && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center" role="alert">
            <AlertTriangle size={20} className="mr-2" />
            <p className="text-sm">{downloadError}</p>
          </div>
        )}
         <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6 text-sm flex items-start" role="alert">
            <Info size={28} className="mr-3 flex-shrink-0" />
            <div>
                This is a lightweight preview of the report. The final downloaded version (PDF/HTML) may have more detailed formatting and complete data.
                Use the &apos;Options&apos; button above to change view parameters for this preview or the final download.
            </div>
        </div>

        <div
            className="bg-white p-4 sm:p-6 md:p-8 shadow-xl rounded-lg prose max-w-none report-preview-content"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </main>
      <style jsx global>{`
        .report-preview-content img { max-width: 100%; height: auto; border-radius: 0.25rem; }
        .report-preview-content table { width: 100%; border-collapse: collapse; }
        .report-preview-content th, .report-preview-content td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
        .report-preview-content th { background-color: #f9fafb; }
        // Add more styles for your lightweight HTML preview as needed
      `}</style>
    </>
  );
}