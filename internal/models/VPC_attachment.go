// models/vpc_attachment.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type VPCAttachment struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	VPCID       string    `gorm:"type:uuid;not null"` // Foreign key to VPC
	FileName    string    `gorm:"size:255;not null"`
	FileType    string    `gorm:"size:100;not null"`
	FileSize    int       `gorm:"not null"`
	StoragePath string    `gorm:"size:512;not null"`
	UploadedBy  uuid.UUID `gorm:"type:uuid;not null"` // Foreign key to Employee.ID
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	VPC      VPC      `gorm:"foreignKey:VPCID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Uploader Employee `gorm:"foreignKey:UploadedBy;references:ID"` // Assumes Employee model has 'ID' as PK
}
