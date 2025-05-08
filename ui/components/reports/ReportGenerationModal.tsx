// src/components/reports/ReportGenerationModal.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { X, CalendarDays, UserCog, FileType, ListChecks, Loader2, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ReportAPI, ReportApiError } from "@/utils/reportAPI"; // Adjust path
import type { UserRole, ReportFormat, ReportGenerationParams } from "@/utils/reports"; // Adjust path

// You might get this from session or a global state
// For now, let's assume the current user's role is passed or known
const MOCK_CURRENT_USER_ROLE: UserRole = "admin"; // Replace with actual logic

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vpcIdToReport?: string; // If generating for a specific VPC
  // onReportGenerated: (blob: Blob, filename: string) => void; // Callback after generation
}

const userRoles: { value: UserRole; label: string; adminOnly?: boolean }[] = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "safety_officer", label: "Safety Officer" },
  { value: "admin", label: "Administrator", adminOnly: true },
];

const reportFormats: { value: ReportFormat; label: string }[] = [
  { value: "pdf", label: "PDF Document" },
  { value: "html", label: "HTML Web Page" },
];

export default function ReportGenerationModal({
  isOpen,
  onClose,
  vpcIdToReport, // Default to a specific VPC if provided
}: ReportGenerationModalProps) {
  const [vpcId, setVpcId] = useState(vpcIdToReport || ""); // Allow override or input
  const [startDate, setStartDate] = useState<string>(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState<string>(""); // YYYY-MM-DD
  const [selectedUserRole, setSelectedUserRole] = useState<UserRole>("employee");
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>("pdf");
  const [includeStats, setIncludeStats] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter roles based on current user's permissions
  const availableUserRoles = userRoles.filter(role =>
    MOCK_CURRENT_USER_ROLE === 'admin' ? true : !role.adminOnly
  );

  useEffect(() => {
    if (vpcIdToReport) {
      setVpcId(vpcIdToReport);
    }
  }, [vpcIdToReport]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form on close
      // setVpcId(vpcIdToReport || ""); // Keep vpcId if modal is for a specific one
      setStartDate("");
      setEndDate("");
      setSelectedUserRole("employee");
      setSelectedFormat("pdf");
      setIncludeStats(true);
      setError(null);
      setSuccessMessage(null);
      setIsLoading(false);
    }
  }, [isOpen, vpcIdToReport]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vpcId && !vpcIdToReport) { // If vpcId is meant to be selected in the modal
        setError("VPC ID is required to generate a report.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const params: ReportGenerationParams = {
      vpcId: vpcId || vpcIdToReport!, // Ensure vpcId is set
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      userRole: selectedUserRole,
      outputFormat: selectedFormat,
      includeStats: includeStats,
    };

    try {
      const blob = await ReportAPI.generateReport(params);
      const filename = `vpc-report-${params.vpcId}-${new Date().toISOString().split('T')[0]}.${params.outputFormat}`;
      
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`Report "${filename}" generated and download started!`);
      // onClose(); // Optionally close modal on success
    } catch (err) {
      if (err instanceof ReportApiError) {
        setError(err.data?.error || err.message || "Failed to generate report.");
      } else {
        setError("An unexpected error occurred.");
      }
      console.error("Report generation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-800/70 backdrop-blur-sm p-4">
      <div className="bg-slate-50 text-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800">Generate VPC Report</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-red-600">
            <X size={24} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
              <div className="flex items-center">
                <AlertTriangle size={20} className="mr-2"/>
                <p className="font-bold">Error</p>
              </div>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {successMessage && (
             <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert">
              <div className="flex items-center">
                <CheckCircle size={20} className="mr-2"/>
                <p className="font-bold">Success</p>
              </div>
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {/* VPC ID input - only if not pre-filled and required for general reports */}
          {!vpcIdToReport && (
            <div>
              <Label htmlFor="vpcId" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
                <FileText size={16} className="mr-2 text-red-600" /> VPC ID (Optional for general summary)
              </Label>
              <Input
                id="vpcId"
                type="text"
                placeholder="e.g., vpc-xxxxxxxx"
                value={vpcId}
                onChange={(e) => setVpcId(e.target.value)}
                className="bg-white border-slate-300 focus:border-red-500 focus:ring-red-500"
              />
              <p className="text-xs text-slate-500 mt-1">Leave blank for a general report, or specify a VPC ID.</p>
            </div>
          )}
           {vpcIdToReport && (
             <div className="p-3 bg-slate-100 rounded-md border border-slate-200">
                <p className="text-sm text-slate-600">Generating report for VPC:</p>
                <p className="font-semibold text-red-600">{vpcIdToReport}</p>
             </div>
           )}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
                <CalendarDays size={16} className="mr-2 text-red-600" /> Start Date (Optional)
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border-slate-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
                <CalendarDays size={16} className="mr-2 text-red-600" /> End Date (Optional)
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate} // Basic validation
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border-slate-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="userRole" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
              <UserCog size={16} className="mr-2 text-red-600" /> Report View As (User Role)
            </Label>
            <Select value={selectedUserRole} onValueChange={(value) => setSelectedUserRole(value as UserRole)}>
              <SelectTrigger className="w-full bg-white text-black border-slate-300 focus:border-red-500 focus:ring-red-500">
                <SelectValue placeholder="Select user role context" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {availableUserRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="format" className="text-sm font-medium text-slate-600 mb-1 flex items-center">
              <FileType size={16} className="mr-2 text-red-600" /> Output Format
            </Label>
            <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ReportFormat)}>
              <SelectTrigger className="w-full bg-white text-black border-slate-300 focus:border-red-500 focus:ring-red-500">
                <SelectValue placeholder="Select report format" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                {reportFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label htmlFor="includeStats" className="text-sm font-medium text-slate-600 flex items-center">
              <ListChecks size={16} className="mr-2 text-red-600" /> Include Statistics
            </Label>
            <Switch
              id="includeStats"
              checked={includeStats}
              onCheckedChange={setIncludeStats}
              className="data-[state=checked]:bg-red-600"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="text-slate-700 border-slate-300 hover:bg-slate-100">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]">
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}