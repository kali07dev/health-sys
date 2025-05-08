// src/app/reports/vpc-preview/types.ts
// Or better, src/types/reports.ts if used elsewhere

export interface EmployeeInfo {
    name: string;
    position?: string; // Make position optional if creator doesn't have it
    role?: string;     // Make role optional if reporter doesn't have it
    employeeNumber: string;
  }
  
  export interface Attachment {
    fileName: string;
    fileType: string;
    fileSize: number; // in bytes
    uploadedBy: string;
    url?: string; // Optional: direct URL to the attachment
  }
  
  export interface ReportStats {
    departmentTotal: number;
    departmentSafe: number;
    departmentUnsafe: number;
    last90Days: number;
    categories: Record<string, number>; // e.g. { "Workplace Hazard": 14 }
  }
  
  export interface EscalationStep {
    level: number;
    name: string;
    position: string;
  }
  
  export interface VPCReport {
    id: string;
    vpcNumber: string;
    reportedDate: string; // ISO date string
    department: string;
    description: string;
    vpcType: "safe" | "unsafe";
    actionTaken: string; // Newline separated steps
    incidentRelatesTo: string;
    reporter: EmployeeInfo;
    creator: EmployeeInfo;
    attachments: Attachment[];
    stats: ReportStats;
    escalationPath: EscalationStep[];
  }