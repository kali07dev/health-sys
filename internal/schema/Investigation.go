package schema

import (
	"time"

	"github.com/google/uuid"
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
