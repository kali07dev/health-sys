package models

import (
	"time"

	"github.com/google/uuid"
)

type ActionUpdate struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ActionID     uuid.UUID `gorm:"type:uuid;not null"`
	UpdateText   string    `gorm:"type:text;not null"`
	StatusChange string    `gorm:"size:30"`
	UpdatedBy    uuid.UUID `gorm:"type:uuid;not null"`
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	CorrectiveAction CorrectiveAction `gorm:"foreignKey:ActionID"`
	Updater          Employee         `gorm:"foreignKey:UpdatedBy"`
}
