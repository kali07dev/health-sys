// src/api/incidents.ts
// import { useSession } from "next-auth/react";
// import { cookies } from 'next/headers';

export interface IncidentSummary {
  incident: {
    ID: string; // Changed from id
    ReferenceNumber: string; // Changed from reference_number
    Type: string; // Changed from type
    SeverityLevel: string; // Changed from severity_level
    Status: string; // Changed from status
    Title: string; // Changed from title
    Description: string; // Changed from description
    Location: string; // Changed from location
    OccurredAt: string; // Changed from occurred_at
    ReportedBy: { // Changed from reported_by
      ID: string; // Changed from id
      FullName: string; // Changed from full_name
    };
    Reporter: {
      ID: string;
      UserID: string;
      EmployeeNumber: string;
      FirstName: string;
      LastName: string;
      Department: string;
      Position: string;
      Role: string;
      ReportingManagerID: string | null;
      StartDate: string;
      EndDate: string;
      EmergencyContact: string | null;
      ContactNumber: string;
      OfficeLocation: string;
      IsSafetyOfficer: boolean;
      IsActive: boolean;
      CreatedAt: string;
      UpdatedAt: string;
      DeletedAt: string | null;
    };
    AssignedTo?: { // Changed from assigned_to
      ID: string; // Changed from id
      FullName: string; // Changed from full_name
    };
    ImmediateActionsTaken: string; // Changed from immediate_actions_taken
    Witnesses: any; // Changed from witnesses
    EnvironmentalConditions: any; // Changed from environmental_conditions
    EquipmentInvolved: any; // Changed from equipment_involved
    CreatedAt: string; // Changed from created_at
    UpdatedAt: string; // Changed from updated_at
    ClosedAt?: string; // Changed from closed_at
    Attachments: Array<{ // Changed from attachments
      ID: string; // Changed from id
      FileName: string; // Changed from file_name
      FileType: string; // Changed from file_type
      FileSize: number; // Changed from file_size
      UploadedBy: { // Changed from uploaded_by
        ID: string; // Changed from id
        FullName: string; // Changed from full_name
      };
      CreatedAt: string; // Changed from created_at
    }>;
  };
  investigation?: {
    RootCause: string; // Changed from root_cause
    ContributingFactors: any; // Changed from contributing_factors
    InvestigationMethods: any; // Changed from investigation_methods
    Findings: string; // Changed from findings
    Recommendations: string; // Changed from recommendations
    StartedAt: string; // Changed from started_at
    CompletedAt?: string; // Changed from completed_at
    Status: string; // Changed from status
    LeadInvestigator: { // Changed from lead_investigator
      ID: string; // Changed from id
      FullName: string; // Changed from full_name
    };
  };
  corrective_actions: Array<{ // Corrective actions remains in lowercase as per JSON
    ID: string; // Changed from id
    Description: string; // Changed from description
    ActionType: string; // Changed from action_type
    Priority: string; // Changed from priority
    Status: string; // Changed from status
    AssignedTo: { // Changed from assigned_to
      ID: string; // Changed from id
      FullName: string; // Changed from full_name
    };
    DueDate: string; // Changed from due_date
    CompletedAt?: string; // Changed from completed_at
    CompletionNotes?: string; // Changed from completion_notes
  }>;
  timeline: Array<{ // Timeline remains in lowercase as per JSON
    date: string; // No change
    event_type: string; // No change
    description: string; // No change
    user_name: string; // No change
  }>;
  statistics: { // Statistics remains in lowercase as per JSON
    total_days_open: number; // No change
    days_in_investigation: number; // No change
    completed_actions_count: number; // No change
    total_actions_count: number; // No change
    interviews_count: number; // No change
    evidence_count: number; // No change
    verification_rate: number; // No change
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function getIncidentSummary(id: string): Promise<IncidentSummary> {
  // const cookieStore = cookies();
  
  try {
    const response = await fetch(`${API_BASE_URL}/incidents/${id}/summary`, {
      // headers: {
      //   'Cookie': cookieStore.toString(),
      //   'Content-Type': 'application/json',
      // },
      credentials: 'include',
      cache: 'no-store', // Disable caching
      next: { revalidate: 0 } // Ensure fresh data
    });

    if (!response.ok) {
      throw new Error('Failed to fetch incident summary');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching incident summary:', error);
    throw error;
  }
}