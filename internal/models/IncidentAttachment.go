package models

import (
	"time"

	"github.com/google/uuid"
)

// IncidentAttachment represents the database model for incident attachments
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
	Incident Incident `gorm:"foreignKey:IncidentID"`
	Uploader Employee `gorm:"foreignKey:UploadedBy"`
}

// IncidentAttachmentResponse represents the API response structure
type IncidentAttachmentResponse struct {
	ID          uuid.UUID `json:"id"`
	FileName    string    `json:"fileName"`
	FileType    string    `json:"fileType"`
	StoragePath string    `json:"StoragePath"`
	FileSize    int       `json:"fileSize"`
	CreatedAt   time.Time `json:"createdAt"`
	Uploader    string    `json:"uploader"`
}

// ToResponse converts IncidentAttachment to IncidentAttachmentResponse
func (ia *IncidentAttachment) ToResponse() IncidentAttachmentResponse {
	return IncidentAttachmentResponse{
		ID:          ia.ID,
		FileName:    ia.FileName,
		FileType:    ia.FileType,
		StoragePath: ia.StoragePath,
		FileSize:    ia.FileSize,
		CreatedAt:   ia.CreatedAt,
		Uploader:    ia.Uploader.FirstName + " " + ia.Uploader.LastName,
	}
}

func ToAttachmentResponses(attachments []IncidentAttachment) []IncidentAttachmentResponse {
	responses := make([]IncidentAttachmentResponse, len(attachments))
	for i, attachment := range attachments {
		responses[i] = attachment.ToResponse()
	}
	return responses
}
