package models

import (
	"time"
	"github.com/google/uuid"
)

type User struct {
	ID                  uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	Email               string    `gorm:"size:255;not null;unique"`
	PasswordHash        string    `gorm:"size:255"`
	GoogleID            string    `gorm:"size:255;unique"`
	MicrosoftID         string    `gorm:"size:255;unique"`
	MFAEnabled          bool      `gorm:"default:false"`
	MFASecret           string    `gorm:"size:255"`
	FailedLoginAttempts int       `gorm:"default:0"`
	LastLoginAt         time.Time
	PasswordChangedAt   time.Time
	AccountLocked       bool      `gorm:"default:false"`
	AccountLockedUntil  time.Time
	IsActive            bool      `gorm:"default:true"`
	CreatedAt           time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt           time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	DeletedAt           time.Time
}