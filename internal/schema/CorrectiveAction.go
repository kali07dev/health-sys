package schema

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

type CompletionNoted struct {
	Notes string `json:"completionNotes"`
}
type CreateCorrectiveActionRequest struct {
	IncidentID           string `json:"incidentId" validate:"required,uuid4"`
	CompletedBy          string `json:"completedby" validate:"omitempty,uuid4"`
	Description          string `json:"description" validate:"required"`
	ActionType           string `json:"actionType" validate:"required,max=50"`
	Priority             string `json:"priority" validate:"required,oneof=low medium high critical"`
	Status               string `json:"status" validate:"omitempty,oneof=pending in_progress completed verified overdue"`
	AssignedTo           string `json:"assignedTo" validate:"required,uuid4"`
	AssignedBy           string `json:"assignedBy" validate:"required,uuid4"`
	DueDate              string `json:"dueDate" validate:"required,datetime=2006-01-02T15:04:05Z07:00"`
	CompletedAt          string `json:"completedat" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	CompletionNotes      string `json:"completionnotes" validate:"omitempty"`
	VerificationRequired bool   `json:"verificationRequired"`
	VerifiedBy           string `json:"verifiedby" validate:"omitempty,uuid4"`
	VerifiedAt           string `json:"verifiedat" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
}
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
	CompletedAt          string `json:"completedAt"`
	CompletionNotes      string `json:"completionNotes" validate:"omitempty"`
	VerificationRequired bool   `json:"verification_required"`
	VerifiedBy           string `json:"verifiedby" validate:"omitempty,uuid4"`
	VerifiedAt           string `json:"verifiedat"`
}

// Enhanced ActionEvidenceResponse struct to include in the response
type ActionEvidenceResponse struct {
	ID                 string    `json:"id"`
	CorrectiveActionID string    `json:"correctiveActionId"`
	FileType           string    `json:"fileType"`
	FileName           string    `json:"fileName"`
	FileURL            string    `json:"fileURL"`
	UploadedBy         string    `json:"uploadedBy"`
	UploaderName       string    `json:"uploaderName,omitempty"`
	UploadedAt         time.Time `json:"uploadedAt"`
	Description        string    `json:"description,omitempty"`
	Feedback           string    `json:"feedback,omitempty"`
}

// Enhanced CorrectiveActionResponse struct with additional fields
type CorrectiveActionResponse struct {
	ID                   string                   `json:"id"`
	IncidentID           string                   `json:"incidentId"`
	IncidentTitle        string                   `json:"incidentTitle,omitempty"`
	IncidentLocation     string                   `json:"incidentLocation"`
	Description          string                   `json:"description"`
	ActionType           string                   `json:"actionType"`
	Priority             string                   `json:"priority"`
	Status               string                   `json:"status"`
	AssignedTo           string                   `json:"assignedTo"`
	AssigneeName         string                   `json:"assigneeName,omitempty"`
	AssignedBy           string                   `json:"assignedBy"`
	AssignerName         string                   `json:"assignerName,omitempty"`
	DueDate              string                   `json:"dueDate"`
	DaysRemaining        int                      `json:"daysRemaining,omitempty"`
	IsOverdue            bool                     `json:"isOverdue"`
	CompletedAt          *time.Time               `json:"completedAt"`
	CompletionNotes      *string                  `json:"completionNotes,omitempty"`
	VerificationRequired bool                     `json:"verificationRequired"`
	VerifiedBy           *string                  `json:"verifiedBy,omitempty"`
	VerifierName         *string                  `json:"verifierName,omitempty"`
	VerifiedAt           *string                  `json:"verifiedAt,omitempty"`
	CreatedAt            time.Time                `json:"createdAt"`
	UpdatedAt            time.Time                `json:"updatedAt"`
	Evidence             []ActionEvidenceResponse `json:"evidence,omitempty"`
}

// Convert ActionEvidence model to response
func ToActionEvidenceResponse(evidence *models.ActionEvidence) ActionEvidenceResponse {
	uploaderName := ""
	if evidence.Uploader.ID != uuid.Nil {
		uploaderName = fmt.Sprintf("%s %s", evidence.Uploader.FirstName, evidence.Uploader.LastName)
	}

	return ActionEvidenceResponse{
		ID:                 evidence.ID.String(),
		CorrectiveActionID: evidence.CorrectiveActionID.String(),
		FileType:           evidence.FileType,
		FileName:           evidence.FileName,
		FileURL:            evidence.FileURL,
		UploadedBy:         evidence.UploadedBy.String(),
		UploaderName:       uploaderName,
		UploadedAt:         evidence.UploadedAt,
		Description:        evidence.Description,
		Feedback:           evidence.Feedback,
	}
}

// Enhanced converter function for CorrectiveAction to Response
func ToCActionResponse(ca *models.CorrectiveAction) CorrectiveActionResponse {
	// Convert time fields to ISO 8601 formatted strings
	dueDate := ca.DueDate.Format(time.RFC3339)
	var verifiedAt *string
	if ca.VerifiedAt != nil && !ca.VerifiedAt.IsZero() {
		verifiedAtStr := ca.VerifiedAt.Format(time.RFC3339)
		verifiedAt = &verifiedAtStr
	}

	// Convert UUID fields to strings
	var verifiedBy string
	if ca.VerifiedBy != nil {
		verifiedBy = ca.VerifiedBy.String()
	}

	// Calculate days remaining until due date
	daysRemaining := int(time.Until(ca.DueDate).Hours() / 24)
	isOverdue := daysRemaining < 0 && ca.Status != "completed" && ca.Status != "verified"

	// Handle potentially nil relationships
	var assigneeName, assignerName string
	var verifierName *string
	var incidentTitle, incidentLocation string

	// Safely access Assignee
	if ca.Assignee.ID != uuid.Nil {
		assigneeName = fmt.Sprintf("%s %s", ca.Assignee.FirstName, ca.Assignee.LastName)
	}

	// Safely access Assigner
	if ca.Assigner.ID != uuid.Nil {
		assignerName = fmt.Sprintf("%s %s", ca.Assigner.FirstName, ca.Assigner.LastName)
	}

	// Safely access Verifier
	if ca.VerifiedBy != nil && ca.Verifier.ID != uuid.Nil {
		name := fmt.Sprintf("%s %s", ca.Verifier.FirstName, ca.Verifier.LastName)
		verifierName = &name
	}

	// Safely access Incident
	// This is the most problematic part - add a complete nil check
	if ca.Incident.ID != uuid.Nil {
		incidentTitle = ca.Incident.Title
		incidentLocation = ca.Incident.Location
	}

	// Create completion notes pointer
	completionNotes := ca.CompletionNotes

	return CorrectiveActionResponse{
		ID:                   ca.ID.String(),
		IncidentID:           ca.IncidentID.String(),
		IncidentTitle:        incidentTitle,
		IncidentLocation:     incidentLocation,
		Description:          ca.Description,
		ActionType:           ca.ActionType,
		Priority:             ca.Priority,
		Status:               ca.Status,
		AssignedTo:           ca.AssignedTo.String(),
		AssigneeName:         assigneeName,
		AssignedBy:           ca.AssignedBy.String(),
		AssignerName:         assignerName,
		DueDate:              dueDate,
		DaysRemaining:        daysRemaining,
		IsOverdue:            isOverdue,
		CompletedAt:          ca.CompletedAt,
		CompletionNotes:      &completionNotes,
		VerificationRequired: ca.VerificationRequired,
		VerifiedBy:           &verifiedBy,
		VerifierName:         verifierName,
		VerifiedAt:           verifiedAt,
		CreatedAt:            ca.CreatedAt,
		UpdatedAt:            ca.UpdatedAt,
		Evidence:             []ActionEvidenceResponse{},
	}
}

// Update ToCActionResponseArray to use the new response type
func ToCActionResponseArray(actions []models.CorrectiveAction) []CorrectiveActionResponse {
	response := make([]CorrectiveActionResponse, len(actions))
	for i, action := range actions {
		resp := ToCActionResponse(&action)
		response[i] = resp
	}
	return response
}
