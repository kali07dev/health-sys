package schema

import (
	"fmt"
	"time"

	"github.com/hopkali04/health-sys/internal/models"
)

type CreateIncidentRequest struct {
	Type          string    `json:"type" validate:"required,oneof=injury near_miss property_damage environmental security"`
	InjuryType    string    `json:"injuryType"`
	SeverityLevel string    `json:"severityLevel" validate:"required,oneof=low medium high critical"`
	Title         string    `json:"title" validate:"required,max=255"`
	Description   string    `json:"description" validate:"required"`
	Location      string    `json:"location" validate:"required,max=255"`
	FullLocation  string    `json:"fulllocation" validate:"required,max=255"`
	OccurredAt    time.Time `json:"occurredAt" validate:"required"`
	// ReportedBy              uuid.UUID
	// AssignedTo              uuid.UUID      `json:"assignedTo"`
	ReporterFullName        string         `json:"reporterFullName"`
	LateReason              string         `json:"lateReason"`
	UserIncidentID          string         `json:"userIncidentID"`
	ImmediateActionsTaken   string         `json:"immediateActionsTaken"`
	Witnesses               map[string]any `json:"witnesses"`               // JSONB field
	EnvironmentalConditions map[string]any `json:"environmentalConditions"` // JSONB field
	EquipmentInvolved       map[string]any `json:"equipmentInvolved"`       // JSONB field
}
type UpdateIncidentRequest struct {
	Type                    *string         `json:"type" validate:"omitempty,oneof=injury near_miss property_damage environmental security"`
	InjuryType              *string         `json:"injuryType"`
	SeverityLevel           *string         `json:"severityLevel" validate:"omitempty,oneof=low medium high critical"`
	Title                   *string         `json:"title" validate:"omitempty,max=255"`
	Description             *string         `json:"description"`
	Location                *string         `json:"location" validate:"omitempty,max=255"`
	FullLocation            *string         `json:"fulllocation" validate:"omitempty,max=255"`
	Status                  *string         `json:"status" validate:"omitempty,oneof=new investigating action_required resolved closed"`
	ReporterFullName        *string         `json:"reporterFullName"`
	LateReason              *string         `json:"lateReason"`
	UserIncidentID          *string         `json:"userIncidentID"`
	OccurredAt              *time.Time      `json:"occurredAt"`
	ImmediateActionsTaken   *string         `json:"immediateActionsTaken"`
	Witnesses               *map[string]any `json:"witnesses"`
	EnvironmentalConditions *map[string]any `json:"environmentalConditions"`
	EquipmentInvolved       *map[string]any `json:"equipmentInvolved"`
}
type IncidentResponse struct {
	ID              string `json:"id"`
	ReferenceNumber string `json:"referenceNumber"`
	Type            string `json:"type"`
	UserReported    string `json:"userReported"`
	UserIncidentID  string `json:"userIncidentID"`
	// InjuryType              string                 `json:"injuryType,omitempty"`
	SeverityLevel           string                 `json:"severityLevel"`
	Status                  string                 `json:"status"`
	Title                   string                 `json:"title"`
	Description             string                 `json:"description"`
	Location                string                 `json:"location"`
	FullLocation            string                 `json:"fulllocation"`
	LateReason              string                 `json:"lateReason"`
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
	if i.ClosedAt != nil && !i.ClosedAt.IsZero() {
		closedAt = i.ClosedAt
	}
	if i.Type == "injury" {
		i.Type = fmt.Sprintf("%s %s", i.Type, i.InjuryType)
	}

	return IncidentResponse{
		ID:              i.ID.String(),
		ReferenceNumber: i.ReferenceNumber,
		Type:            i.Type,
		// InjuryType:              *i.InjuryType,
		UserIncidentID:          i.UserIncidentID,
		UserReported:            i.UserReported,
		SeverityLevel:           i.SeverityLevel,
		Status:                  i.Status,
		Title:                   i.Title,
		Description:             i.Description,
		Location:                i.Location,
		FullLocation:            i.FullLocation,
		LateReason:              i.LateReason,
		OccurredAt:              i.OccurredAt,
		ReportedBy:              fmt.Sprintf("%s %s", i.Reporter.FirstName, i.Reporter.LastName),
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
