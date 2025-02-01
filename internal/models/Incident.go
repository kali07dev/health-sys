package models

import (
	"time"

	"github.com/google/uuid"
)

type Incident struct {
	ID                      uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReferenceNumber         string    `gorm:"size:50;not null;unique"`
	Type                    string    `gorm:"size:50;not null;check:type IN ('injury', 'near_miss', 'property_damage', 'environmental', 'security')"`
	SeverityLevel           string    `gorm:"size:20;not null;check:severity_level IN ('low', 'medium', 'high', 'critical')"`
	Status                  string    `gorm:"size:30;not null;default:'new';check:status IN ('new', 'investigating', 'action_required', 'resolved', 'closed')"`
	Title                   string    `gorm:"size:255;not null"`
	Description             string    `gorm:"type:text;not null"`
	Location                string    `gorm:"size:255;not null"`
	OccurredAt              time.Time `gorm:"not null"`
	ReportedBy              uuid.UUID `gorm:"type:uuid;not null"`
	AssignedTo              uuid.UUID `gorm:"type:uuid"`
	ImmediateActionsTaken   string    `gorm:"type:text"`
	Witnesses               JSONB     `gorm:"type:jsonb"`
	EnvironmentalConditions JSONB     `gorm:"type:jsonb"`
	EquipmentInvolved       JSONB     `gorm:"type:jsonb"`
	CreatedAt               time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt               time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	ClosedAt                time.Time

	// Relationships
	Reporter Employee `gorm:"foreignKey:ReportedBy"`
	Assignee Employee `gorm:"foreignKey:AssignedTo"`
}

type IncidentSummary struct{}
