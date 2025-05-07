package schema

import (
	"time"

	"github.com/hopkali04/health-sys/internal/models"

	"github.com/google/uuid"
)

// VPCAttachmentResponse represents the API response structure for VPC attachments
type VPCAttachmentResponse struct {
	ID          uuid.UUID `json:"id"`
	FileName    string    `json:"fileName"`
	FileType    string    `json:"fileType"`
	StoragePath string    `json:"storagePath"`
	FileSize    int       `json:"fileSize"`
	CreatedAt   time.Time `json:"createdAt"`
	Uploader    string    `json:"uploader,omitempty"` // "FirstName LastName"
}

func ToVPCResponse(va *models.VPCAttachment) VPCAttachmentResponse {
	uploaderName := ""
	// This requires the Uploader field to be populated (e.g., via GORM Preload)
	if va.Uploader.ID != uuid.Nil {
		uploaderName = va.Uploader.FirstName + " " + va.Uploader.LastName
	}

	// If Uploader is not loaded, uploaderName will be empty.
	// The service layer should handle preloading for responses.

	return VPCAttachmentResponse{
		ID:          va.ID,
		FileName:    va.FileName,
		FileType:    va.FileType,
		StoragePath: va.StoragePath,
		FileSize:    va.FileSize,
		CreatedAt:   va.CreatedAt,
		Uploader:    uploaderName,
	}
}

// ToVPCAttachmentResponses converts a slice of models.VPCAttachment to a slice of VPCAttachmentResponse
func ToVPCAttachmentResponses(attachments []models.VPCAttachment) []VPCAttachmentResponse {
	responses := make([]VPCAttachmentResponse, len(attachments))

	for i, attachment := range attachments {
		// responses[i] = attachment.ToVPCResponse() // Call the model's ToResponse method

		responses[i] = ToVPCResponse(&attachment)

	}
	return responses
}
