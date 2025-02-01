package models

import (
	"time"

	"github.com/google/uuid"
)

type CorrectiveAction struct {
	ID                   uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	IncidentID           uuid.UUID `gorm:"type:uuid;not null"`
	Description          string    `gorm:"type:text;not null"`
	ActionType           string    `gorm:"size:50;not null"`
	Priority             string    `gorm:"size:20;not null;check:priority IN ('low', 'medium', 'high', 'critical')"`
	Status               string    `gorm:"size:30;not null;default:'pending';check:status IN ('pending', 'in_progress', 'completed', 'verified', 'overdue')"`
	AssignedTo           uuid.UUID `gorm:"type:uuid;not null"`
	AssignedBy           uuid.UUID `gorm:"type:uuid;not null"`
	DueDate              time.Time `gorm:"not null"`
	CompletedAt          time.Time
	CompletionNotes      string    `gorm:"type:text"`
	VerificationRequired bool      `gorm:"default:false"`
	VerifiedBy           uuid.UUID `gorm:"type:uuid"`
	VerifiedAt           time.Time
	CreatedAt            time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt            time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Incident Incident `gorm:"foreignKey:IncidentID"`
	Assignee Employee `gorm:"foreignKey:AssignedTo"`
	Assigner Employee `gorm:"foreignKey:AssignedBy"`
	Verifier Employee `gorm:"foreignKey:VerifiedBy"`
}
