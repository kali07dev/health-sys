export type IncidentType = 'injury' | 'near_miss' | 'property_damage' | 'environmental' | 'security'
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Incident {
    id: string
    referenceNumber: string
    type: "injury" | "near_miss" | "property_damage" | "environmental" | "security"
    severityLevel: "low" | "medium" | "high" | "critical"
    status: "new" | "investigating" | "action_required" | "resolved" | "closed"
    title: string
    description: string
    location: string
    occurredAt: string
    reportedBy: string
    assignedTo?: string
    immediateActionsTaken?: string
    witnesses?: string[]
    environmentalConditions?: Record<string, string>
    equipmentInvolved?: string[]
    createdAt: string
    updatedAt: string
    closedAt?: string
}

export interface IncidentFormData {
  type: IncidentType
  severityLevel: SeverityLevel
  title: string
  description: string
  location: string
  occurredAt: string
  immediateActionsTaken: string
  reportedBy: string
  witnesses?: { name: string; contact: string }[]
  environmentalConditions?: Record<string, unknown>
  equipmentInvolved?: Record<string, unknown>
}