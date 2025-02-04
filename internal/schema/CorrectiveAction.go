package schema

type CorrectiveActionRequest struct {
	IncidentID           string `json:"incident_id" validate:"required,uuid4"`
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
