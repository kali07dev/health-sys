package models

import (
	"time"
	"github.com/google/uuid"
)

type AuditLog struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	TableName string    `gorm:"size:50;not null"`
	RecordID  uuid.UUID `gorm:"type:uuid;not null"`
	Action    string    `gorm:"size:10;not null;check:action IN ('INSERT', 'UPDATE', 'DELETE')"`
	OldData   JSONB     `gorm:"type:jsonb"`
	NewData   JSONB     `gorm:"type:jsonb"`
	UserID    uuid.UUID `gorm:"type:uuid"`
	IPAddress string    `gorm:"type:inet"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

// JSONB is a custom type for handling JSONB fields in GORM.
type JSONB map[string]interface{}