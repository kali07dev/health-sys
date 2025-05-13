// src/components/reports/ReportGenerationModal.tsx (Modified)
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation"; // For navigation to preview page
import { X, CalendarDays, UserCog,  ListChecks, Loader2, AlertTriangle,  Filter, Layers, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { departmentService, type Department } from "@/utils/departmentAPI";
import type { UserRole } from "@/utils/reports"; 
import { useSession } from "next-auth/react";


interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // vpcIdToReport?: string; // We'll handle this by asking if it's a single or summary report
}

// ... (userRoles, reportFormats definitions from previous version)
const userRoles: { value: UserRole; label: string; adminOnly?: boolean }[] = [
    { value: "employee", label: "Employee" },
    { value: "manager", label: "Manager" },
    { value: "safety_officer", label: "Safety Officer" },
    { value: "admin", label: "Administrator", adminOnly: true },
  ];
  
// const reportFormats: { value: ReportFormat; label: string }[] = [
//     { value: "pdf", label: "PDF Document" },
//     { value: "html", label: "HTML Web Page" },
// ];

const MOCK_VPC_TYPES = ["safe", "unsafe"];
const MOCK_AGGREGATION_LEVELS = [
    {value: "none", label: "No Aggregation (Individual)"},
    {value: "daily", label: "Daily Summary"},
    {value: "weekly", label: "Weekly Summary"},
    {value: "monthly", label: "Monthly Summary"}
];


export default function ReportGenerationModal({
  isOpen,
  onClose,
}: ReportGenerationModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserRole = (session?.role as UserRole) || "employee";

  const [reportType, setReportType] = useState<"singleVPC" | "summary">("summary");
  const [vpcId, setVpcId] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedUserRole, setSelectedUserRole] = useState<UserRole>(currentUserRole);
  // const [selectedFormat, setSelectedFormat] = useState<ReportFormat>("pdf"); // Format selected on preview/download page
  const [includeStats, setIncludeStats] = useState<boolean>(true);

  // New fields for summary reports
  const [selectedDepartment, setSelectedDepartment] = useState<string>(""); // "all" or specific
  const [selectedVpcTypeFilter, setSelectedVpcTypeFilter] = useState<string>(""); // "all" or specific
  const [selectedAggregation, setSelectedAggregation] = useState<string>("none");

    // For fetching departments
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [departmentError, setDepartmentError] = useState<string | null>(null);
  

  const [isLoading, setIsLoading] = useState(false); // For preview generation
  const [error, setError] = useState<string | null>(null);
  // const [successMessage, setSuccessMessage] = useState<string | null>(null); // Not needed if navigating

  const availableUserRoles = userRoles.filter(role =>
    currentUserRole === 'admin' ? true : !role.adminOnly
  );

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

  useEffect(() => {
    if (!isOpen) {
      setReportType("summary");
      setVpcId("");
      setStartDate("");
      setEndDate("");
      setSelectedUserRole(currentUserRole);
      // setSelectedFormat("pdf");
      setIncludeStats(true);
      setSelectedDepartment("");
      setSelectedVpcTypeFilter("");
      setSelectedAggregation("none");
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, currentUserRole]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reportType === "singleVPC" && !vpcId) {
      setError("VPC ID is required for a single VPC report.");
      return;
    }
    
    // Navigate to the appropriate preview page with query parameters
    setIsLoading(true); // Show loading while navigating/preparing

    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set("startDate", startDate);
    if (endDate) queryParams.set("endDate", endDate);
    queryParams.set("userRole", selectedUserRole);
    queryParams.set("includeStats", includeStats.toString());

    if (reportType === "singleVPC") {
        router.push(`/reports/vpc/${vpcId}/preview?${queryParams.toString()}`);
    } else { // Summary Report
        if (selectedDepartment && selectedDepartment !== "all") queryParams.set("department", selectedDepartment);
        if (selectedVpcTypeFilter && selectedVpcTypeFilter !== "all") queryParams.set("vpcType", selectedVpcTypeFilter);
        if (selectedAggregation && selectedAggregation !== "none") queryParams.set("aggregation", selectedAggregation);
        router.push(`/reports/summary/preview?${queryParams.toString()}`);
    }
    // The actual fetching and display will happen on the preview page
    // Close modal after initiating navigation (or let preview page handle it)
    // For now, let modal stay open with loader, preview page will be new tab/route
    // To close: onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/70 backdrop-blur-sm p-4">
      <div className="bg-slate-50 text-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800">Generate Report</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-red-600">
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm flex items-center" role="alert">
              <AlertTriangle size={18} className="mr-2 flex-shrink-0"/> {error}
            </div>
          )}
          
          {/* Report Type Selection */}
          <div>
            <Label className="text-sm font-medium text-slate-600 mb-2 block">Report Type</Label>
            <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant={reportType === 'summary' ? 'destructive' : 'outline'} onClick={() => setReportType('summary')} className={reportType === 'summary' ? 'ring-2 ring-red-500 ring-offset-1' : 'border-slate-300 text-slate-600'}>
                    <Layers size={16} className="mr-2"/> Summary Report
                </Button>
                <Button type="button" variant={reportType === 'singleVPC' ? 'destructive' : 'outline'} onClick={() => setReportType('singleVPC')} className={reportType === 'singleVPC' ? 'ring-2 ring-red-500 ring-offset-1' : 'border-slate-300 text-slate-600'}>
                    <FileText size={16} className="mr-2"/> Single VPC Report
                </Button>
            </div>
          </div>


          {reportType === "singleVPC" && (
            <div>
              <Label htmlFor="vpcId" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
                <FileText size={16} className="mr-2 text-red-600" /> VPC ID
              </Label>
              <Input
                id="vpcId"
                type="text"
                placeholder="Enter specific VPC ID (e.g., vpc-xxxxxxxx)"
                value={vpcId}
                onChange={(e) => setVpcId(e.target.value)}
                className="bg-white border-slate-300 focus:border-red-500 focus:ring-red-500"
                required
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
                <CalendarDays size={16} className="mr-2 text-red-600" /> Start Date <span className="text-xs text-slate-400 ml-1">(Optional)</span>
              </Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white border-slate-300 focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
                <CalendarDays size={16} className="mr-2 text-red-600" /> End Date <span className="text-xs text-slate-400 ml-1">(Optional)</span>
              </Label>
              <Input id="endDate" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white border-slate-300 focus:border-red-500 focus:ring-red-500" />
            </div>
          </div>

          {reportType === "summary" && (
            <>
              <Label className="text-sm font-medium text-slate-600 mb-2 block pt-2 border-t border-slate-200">Summary Filters <span className="text-xs text-slate-400 ml-1">(Optional)</span></Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                 <div>
                    <Label htmlFor="departmentFilter" className="text-xs font-medium text-slate-600 mb-1 flex items-center"><Filter size={14} className="mr-1.5 text-red-600" />Department</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger className="w-full bg-white border-slate-300 text-sm h-10"><SelectValue placeholder="All Departments" /></SelectTrigger>
                        <SelectContent className="bg-white text-black">
                            <SelectItem value="all">All Departments</SelectItem>
                            {isLoadingDepartments ? (
                              <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                            ) : departmentError ? (
                              <SelectItem value="error" disabled>Error loading departments</SelectItem>
                            ) : departments.length === 0 ? (
                              <SelectItem value="none" disabled>No departments found</SelectItem>
                            ) : (
                              departments.map(dept => (
                                <SelectItem key={dept.ID} value={dept.Name}>{dept.Name}</SelectItem>
                              ))
                            )}
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label htmlFor="vpcTypeFilter" className="text-xs font-medium text-slate-600 mb-1 flex items-center"><Filter size={14} className="mr-1.5 text-red-600" />VPC Type</Label>
                    <Select value={selectedVpcTypeFilter} onValueChange={setSelectedVpcTypeFilter}>
                        <SelectTrigger className="w-full bg-white border-slate-300 text-sm h-10"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent className="bg-white text-black">
                            <SelectItem value="all">All Types</SelectItem>
                            {MOCK_VPC_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="md:col-span-2">
                    <Label htmlFor="aggregationLevel" className="text-xs font-medium text-slate-600 mb-1 flex items-center"><Layers size={14} className="mr-1.5 text-red-600" />Aggregation Level</Label>
                    <Select value={selectedAggregation} onValueChange={setSelectedAggregation}>
                        <SelectTrigger className="w-full bg-white border-slate-300 text-sm h-10"><SelectValue placeholder="Select Aggregation" /></SelectTrigger>
                        <SelectContent className="bg-white text-black">
                            {MOCK_AGGREGATION_LEVELS.map(level => <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
              </div>
            </>
          )}
          
          <div className="pt-3 border-t border-slate-200">
            <Label htmlFor="userRole" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
              <UserCog size={16} className="mr-2 text-red-600" /> Report View As (User Role)
            </Label>
            <Select value={selectedUserRole} onValueChange={(value) => setSelectedUserRole(value as UserRole)}>
              <SelectTrigger className="w-full bg-white border-slate-300 text-sm h-10"><SelectValue placeholder="Select user role context" /></SelectTrigger>
              <SelectContent className="bg-white text-black">
                {availableUserRoles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-3">
            <Label htmlFor="includeStats" className="text-sm font-medium text-slate-600 flex items-center">
              <ListChecks size={16} className="mr-2 text-red-600" /> Include Statistics
            </Label>
            <Switch id="includeStats" checked={includeStats} onCheckedChange={setIncludeStats} className="data-[state=checked]:bg-red-600" />
          </div>

          <div className="pt-5 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="text-slate-700 border-slate-300 hover:bg-slate-100">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white min-w-[150px]">
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : "Generate Preview"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}