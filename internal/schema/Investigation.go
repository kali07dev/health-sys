package schema

import (
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

type InvestigationForm struct {
	IncidentID           uuid.UUID   `json:"incident_id" validate:"required"`
	LeadInvestigatorID   uuid.UUID   `json:"lead_investigator_id" validate:"required"`
	RootCause            string      `json:"root_cause"`
	ContributingFactors  interface{} `json:"contributing_factors"`  // JSONB field
	InvestigationMethods interface{} `json:"investigation_methods"` // JSONB field
	Findings             string      `json:"findings"`
	Recommendations      string      `json:"recommendations"`
	StartedAt            time.Time   `json:"started_at" validate:"required"`
	CompletedAt          *time.Time  `json:"completed_at,omitempty"` // Optional
	Status               string      `json:"status" validate:"oneof=in_progress pending_review completed reopened"`
}
type InvestigationResponse struct {
	ID                   string                 `json:"id"`
	IncidentID           string                 `json:"incidentId"`
	LeadInvestigatorID   string                 `json:"leadInvestigatorId"`
	RootCause            string                 `json:"rootCause"`
	ContributingFactors  map[string]interface{} `json:"contributingFactors"`
	InvestigationMethods map[string]interface{} `json:"investigationMethods"`
	Findings             string                 `json:"findings"`
	Recommendations      string                 `json:"recommendations"`
	StartedAt            string                 `json:"startedAt"`
	CompletedAt          *string                `json:"completedAt,omitempty"`
	Status               string                 `json:"status"`
	CreatedAt            string                 `json:"createdAt"`
	UpdatedAt            string                 `json:"updatedAt"`
}

// Investigation DTOs
type CreateInvestigationDTO struct {
	IncidentID           uuid.UUID `json:"incidentId" validate:"required"`
	LeadInvestigatorID   uuid.UUID `json:"leadInvestigatorId" validate:"required"`
	RootCause            string    `json:"rootCause"`
	ContributingFactors  []string  `json:"contributingFactors"`
	InvestigationMethods []string  `json:"investigationMethods"`
	Findings             string    `json:"findings"`
	Recommendations      string    `json:"recommendations"`
	StartedAt            time.Time `json:"startedAt" validate:"required"`
}

type UpdateInvestigationDTO struct {
	RootCause            *string    `json:"rootCause"`
	ContributingFactors  []string   `json:"contributingFactors"`
	InvestigationMethods []string   `json:"investigationMethods"`
	Findings             *string    `json:"findings"`
	Recommendations      *string    `json:"recommendations"`
	Status               *string    `json:"status" validate:"omitempty,oneof=in_progress pending_review completed reopened"`
	CompletedAt          *time.Time `json:"completedAt"`
}

func ConvertToInvestigationResponse(investigation *models.Investigation) *InvestigationResponse {
	completedAt := ""
	if investigation.CompletedAt != (time.Time{}) {
		completedAt = investigation.CompletedAt.Format(time.RFC3339)
	}

	return &InvestigationResponse{
		ID:                   investigation.ID.String(),
		IncidentID:           investigation.IncidentID.String(),
		LeadInvestigatorID:   investigation.LeadInvestigatorID.String(),
		RootCause:            investigation.RootCause,
		ContributingFactors:  investigation.ContributingFactors,
		InvestigationMethods: investigation.InvestigationMethods,
		Findings:             investigation.Findings,
		Recommendations:      investigation.Recommendations,
		StartedAt:            investigation.StartedAt.Format(time.RFC3339),
		CompletedAt:          &completedAt,
		Status:               investigation.Status,
		CreatedAt:            investigation.CreatedAt.Format(time.RFC3339),
		UpdatedAt:            investigation.UpdatedAt.Format(time.RFC3339),
	}
}

// Convert an array of Investigation models to an array of response objects
func ConvertToInvestigationResponses(investigations []models.Investigation) []*InvestigationResponse {
	var responses []*InvestigationResponse
	for _, investigation := range investigations {
		responses = append(responses, ConvertToInvestigationResponse(&investigation))
	}
	return responses
}
