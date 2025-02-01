package models

import (
	"time"
	"github.com/google/uuid"
)

type IncidentAttachment struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	IncidentID  uuid.UUID `gorm:"type:uuid;not null"`
	FileName    string    `gorm:"size:255;not null"`
	FileType    string    `gorm:"size:100;not null"`
	FileSize    int       `gorm:"not null"`
	StoragePath string    `gorm:"size:512;not null"`
	UploadedBy  uuid.UUID `gorm:"type:uuid;not null"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Incident  Incident `gorm:"foreignKey:IncidentID"`
	Uploader  Employee `gorm:"foreignKey:UploadedBy"`
}