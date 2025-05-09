// src/components/view/VPCDetailsSidebar.tsx
"use client";

import { useState } from "react";
import {
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  TagIcon,
  // ArrowTopRightOnSquareIcon, // For external link/new tab
} from "@heroicons/react/24/outline";
import { ChevronDown, ChevronUp, FileText as FileTextLucide, PrinterIcon, FileText as ReportIcon } from "lucide-react"; // Using Lucide for consistency
import Image from "next/image";
import Link from "next/link"; // For navigation
import { Button } from "@/components/ui/button";

// ... (VPCAttachment and VPC interfaces remain the same) ...
interface VPCAttachment {
  id: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  fileSize: number;
  createdAt: string;
  uploader: string; // Assuming this is an employee ID or name
}

interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
}
interface VPC {
  id: string;
  vpcNumber: string;
  reportedBy: string; // Might be an ID, needs clarification if it should be user's name
  reportedDate: string;
  department: string;
  description: string;
  vpcType: string;
  actionTaken: string;
  incidentRelatesTo: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: UserBasicInfo;
  attachments?: VPCAttachment[];
}


interface VPCDetailsSidebarProps {
  vpc: VPC;
  onClose: () => void;
}

export const VPCDetailsSidebar = ({ vpc, onClose }: VPCDetailsSidebarProps) => {
  const [evidenceExpanded, setEvidenceExpanded] = useState(true);

  const getVpcTypeColor = (vpcType: string) => {
    // ... (your existing function) ...
    switch (vpcType?.toLowerCase()) {
      case "hazard":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "incident":
        return "bg-red-100 text-red-800 border border-red-300";
      case "near miss":
        return "bg-orange-100 text-orange-800 border border-orange-300";
      case "improvement":
        return "bg-green-100 text-green-800 border border-green-300";
      case "safe":
        return "bg-green-100 text-green-800 border border-green-300";
      case "unsafe":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-300";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    // ... (your existing function) ...
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "Invalid Date";
      }
  };

  const BE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex justify-end">
      <div className="w-full max-w-md bg-slate-50 h-full shadow-2xl overflow-y-auto animate-slide-left flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
          <h2 className="text-xl font-semibold text-slate-800">VPC Details</h2>
          <div className="flex items-center gap-2">
            <Link href={`/reports/vpc/${vpc.id}/preview`} passHref legacyBehavior>
              <a
                target="_blank" // Open preview in new tab
                rel="noopener noreferrer"
                className="p-2 rounded-full text-slate-600 hover:bg-slate-200 hover:text-red-600 transition-colors"
                title="Generate Report Preview"
              >
                <PrinterIcon className="h-5 w-5" />
              </a>
            </Link>
            <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-red-600 transition-colors">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 flex-grow">
          <div className="flex justify-between items-start mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getVpcTypeColor(vpc.vpcType)}`}>
              {vpc.vpcType?.toUpperCase() || "N/A"}
            </span>
            <Link href={`/reports/vpc/${vpc.id}/preview`} passHref legacyBehavior>
              <a
                target="_blank" // Open preview in new tab
                rel="noopener noreferrer"
                className="p-2 rounded-full text-slate-600 hover:bg-slate-200 hover:text-red-600 transition-colors"
                title="Generate Report Preview"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700 shadow-sm"
                >
                  <ReportIcon className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </a>
            </Link>
            <div className="flex items-center text-xs text-slate-500">
              <ClockIcon className="h-4 w-4 mr-1.5 text-slate-400" />
              <span>{formatDate(vpc.reportedDate)}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-red-600">{vpc.vpcNumber}</h3>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <TagIcon className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              <span>ID: {vpc.id}</span>
            </div>
          </div>

          {/* Info Sections */}
          {[
            { icon: UserCircleIcon, label: "Reported By", value: vpc.reportedBy || "N/A" },
            { icon: BuildingOfficeIcon, label: "Department", value: vpc.department || "N/A" },
            { icon: DocumentTextIcon, label: "Description", value: vpc.description || "No description." },
            { icon: DocumentTextIcon, label: "Action Taken", value: vpc.actionTaken || "N/A" },
            { icon: DocumentTextIcon, label: "Incident Relates To", value: vpc.incidentRelatesTo || "N/A" },
          ].map((item, index) => (
            item.value && item.value !== "N/A" && ( // Only render if value exists
                <div className="mb-5" key={index}>
                    <div className="flex items-center mb-1.5">
                    <item.icon className="h-5 w-5 text-slate-500 mr-2.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 ml-[30px] leading-relaxed whitespace-pre-wrap">
                        {item.value}
                    </p>
                </div>
            )
          ))}
          
          {vpc.createdBy && (
             <div className="mb-5">
                <div className="flex items-center mb-1.5">
                    <UserCircleIcon className="h-5 w-5 text-slate-500 mr-2.5 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700">VPC Created By</span>
                </div>
                <p className="text-sm text-slate-600 ml-[30px]">
                    {vpc.createdBy.firstName} {vpc.createdBy.lastName} (ID: {vpc.createdBy.id})
                </p>
             </div>
          )}

          <div className="mb-6 text-xs text-slate-500">
            <div><span className="font-medium">Created:</span> {formatDate(vpc.createdAt)}</div>
            <div><span className="font-medium">Last Updated:</span> {formatDate(vpc.updatedAt)}</div>
          </div>


          {/* Evidence section */}
          <div className="border border-slate-200 bg-white rounded-lg overflow-hidden mb-6 shadow-sm">
            <div
              className="flex justify-between items-center p-3.5 bg-slate-100 cursor-pointer hover:bg-slate-200/70 transition-colors"
              onClick={() => setEvidenceExpanded(!evidenceExpanded)}
            >
              <h3 className="text-sm font-semibold text-slate-700">Evidence & Attachments ({vpc.attachments?.length || 0})</h3>
              <button className="p-1 text-slate-500">
                {evidenceExpanded ? (
                  <ChevronUp className="h-4.5 w-4.5" />
                ) : (
                  <ChevronDown className="h-4.5 w-4.5" />
                )}
              </button>
            </div>

            {evidenceExpanded && (
              <div className="p-4 border-t border-slate-200">
                {vpc.attachments && vpc.attachments.length > 0 ? (
                  <div className="space-y-4">
                    {vpc.attachments.map((attachment) => (
                      <div key={attachment.id} className="pb-3 border-b border-slate-200 last:border-b-0 last:pb-0">
                        <div className="flex items-center space-x-3 mb-1.5">
                          <FileTextLucide className="h-5 w-5 text-red-500 flex-shrink-0" />
                          <div>
                            <a
                              href={`${BE_URL}${attachment.storagePath.startsWith('/') ? '' : '/'}${attachment.storagePath}`} // Ensure leading slash
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-red-600 hover:underline hover:text-red-700"
                              title={attachment.fileName}
                            >
                              {attachment.fileName}
                            </a>
                            <p className="text-xs text-slate-500">
                              {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                         <p className="text-xs text-slate-500 ml-8">
                              Uploaded by {attachment.uploader} on {formatDate(attachment.createdAt)}
                         </p>
                        
                        {attachment.fileName.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) && (
                          <div className="mt-2.5 ml-8 rounded-md border border-slate-200 overflow-hidden max-w-[200px]">
                            <Image
                              src={`${BE_URL}${attachment.storagePath.startsWith('/') ? '' : '/'}${attachment.storagePath}`}
                              alt={attachment.fileName}
                              width={200}
                              height={150}
                              className="object-cover"
                              unoptimized // If BE_URL is not in next.config.js images.domains
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-6">
                    <FileTextLucide className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No evidence uploaded.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};