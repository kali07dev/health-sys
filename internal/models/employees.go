package models

import (
	"time"
	"github.com/google/uuid"
)

type Employee struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID             uuid.UUID `gorm:"type:uuid;unique"`
	EmployeeNumber     string    `gorm:"size:50;not null;unique"`
	FirstName          string    `gorm:"size:100;not null"`
	LastName           string    `gorm:"size:100;not null"`
	Department         string    `gorm:"size:100;not null"`
	Position           string    `gorm:"size:100;not null"`
	Role               string    `gorm:"size:50;not null;check:role IN ('admin', 'safety_officer', 'manager', 'employee')"`
	ReportingManagerID uuid.UUID `gorm:"type:uuid"`
	StartDate          time.Time `gorm:"not null"`
	EndDate            time.Time
	EmergencyContact   JSONB     `gorm:"type:jsonb"`
	ContactNumber      string    `gorm:"size:20"`
	OfficeLocation     string    `gorm:"size:100"`
	IsSafetyOfficer    bool      `gorm:"default:false"`
	IsActive           bool      `gorm:"default:true"`
	CreatedAt          time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt          time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	DeletedAt          time.Time

	// Relationships
	User               User      `gorm:"foreignKey:UserID"`
	ReportingManager   *Employee `gorm:"foreignKey:ReportingManagerID"`
}