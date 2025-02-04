package schema

import (
	"time"

	"github.com/google/uuid"
)

type CreateIncidentRequest struct {
	Type                    string         `json:"type" validate:"required,oneof=injury near_miss property_damage environmental security"`
	SeverityLevel           string         `json:"severity_level" validate:"required,oneof=low medium high critical"`
	Title                   string         `json:"title" validate:"required,max=255"`
	Description             string         `json:"description" validate:"required"`
	Location                string         `json:"location" validate:"required,max=255"`
	OccurredAt              time.Time      `json:"occurred_at" validate:"required"`
	ReportedBy              uuid.UUID      `json:"reported_by" validate:"required"`
	AssignedTo              uuid.UUID      `json:"assigned_to"`
	ImmediateActionsTaken   string         `json:"immediate_actions_taken"`
	Witnesses               map[string]any `json:"witnesses"`                // JSONB field
	EnvironmentalConditions map[string]any `json:"environmental_conditions"` // JSONB field
	EquipmentInvolved       map[string]any `json:"equipment_involved"`       // JSONB field
}
