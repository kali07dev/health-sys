package schema

import (
	"time"

	"github.com/hopkali04/health-sys/internal/models"
)

type CorrectiveActionRequest struct {
	IncidentID           string `json:"incident_id" validate:"required,uuid4"`
	CompletedBy          string
	Description          string `json:"description" validate:"required"`
	ActionType           string `json:"action_type" validate:"required,max=50"`
	Priority             string `json:"priority" validate:"required,oneof=low medium high critical"`
	Status               string `json:"status" validate:"omitempty,oneof=pending in_progress completed verified overdue"`
	AssignedTo           string `json:"assigned_to" validate:"required,uuid4"`
	AssignedBy           string `json:"assigned_by" validate:"required,uuid4"`
	DueDate              string `json:"due_date" validate:"required,datetime=2006-01-02T15:04:05Z07:00"`
	CompletedAt          string `json:"completed_at" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	CompletionNotes      string `json:"completion_notes" validate:"omitempty"`
	VerificationRequired bool   `json:"verification_required"`
	VerifiedBy           string `json:"verified_by" validate:"omitempty,uuid4"`
	VerifiedAt           string `json:"verified_at" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
}
type UpdateCorrectiveActionRequest struct {
	IncidentID           string `json:"incident_id"`
	CompletedBy          string
	Description          string `json:"description" `
	ActionType           string `json:"action_type" `
	Priority             string `json:"priority"`
	Status               string `json:"status" `
	AssignedTo           string `json:"assigned_to"`
	AssignedBy           string `json:"assigned_by"`
	DueDate              string `json:"due_date" `
	CompletedAt          string `json:"completed_at"`
	CompletionNotes      string `json:"completion_notes" validate:"omitempty"`
	VerificationRequired bool   `json:"verification_required"`
	VerifiedBy           string `json:"verified_by" validate:"omitempty,uuid4"`
	VerifiedAt           string `json:"verified_at"`
}

type CorrectiveActionResponse struct {
	ID                   string    `json:"id"`
	IncidentID           string    `json:"incidentId"`
	Description          string    `json:"description"`
	ActionType           string    `json:"actionType"`
	Priority             string    `json:"priority"`
	Status               string    `json:"status"`
	AssignedTo           string    `json:"assignedTo"`
	AssignedBy           string    `json:"assignedBy"`
	DueDate              string    `json:"dueDate"`
	CompletedAt          *string   `json:"completedAt,omitempty"`
	CompletionNotes      *string   `json:"completionNotes,omitempty"`
	VerificationRequired bool      `json:"verificationRequired"`
	VerifiedBy           *string   `json:"verifiedBy,omitempty"`
	VerifiedAt           *string   `json:"verifiedAt,omitempty"`
	CreatedAt           time.Time `json:"createdAt,omitempty"`
}

func ToCActionResponse(ca *models.CorrectiveAction) CorrectiveActionResponse {
	// Convert time fields to ISO 8601 formatted strings
	dueDate := ca.DueDate.Format(time.RFC3339)
	var completedAt, verifiedAt *string
	if !ca.CompletedAt.IsZero() {
		completedAtStr := ca.CompletedAt.Format(time.RFC3339)
		completedAt = &completedAtStr
	}
	if !ca.VerifiedAt.IsZero() {
		verifiedAtStr := ca.VerifiedAt.Format(time.RFC3339)
		verifiedAt = &verifiedAtStr
	}

	// Convert UUID fields to strings
	verifiedBy := ""
	if ca.VerifiedBy != nil {
		verifiedBy = ca.VerifiedBy.String()
	}

	return CorrectiveActionResponse{
		ID:                   ca.ID.String(),
		IncidentID:           ca.IncidentID.String(),
		Description:          ca.Description,
		ActionType:           ca.ActionType,
		Priority:             ca.Priority,
		Status:               ca.Status,
		AssignedTo:           ca.AssignedTo.String(),
		AssignedBy:           ca.AssignedBy.String(),
		DueDate:              dueDate,
		CompletedAt:          completedAt,
		CompletionNotes:      &ca.CompletionNotes,
		VerificationRequired: ca.VerificationRequired,
		VerifiedBy:           &verifiedBy,
		VerifiedAt:           verifiedAt,
		CreatedAt:           ca.CreatedAt,
	}
}

func ToCActionResponseArray(actions []models.CorrectiveAction) []CorrectiveActionResponse {
	response := make([]CorrectiveActionResponse, len(actions))
	for i, action := range actions {
		response[i] = ToCActionResponse(&action)
	}
	return response
}
