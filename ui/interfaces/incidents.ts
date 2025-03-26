// types/incident.ts
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'safety_officer' | 'employee';
  name: string;
}
export interface IncidentFormData {
  type: 'injury' | 'near_miss' | 'property_damage' | 'environmental' | 'security';
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  occurredAt: string;
  immediateActionsTaken?: string;
  reportedBy: string;
  witnesses?: Array<{
    name: string;
    contact: string;
  }>;
  environmentalConditions?: Record<string, unknown>;
  equipmentInvolved?: Record<string, unknown>;
  injuryType?: string;
  reporterFullName?: string;
}
export interface Investigation {
  id: string;
  incidentId: string;
  leadInvestigatorId: string;
  leadInvestigatorName?: string;
  description?: string;
  rootCause?: string;
  contributingFactors?: string[] | null;
  investigationMethods?: string[] | null;
  findings?: string;
  recommendations?: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'pending_review' | 'completed' | 'reopened';
  durationDays?: number;
  createdAt: string;
  updatedAt: string;
  incident?: {
    Title: string;
    Description: string;
    Location: string;
    SeverityLevel: string;
  };
  interviews: [];
}

export interface Interview {
  id: string;
  investigationId: string;
  intervieweeId: string;
  scheduledFor: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  location: string;
  completedAt?: string;
}

export interface CorrectiveAction {
  id: string;
  incidentId: string;
  description: string;
  actionType: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'overdue';
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  completedAt?: string;
  completionNotes?: string;
  verificationRequired: boolean;
  incidentTitle: string;
  assignerName: string;
  assigneeName: string;
  incidentLocation: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  evidence: ActionEvidence[];
}


export interface ActionEvidence {
  id: string;
  correctiveActionId: string;
  fileType: 'document' | 'photo' | 'video';
  fileName: string;
  fileURL: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  uploaderName?: string;
}

export interface Incident {
  id: string;
  referenceNumber: string;
  type: 'injury' | 'near_miss' | 'property_damage' | 'environmental' | 'security';
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'investigating' | 'action_required' | 'resolved' | 'closed';
  title: string;
  description: string;
  location: string;
  occurredAt: string;
  reportedBy: string;
  assignedTo?: string;
  immediateActionsTaken?: string;
  witnesses?: string[];
  environmentalConditions?: Record<string, string>;
  equipmentInvolved?: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface IncidentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  StoragePath: string;
  fileSize: number;
  createdAt: string;
  uploader: string;
}
