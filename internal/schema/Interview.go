package schema

import (
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
)

// Interview DTOs
type CreateInterviewDTO struct {
	InvestigationID uuid.UUID `json:"investigationId" validate:"required"`
	IntervieweeID   uuid.UUID `json:"intervieweeId" validate:"required"`
	ScheduledFor    time.Time `json:"scheduledFor" validate:"required,future"`
	Location        string    `json:"location" validate:"required"`
	Notes           string    `json:"notes"`
}

type UpdateInterviewDTO struct {
	ScheduledFor *time.Time `json:"scheduledFor" validate:"omitempty,future"`
	Status       *string    `json:"status" validate:"omitempty,oneof=scheduled completed cancelled rescheduled"`
	Notes        *string    `json:"notes"`
	Location     *string    `json:"location"`
	CompletedAt  *time.Time `json:"completedAt"`
}

// Investigation Evidence DTOs
type CreateEvidenceDTO struct {
	InvestigationID uuid.UUID `json:"investigationId" validate:"required"`
	EvidenceType    string    `json:"evidenceType" validate:"required,oneof=document photo video physical_item testimony"`
	Description     string    `json:"description" validate:"required"`
	FileURL         string    `json:"fileUrl"`
	CollectedBy     uuid.UUID `json:"collectedBy" validate:"required"`
	StorageLocation string    `json:"storageLocation"`
}

type UpdateEvidenceDTO struct {
	Description     *string `json:"description"`
	StorageLocation *string `json:"storageLocation"`
	FileURL         *string `json:"fileUrl"`
}

// Corrective Action Evidence DTOs
type CreateActionEvidenceDTO struct {
	FileType    string    `json:"fileType" validate:"required,oneof=document photo video"`
	FileName    string    `json:"fileName" validate:"required"`
	FileURL     string    `json:"fileUrl" validate:"required"`
	UploadedBy  uuid.UUID `json:"uploadedBy" validate:"required"`
	Description string    `json:"description"`
}

// Investigation Timeline Entry DTO
type TimelineEntryDTO struct {
	Type        string    `json:"type" validate:"required,oneof=created updated interview_scheduled interview_completed evidence_added finding_added action_created action_completed"`
	Timestamp   time.Time `json:"timestamp"`
	Description string    `json:"description"`
	UserID      uuid.UUID `json:"userId"`
	RelatedID   uuid.UUID `json:"relatedId,omitempty"` // ID of related entity (interview, evidence, etc.)
}

// Investigation Progress DTO
type InvestigationProgressDTO struct {
	TotalInterviews     int                `json:"totalInterviews"`
	CompletedInterviews int                `json:"completedInterviews"`
	TotalEvidence       int                `json:"totalEvidence"`
	TotalActions        int                `json:"totalActions"`
	CompletedActions    int                `json:"completedActions"`
	Timeline            []TimelineEntryDTO `json:"timeline"`
	LastUpdated         time.Time          `json:"lastUpdated"`
	Status              string             `json:"status"`
}

// Notification Preferences DTO
type NotificationPreferencesDTO struct {
	UserID             uuid.UUID `json:"userId" validate:"required"`
	EmailNotifications bool      `json:"emailNotifications"`
	PushNotifications  bool      `json:"pushNotifications"`
	ReminderHours      int       `json:"reminderHours" validate:"min=1,max=72"` // Hours before deadline for reminders
}

// Search/Filter DTOs
type SearchInvestigationsDTO struct {
	StartDate        *time.Time `json:"startDate"`
	EndDate          *time.Time `json:"endDate"`
	Status           []string   `json:"status"`
	LeadInvestigator *uuid.UUID `json:"leadInvestigator"`
	IncidentType     []string   `json:"incidentType"`
	Location         string     `json:"location"`
	Page             int        `json:"page" validate:"min=1"`
	PageSize         int        `json:"pageSize" validate:"min=10,max=100"`
}

type SearchCorrectiveActionsDTO struct {
	StartDate  *time.Time `json:"startDate"`
	EndDate    *time.Time `json:"endDate"`
	Status     []string   `json:"status"`
	Priority   []string   `json:"priority"`
	AssignedTo *uuid.UUID `json:"assignedTo"`
	IncidentID *uuid.UUID `json:"incidentId"`
	Page       int        `json:"page" validate:"min=1"`
	PageSize   int        `json:"pageSize" validate:"min=10,max=100"`
}

// Response DTOs
type InvestigationDetailDTO struct {
	Investigation     models.Investigation            `json:"investigation"`
	Interviews        []models.InvestigationInterview `json:"interviews"`
	Evidence          []models.InvestigationEvidence  `json:"evidence"`
	CorrectiveActions []models.CorrectiveAction       `json:"correctiveActions"`
	Progress          InvestigationProgressDTO        `json:"progress"`
}

type ActionDetailDTO struct {
	Action         models.CorrectiveAction `json:"action"`
	Evidence       []models.ActionEvidence `json:"evidence"`
	Notifications  []models.Notification   `json:"notifications"`
	TimeToDeadline time.Duration           `json:"timeToDeadline"`
}
