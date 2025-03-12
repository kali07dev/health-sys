// src/api/incidents.ts
import { useSession } from "next-auth/react";
import { cookies } from 'next/headers';

export interface IncidentSummary {
  incident: {
    id: string;
    reference_number: string;
    type: string;
    severity_level: string;
    status: string;
    title: string;
    description: string;
    location: string;
    occurred_at: string;
    reported_by: {
      id: string;
      full_name: string;
    };
    assigned_to?: {
      id: string;
      full_name: string;
    };
    immediate_actions_taken: string;
    witnesses: any;
    environmental_conditions: any;
    equipment_involved: any;
    created_at: string;
    updated_at: string;
    closed_at?: string;
    attachments: Array<{
      id: string;
      file_name: string;
      file_type: string;
      file_size: number;
      uploaded_by: {
        id: string;
        full_name: string;
      };
      created_at: string;
    }>;
  };
  investigation?: {
    root_cause: string;
    contributing_factors: any;
    investigation_methods: any;
    findings: string;
    recommendations: string;
    started_at: string;
    completed_at?: string;
    status: string;
    lead_investigator: {
      id: string;
      full_name: string;
    };
  };
  corrective_actions: Array<{
    id: string;
    description: string;
    action_type: string;
    priority: string;
    status: string;
    assigned_to: {
      id: string;
      full_name: string;
    };
    due_date: string;
    completed_at?: string;
    completion_notes?: string;
  }>;
  timeline: Array<{
    date: string;
    event_type: string;
    description: string;
    user_name: string;
  }>;
  statistics: {
    total_days_open: number;
    days_in_investigation: number;
    completed_actions_count: number;
    total_actions_count: number;
    interviews_count: number;
    evidence_count: number;
    verification_rate: number;
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