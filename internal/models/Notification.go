package models

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID        uuid.UUID `gorm:"type:uuid;not null"`
	Type          string    `gorm:"size:50;not null"`
	Title         string    `gorm:"size:255;not null"`
	Message       string    `gorm:"type:text;not null"`
	ReferenceID   uuid.UUID `gorm:"type:uuid"`
	ReferenceType string    `gorm:"size:50"`
	ReadAt        time.Time
	CreatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	User User `gorm:"foreignKey:UserID"`
}
