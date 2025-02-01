package models

import (
	"time"

	"github.com/google/uuid"
)

type UserSession struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID       uuid.UUID `gorm:"type:uuid;not null"`
	RefreshToken string    `gorm:"size:255;not null"`
	DeviceInfo   JSONB     `gorm:"type:jsonb"`
	IPAddress    string    `gorm:"type:inet"`
	ExpiresAt    time.Time `gorm:"not null"`
	CreatedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	User User `gorm:"foreignKey:UserID"`
}
