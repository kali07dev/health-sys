package schema

import (
	"time"
)

type CreateIncidentRequest struct {
	Type                    string         `json:"type" validate:"required,oneof=injury near_miss property_damage environmental security"`
	SeverityLevel           string         `json:"severityLevel" validate:"required,oneof=low medium high critical"`
	Title                   string         `json:"title" validate:"required,max=255"`
	Description             string         `json:"description" validate:"required"`
	Location                string         `json:"location" validate:"required,max=255"`
	OccurredAt              time.Time      `json:"occurredAt" validate:"required"`
	// ReportedBy              uuid.UUID      
	// AssignedTo              uuid.UUID      `json:"assignedTo"`
	ImmediateActionsTaken   string         `json:"immediateActionsTaken"`
	Witnesses               map[string]any `json:"witnesses"`                // JSONB field
	EnvironmentalConditions map[string]any `json:"environmentalConditions"` // JSONB field
	EquipmentInvolved       map[string]any `json:"equipmentInvolved"`       // JSONB field
}
