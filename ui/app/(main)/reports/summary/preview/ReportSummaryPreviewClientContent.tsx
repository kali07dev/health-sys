"use client";

import { useState, useEffect } from "react";
import { Download, Settings, Loader2, AlertTriangle, Info, RefreshCw, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ReportApiError } from "@/utils/reportAPI";
import { departmentService, type Department } from "@/utils/departmentAPI";
import type { UserRole, ReportFormat } from "@/utils/reports";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

interface ReportSummaryPreviewClientContentProps {
  initialPreviewHtml: string;
  initialParams: {
    startDate?: string;
    endDate?: string;
    userRole?: string;
    includeStats?: string;
    department?: string;
    vpcType?: string;
    aggregation?: string;
  };
}

// Options for client-side controls
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
const MOCK_VPC_TYPES = ["safe", "unsafe"];
const MOCK_AGGREGATION_LEVELS = [
    {value: "none", label: "No Aggregation"},
    {value: "daily", label: "Daily"},
    {value: "weekly", label: "Weekly"},
    {value: "monthly", label: "Monthly"}
];

export default function ReportSummaryPreviewClientContent({
  initialPreviewHtml,
  initialParams,
}: ReportSummaryPreviewClientContentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserRole = (session?.role as UserRole) || "employee";

  const [previewHtml, setPreviewHtml] = useState(initialPreviewHtml);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  
  // Report generation options, initialized from URL searchParams
  const [selectedUserRole, setSelectedUserRole] = useState<UserRole>((initialParams.userRole as UserRole) || currentUserRole);
  const [includeStats, setIncludeStats] = useState<boolean>(initialParams.includeStats === "true");
  const [startDate, setStartDate] = useState<string>(initialParams.startDate || "");
  const [endDate, setEndDate] = useState<string>(initialParams.endDate || "");
  const [department, setDepartment] = useState<string>(initialParams.department || "all");
  const [vpcType, setVpcType] = useState<string>(initialParams.vpcType || "all");
  const [aggregation, setAggregation] = useState<string>(initialParams.aggregation || "none");

  const [selectedDownloadFormat, setSelectedDownloadFormat] = useState<ReportFormat>("pdf");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // For fetching departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [departmentError, setDepartmentError] = useState<string | null>(null);

  // For estimation and warnings
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 
    
  const availableUserRoles = userRolesOptions.filter(role => {
    /* ... role filtering logic ... */
    return role.value !== "admin" || (session?.role === "admin" || session?.role === "superuser");
  });

  useEffect(() => {
    if (!availableUserRoles.find(r => r.value === selectedUserRole)) {
        setSelectedUserRole(currentUserRole);
    }
  }, [currentUserRole, availableUserRoles, selectedUserRole]);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    setDepartmentError(null);
    try {
      const data = await departmentService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setDepartmentError("Failed to load departments. Please try again later.");
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const generateQueryString = (overrideParams: Partial<typeof initialParams> = {}) => {
    const params = new URLSearchParams();
    const current = { startDate, endDate, userRole: selectedUserRole, includeStats: includeStats.toString(), department, vpcType, aggregation, ...overrideParams };
    
    if (current.startDate) params.set("startDate", current.startDate);
    if (current.endDate) params.set("endDate", current.endDate);
    params.set("userRole", current.userRole);
    params.set("includeStats", current.includeStats);
    if (current.department && current.department !== "all") params.set("department", current.department);
    if (current.vpcType && current.vpcType !== "all") params.set("vpcType", current.vpcType);
    if (current.aggregation && current.aggregation !== "none") params.set("aggregation", current.aggregation);
    return params.toString();
  };

  const fetchAndUpdatePreview = async () => {
    setIsFetchingPreview(true);
    setDownloadError(null);
    const queryString = generateQueryString();
    // Update URL without full page reload for better UX
    router.replace(`/reports/summary/preview?${queryString}`, { scroll: false }); 

    const previewEndpoint = `${BASE_URL}/api/v1/vpc/reports/summary/preview?${queryString}`;
    console.log("Preview endpoint:", previewEndpoint);

    try {
        const response = await fetch(previewEndpoint, { method: "GET", headers: { /* Auth */ } });
        console.log("Preview response:", response);
        if (!response.ok) { /* ... error handling ... */ throw new Error("Failed to update summary"); }
        const html = await response.text();
        setPreviewHtml(html);
        // Potentially parse some metadata from HTML for recordCount/estimatedTime if backend includes it
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const countMeta = tempDiv.querySelector('meta[name="record-count"]');
        if (countMeta) setRecordCount(parseInt(countMeta.getAttribute('content') || '0', 10)); else setRecordCount(null);
        const timeMeta = tempDiv.querySelector('meta[name="estimated-time"]');
        if (timeMeta) setEstimatedTime(timeMeta.getAttribute('content')); else setEstimatedTime(null);
    } catch { /* ... error handling ... */ } 
    finally { setIsFetchingPreview(false); }
  };
  
  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    const queryForDownload = new URLSearchParams();
    if (startDate) queryForDownload.set("startDate", startDate);
    if (endDate) queryForDownload.set("endDate", endDate);
    queryForDownload.set("userRole", selectedUserRole);
    queryForDownload.set("includeStats", includeStats.toString());
    if (department && department !== "all") queryForDownload.set("department", department);
    if (vpcType && vpcType !== "all") queryForDownload.set("vpcType", vpcType);
    if (aggregation && aggregation !== "none") queryForDownload.set("aggregation", aggregation);
    queryForDownload.set("outputFormat", selectedDownloadFormat);

    const downloadEndpoint = `${BASE_URL}/api/v1/vpc/reports/summary/preview?${queryForDownload.toString()}`;

    try {
        const response = await fetch(downloadEndpoint, { method: "GET", headers: { /* Auth */ }});
        if (!response.ok) {
            let errorJson;
            try { errorJson = await response.json(); } catch {}
            throw new ReportApiError(errorJson?.error || "Failed to download summary report", response.status, errorJson);
        }
      const blob = await response.blob();
      const filename = `vpc-summary-report-${new Date().toISOString().split('T')[0]}.${selectedDownloadFormat}`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof ReportApiError) { setDownloadError(err.data?.error || err.message); } 
      else { setDownloadError("An unexpected error occurred."); }
    } finally { setIsDownloading(false); }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 sm:h-16">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 w-full sm:w-auto">
              VPC Summary Report Preview
            </h1>
            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              <Button variant="outline" size="sm" onClick={() => setShowOptions(!showOptions)} className="text-slate-700 border-slate-300 hover:bg-slate-200" title="Report Options">
                <Settings size={16} className="mr-0 sm:mr-2" /><span className="hidden sm:inline">Options</span>
              </Button>
              <Select value={selectedDownloadFormat} onValueChange={(v) => setSelectedDownloadFormat(v as ReportFormat)}>
                <SelectTrigger className="w-[100px] sm:w-[120px] bg-white text-black text-sm h-9"><SelectValue placeholder="Format"/></SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {reportFormatsOptions.map
                  (f => <SelectItem key={f.value} value={f.value}>{f.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleDownload} disabled={isDownloading} className="bg-red-600 hover:bg-red-700 text-white min-w-[100px] sm:min-w-[120px] h-9">
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={16} className="mr-0 sm:mr-2" />}
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>
          {showOptions && (
            <div className="py-4 px-2 border-t border-slate-200 bg-slate-100 rounded-b-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end max-w-5xl mx-auto">
                {/* Date Pickers */}
                <div><Label htmlFor="sumStartDate" className="text-xs font-medium text-slate-600 mb-1">Start Date</Label>
                <Input id="sumStartDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white h-9"/></div>
                <div><Label htmlFor="sumEndDate" className="text-xs font-medium text-slate-600 mb-1">End Date</Label><Input id="sumEndDate" type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className="bg-white h-9"/></div>
                <div>
                  <Label htmlFor="sumDepartment" className="text-xs font-medium text-slate-600 mb-1">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger id="sumDepartment" className="bg-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      <SelectItem value="all">All</SelectItem>
                      {isLoadingDepartments ? (
                        <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                      ) : departmentError ? (
                        <SelectItem value="error" disabled>Error loading departments</SelectItem>
                      ) : departments.length === 0 ? (
                        <SelectItem value="none" disabled>No departments found</SelectItem>
                      ) : (
                        departments.map(dept => (
                          <SelectItem key={dept.ID} value={dept.ID.toString()}>{dept.Name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* VPC Type Filter */}
                <div><Label htmlFor="sumVpcType" className="text-xs font-medium text-slate-600 mb-1">VPC Type</Label><Select value={vpcType} onValueChange={setVpcType}><SelectTrigger id="sumVpcType" className="bg-white h-9"><SelectValue/></SelectTrigger><SelectContent className="bg-white text-black"><SelectItem value="all">All</SelectItem>{MOCK_VPC_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                {/* Aggregation Level */}
                <div><Label htmlFor="sumAggregation" className="text-xs font-medium text-slate-600 mb-1">Aggregation</Label><Select value={aggregation} onValueChange={setAggregation}><SelectTrigger id="sumAggregation" className="bg-white h-9"><SelectValue/></SelectTrigger><SelectContent className="bg-white text-black">{MOCK_AGGREGATION_LEVELS.map(a=><SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent></Select></div>
                {/* User Role & Stats Toggle */}
                <div><Label htmlFor="sumUserRole" className="text-xs font-medium text-slate-600 mb-1">View As Role</Label><Select value={selectedUserRole} onValueChange={v => setSelectedUserRole(v as UserRole)}><SelectTrigger id="sumUserRole" className="bg-white h-9"><SelectValue/></SelectTrigger><SelectContent className="bg-white text-black">{availableUserRoles.map(r=><SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-center justify-between pt-5 gap-2"><Label htmlFor="sumIncludeStats" className="text-xs font-medium text-slate-600">Include Stats</Label><Switch id="sumIncludeStats" checked={includeStats} onCheckedChange={setIncludeStats} className="data-[state=checked]:bg-red-600" /></div>
                
                <div className="lg:col-span-3 flex justify-end pt-2">
                    <Button size="sm" variant="ghost" onClick={fetchAndUpdatePreview} disabled={isFetchingPreview} className="text-red-600 hover:bg-red-100 h-9">
                        {isFetchingPreview ? <Loader2 size={18} className="animate-spin mr-2"/> : <RefreshCw size={16} className="mr-2" />} Update Preview
                    </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {downloadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm flex items-start">
            <AlertTriangle size={20} className="mr-2 mt-0.5 flex-shrink-0 text-red-500"/>
            <span>{downloadError}</span>
          </div>
        )}
        
        {/* Department loading error message */}
        {departmentError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md mb-6 text-sm flex items-start">
            <AlertTriangle size={20} className="mr-2 mt-0.5 flex-shrink-0 text-amber-500"/>
            <span>{departmentError}</span>
          </div>
        )}
        
        {/* Visual Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {estimatedTime && (
                <div className="bg-sky-50 border border-sky-200 text-sky-700 px-4 py-3 rounded-md text-sm flex items-start">
                    <Clock size={20} className="mr-2 mt-0.5 flex-shrink-0 text-sky-500"/> 
                    <span>Estimated generation time for full report: <strong>{estimatedTime}</strong>.</span>
                </div>
            )}
            {recordCount !== null && recordCount > 100 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm flex items-start">
                    <AlertTriangle size={20} className="mr-2 mt-0.5 flex-shrink-0 text-amber-500"/>
                    <span>Warning: Report includes <strong>{recordCount} records</strong>. Full generation may take a while and result in a large file.</span>
                </div>
            )}
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6 text-sm flex items-start">
            <Info size={28} className="mr-3 flex-shrink-0" />
            <div>This is a lightweight preview of the summary report. Use options above to refine and download.</div>
        </div>

        <div
            className="bg-white p-4 sm:p-6 md:p-8 shadow-xl rounded-lg prose max-w-none report-preview-content"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </main>
      <style jsx global>{`
        .report-preview-content img { max-width: 100%; height: auto; border-radius: 0.25rem; }
        /* ... other global styles for preview content ... */
      `}</style>
    </>
  );
}