package schema

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

type FlexibleInvestigationForm struct {
	RootCause            *string        `json:"rootCause"`  // Note the camelCase
    // ContributingFactors  []string       `json:"contributingFactors"`  // Specify string type
    Findings             *string        `json:"findings"`
    Recommendations      *string        `json:"recommendations"`

	IncidentID           *uuid.UUID     `json:"incident_id"`
	LeadInvestigatorID   *uuid.UUID     `json:"lead_investigator_id"`

	Description          *string        `json:"description"`
	ContributingFactors  []interface{}  `json:"contributingFactors"`
	InvestigationMethods []interface{}  `json:"investigationMethods"`
	// Findings             *string        `json:"findings"`
	// Recommendations      *string        `json:"recommendations"`
	StartedAt            *time.Time     `json:"started_at"`
	CompletedAt          *time.Time     `json:"completed_at,omitempty"`
	Status               *string        `json:"status"`
}

type InvestigationForm struct {
	IncidentID           uuid.UUID   `json:"incident_id" validate:"required"`
	LeadInvestigatorID   uuid.UUID   `json:"lead_investigator_id" validate:"required"`
	RootCause            string      `json:"root_cause"`
	Description          string      `json:"description"`
	ContributingFactors  interface{} `json:"contributing_factors"`  // JSONB field
	InvestigationMethods interface{} `json:"investigation_methods"` // JSONB field
	Findings             string      `json:"findings"`
	Recommendations      string      `json:"recommendations"`
	StartedAt            time.Time   `json:"started_at" validate:"required"`
	CompletedAt          time.Time   `json:"completed_at,omitempty"` // Optional
	Status               string      `json:"status" validate:"oneof=in_progress pending_review completed reopened"`
}

type InvestigationEvidenceResponse struct {
	ID              string    `json:"id"`
	InvestigationID string    `json:"investigationId"`
	EvidenceType    string    `json:"evidenceType"`
	Description     string    `json:"description"`
	FileURL         string    `json:"fileURL,omitempty"`
	CollectedAt     time.Time `json:"collectedAt"`
	CollectedBy     string    `json:"collectedBy"`
	CollectorName   string    `json:"collectorName,omitempty"`
	StorageLocation string    `json:"storageLocation,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type InvestigationInterviewResponse struct {
	ID              string     `json:"id"`
	InvestigationID string     `json:"investigationId"`
	IntervieweeID   string     `json:"intervieweeId"`
	IntervieweeName string     `json:"intervieweeName,omitempty"`
	ScheduledFor    time.Time  `json:"scheduledFor"`
	Status          string     `json:"status"`
	Notes           string     `json:"notes,omitempty"`
	Location        string     `json:"location,omitempty"`
	CompletedAt     *time.Time `json:"completedAt,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type InvestigationResponse struct {
	ID                   string                           `json:"id"`
	IncidentID           string                           `json:"incidentId"`
	IncidentTitle        string                           `json:"incidentTitle,omitempty"`
	LeadInvestigatorID   string                           `json:"leadInvestigatorId"`
	LeadInvestigatorName string                           `json:"leadInvestigatorName,omitempty"`
	Description          string                           `json:"description,omitempty"`
	RootCause            string                           `json:"rootCause,omitempty"`
	ContributingFactors  interface{}                      `json:"contributingFactors,omitempty"`
	InvestigationMethods interface{}                      `json:"investigationMethods,omitempty"`
	Findings             string                           `json:"findings,omitempty"`
	Recommendations      string                           `json:"recommendations,omitempty"`
	StartedAt            time.Time                        `json:"startedAt"`
	CompletedAt          *time.Time                       `json:"completedAt,omitempty"`
	Status               string                           `json:"status"`
	DurationDays         int                              `json:"durationDays,omitempty"`
	CreatedAt            string                           `json:"createdAt"`
	UpdatedAt            string                           `json:"updatedAt"`
	Incident             *Inv_IncidentResponse            `json:"incident,omitempty"`
	Interviews           []InvestigationInterviewResponse `json:"interviews,omitempty"`
	Evidence             []InvestigationEvidenceResponse  `json:"evidence,omitempty"`
}

type Inv_EmployeeResponse struct {
	FirstName string `json:"FirstName"`
	LastName  string `json:"LastName"`
}

type Inv_IncidentResponse struct {
	Title         string `json:"Title"`
	Description   string `json:"Description"`
	Location      string `json:"Location"`
	SeverityLevel string `json:"SeverityLevel"`
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
	var completedAt *time.Time
	if investigation.CompletedAt != nil && !investigation.CompletedAt.IsZero() {
		completedAt = investigation.CompletedAt
	}

	// Convert JSONB to string arrays for frontend
	var contributingFactors []string
	var investigationMethods []string

	// If JSONB has an accessor method like RawBytes() []byte
	// if investigation.ContributingFactors != nil {
	// 	json.Unmarshal(investigation.ContributingFactors, &contributingFactors)
	// }

	// if investigation.InvestigationMethods != nil {
	// 	json.Unmarshal(investigation.InvestigationMethods, &contributingFactors)
	// }

	// Calculate investigation duration in days
	durationDays := 0
	if investigation.CompletedAt != nil {
		duration := investigation.CompletedAt.Sub(investigation.StartedAt)
		durationDays = int(duration.Hours() / 24)
	} else {
		duration := time.Now().Sub(investigation.StartedAt)
		durationDays = int(duration.Hours() / 24)
	}

	return &InvestigationResponse{
		ID:                   investigation.ID.String(),
		IncidentID:           investigation.IncidentID.String(),
		Description:          investigation.Description,
		LeadInvestigatorID:   investigation.LeadInvestigatorID.String(),
		RootCause:            investigation.RootCause,
		ContributingFactors:  contributingFactors,
		InvestigationMethods: investigationMethods,
		Findings:             investigation.Findings,
		Recommendations:      investigation.Recommendations,
		StartedAt:            investigation.StartedAt,
		DurationDays:         durationDays,
		CompletedAt:          completedAt,
		Status:               investigation.Status,
		CreatedAt:            investigation.CreatedAt.Format(time.RFC3339),
		UpdatedAt:            investigation.UpdatedAt.Format(time.RFC3339),
		LeadInvestigatorName: investigation.LeadInvestigator.FirstName + investigation.LeadInvestigator.LastName,
		Incident: &Inv_IncidentResponse{
			Title:       investigation.Incident.Title,
			Description: investigation.Incident.Description,
			Location: investigation.Incident.Location,
			SeverityLevel: investigation.Incident.SeverityLevel,
		},
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

func ToInvestigationEvidenceResponse(evidence *models.InvestigationEvidence) InvestigationEvidenceResponse {
	collectorName := ""
	if evidence.Collector.ID != uuid.Nil {
		collectorName = fmt.Sprintf("%s %s", evidence.Collector.FirstName, evidence.Collector.LastName)
	}

	return InvestigationEvidenceResponse{
		ID:              evidence.ID.String(),
		InvestigationID: evidence.InvestigationID.String(),
		EvidenceType:    evidence.EvidenceType,
		Description:     evidence.Description,
		FileURL:         evidence.FileURL,
		CollectedAt:     evidence.CollectedAt,
		CollectedBy:     evidence.CollectedBy.String(),
		CollectorName:   collectorName,
		StorageLocation: evidence.StorageLocation,
		CreatedAt:       evidence.CreatedAt,
		UpdatedAt:       evidence.UpdatedAt,
	}
}

func ToInvestigationInterviewResponse(interview *models.InvestigationInterview) InvestigationInterviewResponse {
	intervieweeName := ""
	if interview.Interviewee.ID != uuid.Nil {
		intervieweeName = fmt.Sprintf("%s %s", interview.Interviewee.FirstName, interview.Interviewee.LastName)
	}

	var completedAt *time.Time
	if !interview.CompletedAt.IsZero() {
		completedAt = &interview.CompletedAt
	}

	return InvestigationInterviewResponse{
		ID:              interview.ID.String(),
		InvestigationID: interview.InvestigationID.String(),
		IntervieweeID:   interview.IntervieweeID.String(),
		IntervieweeName: intervieweeName,
		ScheduledFor:    interview.ScheduledFor,
		Status:          interview.Status,
		Notes:           interview.Notes,
		Location:        interview.Location,
		CompletedAt:     completedAt,
		CreatedAt:       interview.CreatedAt,
		UpdatedAt:       interview.UpdatedAt,
	}
}
