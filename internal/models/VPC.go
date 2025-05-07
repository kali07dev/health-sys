package models

import (
	"time"

	"github.com/google/uuid"
)

type VPC struct {
	ID                string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	VpcNumber         string    `gorm:"type:varchar(50);not null"`
	ReportedBy        string    `gorm:"type:varchar(50);not null"`
	ReportedDate      time.Time `gorm:"not null"`
	Department        string    `gorm:"type:varchar(50);not null"`
	Description       string    `gorm:"type:text;not null"`
	VpcType           string    `gorm:"type:varchar(50);not null; check:vpc_type IN ('safe', 'unsafe')"`
	ActionTaken       string    `gorm:"type:text;not null"`
	IncidentRelatesTo string    `gorm:"type:varchar(50);not null"`
	CreatedBy         uuid.UUID `gorm:"type:uuid;"`
	CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Attachments []VPCAttachment `gorm:"foreignKey:VPCID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	Creator     Employee        `gorm:"foreignKey:CreatedBy;references:ID"` // Employee who created this VPC
}
