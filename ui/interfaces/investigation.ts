// src/types/investigation.ts
export interface Investigation {
    id: string; // UUID as string
    incident_id: string; // UUID as string
    lead_investigator_id: string; // UUID as string
    root_cause: string;
    contributing_factors: Record<string, any>; // JSONB field
    investigation_methods: Record<string, any>; // JSONB field
    findings: string;
    recommendations: string;
    started_at: string; // ISO date string
    completed_at?: string; // Optional ISO date string
    status: 'in_progress' | 'pending_review' | 'completed' | 'reopened';
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
  }