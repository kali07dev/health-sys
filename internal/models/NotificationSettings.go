package models

import (
	"time"

	"github.com/google/uuid"
)

type NotificationSettings struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID            uuid.UUID `gorm:"type:uuid;not null;unique"`
	ReminderFrequency string    `gorm:"size:50;not null;default:'daily';check:reminder_frequency IN ('immediate', 'hourly', 'daily', 'weekly')"`
	LastReminderAt    time.Time
	CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	User User `gorm:"foreignKey:UserID"`
}
