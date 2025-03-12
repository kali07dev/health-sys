package models

import (
	"time"

	"github.com/google/uuid"
)

type Investigation struct {
	ID                   uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	IncidentID           uuid.UUID `gorm:"type:uuid;not null;unique"`
	LeadInvestigatorID   uuid.UUID `gorm:"type:uuid;not null"`
	Description          string    `gorm:"type:text"`
	RootCause            string    `gorm:"type:text"`
	ContributingFactors  JSONB     `gorm:"type:jsonb"`
	InvestigationMethods JSONB     `gorm:"type:jsonb"`
	Findings             string    `gorm:"type:text"`
	Recommendations      string    `gorm:"type:text"`
	StartedAt            time.Time `gorm:"not null"`
	CompletedAt          *time.Time
	Status               string    `gorm:"size:30;not null;default:'in_progress';check:status IN ('in_progress', 'pending_review', 'completed', 'reopened')"`
	CreatedAt            time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt            time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Incident         Incident `gorm:"foreignKey:IncidentID"`
	LeadInvestigator Employee `gorm:"foreignKey:LeadInvestigatorID"`
}
