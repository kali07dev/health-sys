package models

import (
    "time"
    "github.com/google/uuid"
)

// Interview scheduling and tracking
type InvestigationInterview struct {
    ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    InvestigationID   uuid.UUID `gorm:"type:uuid;not null"`
    IntervieweeID     uuid.UUID `gorm:"type:uuid;not null"`
    ScheduledFor      time.Time `gorm:"not null"`
    Status            string    `gorm:"size:30;not null;default:'scheduled';check:status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')"`
    Notes             string    `gorm:"type:text"`
    Location          string    `gorm:"size:255"`
    CompletedAt       time.Time
    CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`
    UpdatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`

    // Relationships
    Investigation     Investigation `gorm:"foreignKey:InvestigationID"`
    Interviewee      Employee      `gorm:"foreignKey:IntervieweeID"`
}

// Evidence tracking for investigations
type InvestigationEvidence struct {
    ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    InvestigationID   uuid.UUID `gorm:"type:uuid;not null"`
    EvidenceType      string    `gorm:"size:50;not null;check:evidence_type IN ('document', 'photo', 'video', 'physical_item', 'testimony')"`
    Description       string    `gorm:"type:text;not null"`
    FileURL           string    `gorm:"size:512"`
    CollectedAt       time.Time `gorm:"not null"`
    CollectedBy       uuid.UUID `gorm:"type:uuid;not null"`
    StorageLocation   string    `gorm:"size:512"`
    CreatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`
    UpdatedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`

    // Relationships
    Investigation     Investigation `gorm:"foreignKey:InvestigationID"`
    Collector        Employee      `gorm:"foreignKey:CollectedBy"`
}

// Add completion evidence for corrective actions
type ActionEvidence struct {
    ID                 uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
    CorrectiveActionID uuid.UUID `gorm:"type:uuid;not null"`
    FileType           string    `gorm:"size:50;not null;check:file_type IN ('document', 'photo', 'video')"`
    FileName           string    `gorm:"size:255;not null"`
    FileURL            string    `gorm:"size:512;not null"`
    UploadedBy         uuid.UUID `gorm:"type:uuid;not null"`
    UploadedAt         time.Time `gorm:"default:CURRENT_TIMESTAMP"`
    Description        string    `gorm:"type:text"`

    // Relationships
    CorrectiveAction   CorrectiveAction `gorm:"foreignKey:CorrectiveActionID"`
    Uploader          Employee         `gorm:"foreignKey:UploadedBy"`
}