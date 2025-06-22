package models

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Incident struct {
	ID                      uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReferenceNumber         string     `gorm:"size:50;not null;"`
	UserIncidentID          string     `gorm:"type:text;"`
	Type                    string     `gorm:"size:50;not null;check:type IN ('injury', 'near_miss', 'property_damage', 'environmental', 'security')"`
	InjuryType              string     `gorm:"size:50"`
	SeverityLevel           string     `gorm:"size:20;not null;check:severity_level IN ('low', 'medium', 'high', 'critical')"`
	Status                  string     `gorm:"size:30;not null;default:'new';check:status IN ('new', 'investigating', 'action_required', 'resolved', 'closed')"`
	Title                   string     `gorm:"size:255;not null"`
	Description             string     `gorm:"type:text;not null"`
	Location                string     `gorm:"size:255;not null"`
	FullLocation            string     `gorm:"size:255;"`
	OccurredAt              time.Time  `gorm:"not null"`
	ReportedBy              uuid.UUID  `gorm:"type:uuid;not null"`
	UserReported            string     `gorm:"size:255"`
	AssignedTo              *uuid.UUID `gorm:"type:uuid"`
	ImmediateActionsTaken   string     `gorm:"type:text"`
	Witnesses               JSONB      `gorm:"type:jsonb"`
	EnvironmentalConditions JSONB      `gorm:"type:jsonb"`
	EquipmentInvolved       JSONB      `gorm:"type:jsonb"`
	CreatedAt               time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt               time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	ClosedAt                *time.Time

	// Relationships
	Reporter Employee `gorm:"foreignKey:ReportedBy"`
	Assignee Employee `gorm:"foreignKey:AssignedTo"`
}

type IncidentSummary struct{}

// BeforeCreate GORM hook to generate UserIncidentID
func (incident *Incident) BeforeCreate(tx *gorm.DB) error {
	// Generate incident number if not provided
	if incident.ReferenceNumber == "" {
		incidentNumber, err := generateNextIncidentNumber(tx)
		if err != nil {
			return fmt.Errorf("failed to generate incident number: %w", err)
		}
		incident.ReferenceNumber = incidentNumber
	}

	return nil
}

// generateNextIncidentNumber generates the next sequential incident number
func generateNextIncidentNumber(tx *gorm.DB) (string, error) {
	var lastIncident Incident

	// Find the incident with the highest number
	err := tx.Where("reference_number LIKE 'INC%'").
		Order("LENGTH(reference_number) DESC, reference_number DESC").
		First(&lastIncident).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return "", fmt.Errorf("failed to query last incident: %w", err)
	}

	nextNumber := 1

	if err != gorm.ErrRecordNotFound {
		// Extract the numeric part from incident number
		numberStr := strings.TrimPrefix(lastIncident.ReferenceNumber, "INC")
		// Remove leading zeros and convert to int
		if num, parseErr := strconv.Atoi(numberStr); parseErr == nil {
			nextNumber = num + 1
		}
	}

	// Format with leading zeros (INC00001, INC00002, etc.)
	return fmt.Sprintf("INC%05d", nextNumber), nil
}

// TableName specifies the table name for GORM
func (Incident) TableName() string {
	return "incidents"
}
