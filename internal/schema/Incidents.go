package schema

import (
	"time"

	"github.com/hopkali04/health-sys/internal/models"
)

type CreateIncidentRequest struct {
	Type          string    `json:"type" validate:"required,oneof=injury near_miss property_damage environmental security"`
	SeverityLevel string    `json:"severityLevel" validate:"required,oneof=low medium high critical"`
	Title         string    `json:"title" validate:"required,max=255"`
	Description   string    `json:"description" validate:"required"`
	Location      string    `json:"location" validate:"required,max=255"`
	OccurredAt    time.Time `json:"occurredAt" validate:"required"`
	// ReportedBy              uuid.UUID
	// AssignedTo              uuid.UUID      `json:"assignedTo"`
	ImmediateActionsTaken   string         `json:"immediateActionsTaken"`
	Witnesses               map[string]any `json:"witnesses"`               // JSONB field
	EnvironmentalConditions map[string]any `json:"environmentalConditions"` // JSONB field
	EquipmentInvolved       map[string]any `json:"equipmentInvolved"`       // JSONB field
}

type IncidentResponse struct {
	ID                      string                 `json:"id"`
	ReferenceNumber         string                 `json:"referenceNumber"`
	Type                    string                 `json:"type"`
	SeverityLevel           string                 `json:"severityLevel"`
	Status                  string                 `json:"status"`
	Title                   string                 `json:"title"`
	Description             string                 `json:"description"`
	Location                string                 `json:"location"`
	OccurredAt              time.Time              `json:"occurredAt"`
	ReportedBy              string                 `json:"reportedBy"`
	AssignedTo              *string                `json:"assignedTo,omitempty"`
	ImmediateActionsTaken   string                 `json:"immediateActionsTaken,omitempty"`
	Witnesses               map[string]interface{} `json:"witnesses,omitempty"`
	EnvironmentalConditions map[string]interface{} `json:"environmentalConditions,omitempty"`
	EquipmentInvolved       map[string]interface{} `json:"equipmentInvolved,omitempty"`
	CreatedAt               time.Time              `json:"createdAt"`
	UpdatedAt               time.Time              `json:"updatedAt"`
	ClosedAt                *time.Time             `json:"closedAt,omitempty"`
}

func ToIncidentResponse(i models.Incident) IncidentResponse {
	var assignedTo *string
	if i.AssignedTo != nil {
		id := i.AssignedTo.String()
		assignedTo = &id
	}

	var closedAt *time.Time
	if !i.ClosedAt.IsZero() {
		closedAt = &i.ClosedAt
	}

	return IncidentResponse{
		ID:                      i.ID.String(),
		ReferenceNumber:         i.ReferenceNumber,
		Type:                    i.Type,
		SeverityLevel:           i.SeverityLevel,
		Status:                  i.Status,
		Title:                   i.Title,
		Description:             i.Description,
		Location:                i.Location,
		OccurredAt:              i.OccurredAt,
		ReportedBy:              i.ReportedBy.String(),
		AssignedTo:              assignedTo,
		ImmediateActionsTaken:   i.ImmediateActionsTaken,
		Witnesses:               i.Witnesses,
		EnvironmentalConditions: i.EnvironmentalConditions,
		EquipmentInvolved:       i.EquipmentInvolved,
		CreatedAt:               i.CreatedAt,
		UpdatedAt:               i.UpdatedAt,
		ClosedAt:                closedAt,
	}
}

func ToIncidentResponses(incidents []models.Incident) []IncidentResponse {
	responses := make([]IncidentResponse, len(incidents))
	for i, incident := range incidents {
		responses[i] = ToIncidentResponse(incident)
	}
	return responses
}
