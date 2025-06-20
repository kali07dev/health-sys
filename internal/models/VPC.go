package models

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VPC struct {
	ID                string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	VpcNumber         string    `gorm:"type:varchar(50);not null;uniqueIndex"`
	ReportedBy        string    `gorm:"type:varchar(50);not null"`
	ReportedDate      time.Time `gorm:"not null"`
	Department        string    `gorm:"type:varchar(50);not null"`
	Description       string    `gorm:"type:text;not null"`
	VpcType           string    `gorm:"type:varchar(50);not null;"`
	ActionTaken       string    `gorm:"type:text;not null"`
	IncidentRelatesTo string    `gorm:"type:varchar(50);not null"`
	CreatedBy         uuid.UUID `gorm:"type:uuid;"`
	CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Attachments []VPCAttachment `gorm:"foreignKey:VPCID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	Creator     Employee        `gorm:"foreignKey:CreatedBy;references:ID"`
}

// BeforeCreate GORM hook to generate VPC number
func (vpc *VPC) BeforeCreate(tx *gorm.DB) error {
	// Generate VPC number if not provided
	if vpc.VpcNumber == "" {
		vpcNumber, err := generateNextVPCNumber(tx)
		if err != nil {
			return fmt.Errorf("failed to generate VPC number: %w", err)
		}
		vpc.VpcNumber = vpcNumber
	}

	return nil
}

// generateNextVPCNumber generates the next sequential VPC number
func generateNextVPCNumber(tx *gorm.DB) (string, error) {
	var lastVPC VPC

	// Find the VPC with the highest number
	err := tx.Where("vpc_number LIKE 'VPC%'").
		Order("LENGTH(vpc_number) DESC, vpc_number DESC").
		First(&lastVPC).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return "", fmt.Errorf("failed to query last VPC: %w", err)
	}

	nextNumber := 1

	if err != gorm.ErrRecordNotFound {
		// Extract the numeric part from VPC number
		numberStr := strings.TrimPrefix(lastVPC.VpcNumber, "VPC")
		// Remove leading zeros and convert to int
		if num, parseErr := strconv.Atoi(numberStr); parseErr == nil {
			nextNumber = num + 1
		}
	}

	// Format with leading zeros (VPC00001, VPC00002, etc.)
	return fmt.Sprintf("VPC%05d", nextNumber), nil
}

// TableName specifies the table name for GORM
func (VPC) TableName() string {
	return "vpcs"
}
