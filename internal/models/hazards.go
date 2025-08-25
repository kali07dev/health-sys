package models

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)


// Hazard represents a reported hazard in the system.
type Hazard struct {
	ID                uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReferenceNumber   string     `gorm:"size:50;not null;uniqueIndex"`
	Type              string     `gorm:"size:50;not null;check:type IN ('unsafe_act', 'unsafe_condition', 'environmental')"`
	RiskLevel         string     `gorm:"size:20;not null;check:risk_level IN ('low', 'medium', 'high', 'extreme')"`
	Status            string     `gorm:"size:30;not null;default:'new';check:status IN ('new', 'assessing', 'action_required', 'resolved', 'closed')"`
	Title             string     `gorm:"size:255;not null"`
	Description       string     `gorm:"type:text;not null"`
	Location          string     `gorm:"size:255;not null"`
	FullLocation      string     `gorm:"size:255;"`
	RecommendedAction string     `gorm:"type:text"`
	ReportedBy        uuid.UUID  `gorm:"type:uuid;not null"`
	UserReported      string     `gorm:"size:255"`
	AssignedTo        *uuid.UUID `gorm:"type:uuid"`
	CreatedAt         time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt         time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	ClosedAt          *time.Time

	// Relationships
	Reporter Employee `gorm:"foreignKey:ReportedBy"`
	Assignee Employee `gorm:"foreignKey:AssignedTo"`
}

// BeforeCreate is a GORM hook that runs before a new hazard record is created.
// It generates a sequential reference number (e.g., HAZ00001).
func (hazard *Hazard) BeforeCreate(tx *gorm.DB) error {
	if hazard.ReferenceNumber == "" {
		hazardNumber, err := generateNextHazardNumber(tx)
		if err != nil {
			return fmt.Errorf("failed to generate hazard number: %w", err)
		}
		hazard.ReferenceNumber = hazardNumber
	}
	return nil
}

// generateNextHazardNumber creates the next sequential hazard number.
func generateNextHazardNumber(tx *gorm.DB) (string, error) {
	var lastHazard Hazard

	// Find the hazard with the highest reference number starting with "HAZ"
	err := tx.Where("reference_number LIKE 'HAZ%'").
		Order("LENGTH(reference_number) DESC, reference_number DESC").
		First(&lastHazard).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return "", fmt.Errorf("failed to query last hazard: %w", err)
	}

	nextNumber := 1
	if err != gorm.ErrRecordNotFound {
		// Extract the numeric part from the reference number
		numberStr := strings.TrimPrefix(lastHazard.ReferenceNumber, "HAZ")
		if num, parseErr := strconv.Atoi(numberStr); parseErr == nil {
			nextNumber = num + 1
		}
	}

	// Format the number with leading zeros (e.g., HAZ00001)
	return fmt.Sprintf("HAZ%05d", nextNumber), nil
}

// TableName specifies the table name for the Hazard model in the database.
func (Hazard) TableName() string {
	return "hazards"
}
